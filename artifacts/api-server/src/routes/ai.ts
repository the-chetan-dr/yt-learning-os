import { Router } from "express";
import { getCached } from "../lib/videoCache.js";
import type { VideoInfo } from "../lib/youtube.js";
import { getRecommendations } from "../lib/youtube.js";
import {
  answerQuestion,
  summarizeVideo,
  generateNotes,
  generateQuiz,
  explainStuck,
} from "../lib/ai.js";
import {
  AiChatBody,
  SummarizeVideoBody,
  GenerateNotesBody,
  GenerateQuizBody,
  ImStuckBody,
} from "@workspace/api-zod";

const router = Router();

function getVideoChunks(videoId: string) {
  const cached = getCached<VideoInfo>(`video:${videoId}`);
  return cached?.chunks ?? [];
}

router.post("/ai/chat", async (req, res) => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid request body" });
    return;
  }

  const { videoId, question, history, language } = parsed.data;
  const chunks = getVideoChunks(videoId);

  try {
    const suggestedVideos = await getRecommendations(videoId, question).catch(() => []);
    const result = await answerQuestion({
      chunks,
      question,
      history: (history ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      language: language ?? "en",
      videoId,
      suggestedVideos,
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    res.status(500).json({ error: "ai_error", message: "Failed to generate response" });
  }
});

router.post("/ai/summarize", async (req, res) => {
  const parsed = SummarizeVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid request body" });
    return;
  }

  const { videoId, language } = parsed.data;
  const chunks = getVideoChunks(videoId);

  try {
    const result = await summarizeVideo({ chunks, language: language ?? "en" });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Summarize error");
    res.status(500).json({ error: "ai_error", message: "Failed to generate summary" });
  }
});

router.post("/ai/notes", async (req, res) => {
  const parsed = GenerateNotesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid request body" });
    return;
  }

  const { videoId, style, language } = parsed.data;
  const chunks = getVideoChunks(videoId);

  try {
    const notes = await generateNotes({
      chunks,
      style: (style ?? "bullet") as "short" | "bullet" | "detailed",
      language: language ?? "en",
    });
    res.json({ notes, style: style ?? "bullet" });
  } catch (err) {
    req.log.error({ err }, "Notes error");
    res.status(500).json({ error: "ai_error", message: "Failed to generate notes" });
  }
});

router.post("/ai/quiz", async (req, res) => {
  const parsed = GenerateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid request body" });
    return;
  }

  const { videoId, language } = parsed.data;
  const chunks = getVideoChunks(videoId);

  try {
    const questions = await generateQuiz({ chunks, language: language ?? "en" });
    res.json({ questions });
  } catch (err) {
    req.log.error({ err }, "Quiz error");
    res.status(500).json({ error: "ai_error", message: "Failed to generate quiz" });
  }
});

router.post("/ai/stuck", async (req, res) => {
  const parsed = ImStuckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid request body" });
    return;
  }

  const { videoId, concept, language } = parsed.data;
  const chunks = getVideoChunks(videoId);

  try {
    const [explanation, suggestedVideos] = await Promise.all([
      explainStuck({ chunks, concept, language: language ?? "en" }),
      getRecommendations(videoId, concept).catch(() => []),
    ]);
    res.json({
      simpleExplanation: explanation.simpleExplanation,
      analogy: explanation.analogy,
      timestamp: explanation.timestamp,
      suggestedVideos,
    });
  } catch (err) {
    req.log.error({ err }, "Stuck mode error");
    res.status(500).json({ error: "ai_error", message: "Failed to generate explanation" });
  }
});

export default router;
