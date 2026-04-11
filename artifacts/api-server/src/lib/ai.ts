import OpenAI from "openai";
import { getCached, setCached } from "./videoCache.js";
import type { TranscriptChunk } from "./youtube.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANGUAGE_PROMPTS: Record<string, string> = {
  en: "Respond in English.",
  hi: "Respond in Hindi (Devanagari script).",
  es: "Respond in Spanish.",
};

function relevantChunks(
  chunks: TranscriptChunk[],
  question: string,
  topN = 5
): TranscriptChunk[] {
  if (chunks.length === 0) return [];
  const words = question
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const scored = chunks.map((chunk) => {
    const text = chunk.text.toLowerCase();
    let score = 0;
    for (const word of words) {
      if (text.includes(word)) score++;
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topN).map((s) => s.chunk);
  top.sort((a, b) => a.startTime - b.startTime);
  return top;
}

function buildContext(chunks: TranscriptChunk[]): string {
  return chunks
    .map(
      (c) =>
        `[${Math.floor(c.startTime)}s-${Math.floor(c.endTime)}s]: ${c.text}`
    )
    .join("\n\n");
}

export async function answerQuestion(params: {
  chunks: TranscriptChunk[];
  question: string;
  history: { role: "user" | "assistant"; content: string }[];
  language: string;
  videoId: string;
  suggestedVideos: { title: string; url: string; thumbnail: string }[];
}): Promise<{
  answer: string;
  simpleExplanation: string;
  timestamps: { start: number; end: number }[];
  confidence: "high" | "medium" | "low";
  suggestedVideos: { title: string; url: string; thumbnail: string }[];
}> {
  const top = relevantChunks(params.chunks, params.question);
  const context = buildContext(top);
  const langPrompt = LANGUAGE_PROMPTS[params.language] ?? LANGUAGE_PROMPTS.en;

  const systemPrompt = `You are an intelligent learning assistant for a YouTube video. ${langPrompt}

You have access to the following transcript excerpts from the video:
${context || "(No transcript available — use only what the video title/description suggests)"}

STRICT RULES:
1. Answer ONLY from the provided transcript context above.
2. NEVER hallucinate or invent information not in the transcript.
3. If the answer is not clearly in the transcript, respond with exactly: "This is not clearly covered in the video."
4. Always provide a simple ELI5 explanation after your main answer.
5. Reference timestamps when relevant.
6. Assess your confidence: high (clearly in transcript), medium (inferred), low (not well covered).

Return ONLY valid JSON in this exact format:
{
  "answer": "...",
  "simpleExplanation": "...",
  "timestamps": [{"start": 130, "end": 240}],
  "confidence": "high|medium|low",
  "notCovered": false
}`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...params.history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: params.question },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: {
    answer?: string;
    simpleExplanation?: string;
    timestamps?: { start: number; end: number }[];
    confidence?: string;
    notCovered?: boolean;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const notCovered =
    parsed.notCovered === true ||
    parsed.answer === "This is not clearly covered in the video.";

  return {
    answer: parsed.answer ?? "This is not clearly covered in the video.",
    simpleExplanation: parsed.simpleExplanation ?? "",
    timestamps: parsed.timestamps ?? top.slice(0, 2).map((c) => ({ start: c.startTime, end: c.endTime })),
    confidence: (parsed.confidence as "high" | "medium" | "low") ?? "low",
    suggestedVideos: notCovered ? params.suggestedVideos : [],
  };
}

export async function summarizeVideo(params: {
  chunks: TranscriptChunk[];
  language: string;
}): Promise<{
  shortSummary: string;
  detailedSummary: string;
  keyTakeaways: string[];
}> {
  const { chunks, language } = params;
  const langPrompt = LANGUAGE_PROMPTS[language] ?? LANGUAGE_PROMPTS.en;

  const fullText = chunks
    .map((c) => c.text)
    .join(" ")
    .slice(0, 8000);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a learning assistant. ${langPrompt} Summarize the following video transcript. Return ONLY valid JSON:
{
  "shortSummary": "5-sentence summary",
  "detailedSummary": "comprehensive 2-3 paragraph summary",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4", "takeaway 5"]
}`,
      },
      { role: "user", content: fullText || "No transcript available." },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: {
    shortSummary?: string;
    detailedSummary?: string;
    keyTakeaways?: string[];
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  return {
    shortSummary: parsed.shortSummary ?? "Summary not available.",
    detailedSummary: parsed.detailedSummary ?? "Detailed summary not available.",
    keyTakeaways: parsed.keyTakeaways ?? [],
  };
}

export async function generateNotes(params: {
  chunks: TranscriptChunk[];
  style: "short" | "bullet" | "detailed";
  language: string;
}): Promise<string> {
  const { chunks, style, language } = params;
  const langPrompt = LANGUAGE_PROMPTS[language] ?? LANGUAGE_PROMPTS.en;
  const fullText = chunks
    .map((c) => c.text)
    .join(" ")
    .slice(0, 8000);

  const styleGuide = {
    short: "Generate concise short notes (3-5 sentences max). Focus on the most important points only.",
    bullet: "Generate structured bullet-point notes with clear headings and sub-bullets. Use markdown formatting.",
    detailed:
      "Generate comprehensive detailed notes with sections, subsections, and thorough explanations. Use markdown formatting.",
  }[style];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a study notes generator. ${langPrompt} ${styleGuide}`,
      },
      {
        role: "user",
        content: `Generate ${style} notes from this transcript:\n\n${fullText || "No transcript available."}`,
      },
    ],
    temperature: 0.4,
  });

  return completion.choices[0]?.message?.content ?? "Notes could not be generated.";
}

export async function generateQuiz(params: {
  chunks: TranscriptChunk[];
  language: string;
}): Promise<
  {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[]
> {
  const { chunks, language } = params;
  const langPrompt = LANGUAGE_PROMPTS[language] ?? LANGUAGE_PROMPTS.en;
  const fullText = chunks
    .map((c) => c.text)
    .join(" ")
    .slice(0, 6000);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a quiz generator. ${langPrompt} Generate 7 multiple choice questions based ONLY on the provided transcript. Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}
correctIndex is 0-3 (index into options array). Questions must be factual and answerable from the transcript.`,
      },
      { role: "user", content: fullText || "No transcript available." },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: {
    questions?: {
      id?: string;
      question?: string;
      options?: string[];
      correctIndex?: number;
      explanation?: string;
    }[];
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { questions: [] };
  }

  return (parsed.questions ?? [])
    .filter((q) => q.question && q.options && q.options.length === 4)
    .map((q, i) => ({
      id: q.id ?? `q${i + 1}`,
      question: q.question ?? "",
      options: q.options ?? [],
      correctIndex: q.correctIndex ?? 0,
      explanation: q.explanation ?? "",
    }));
}

export async function explainStuck(params: {
  chunks: TranscriptChunk[];
  concept: string;
  language: string;
}): Promise<{
  simpleExplanation: string;
  analogy: string;
  timestamp: { start: number; end: number } | null;
}> {
  const { chunks, concept, language } = params;
  const langPrompt = LANGUAGE_PROMPTS[language] ?? LANGUAGE_PROMPTS.en;

  const top = relevantChunks(chunks, concept, 3);
  const context = buildContext(top);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a patient tutor helping a student understand something they're stuck on. ${langPrompt}
        
Transcript context:
${context || "(No transcript — explain generally)"}

Return ONLY valid JSON:
{
  "simpleExplanation": "explain in very simple terms, like explaining to a 10-year-old",
  "analogy": "provide a creative real-world analogy to make this click"
}`,
      },
      { role: "user", content: `I'm stuck on: ${concept}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: { simpleExplanation?: string; analogy?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const ts = top[0] ? { start: top[0].startTime, end: top[0].endTime } : null;

  return {
    simpleExplanation: parsed.simpleExplanation ?? "Let me explain this more simply.",
    analogy: parsed.analogy ?? "Think of it like...",
    timestamp: ts,
  };
}
