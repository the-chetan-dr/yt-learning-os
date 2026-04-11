import { YoutubeTranscript } from "youtube-transcript/dist/youtube-transcript.esm.js";
import { getCached, setCached } from "./videoCache.js";
import { logger } from "./logger.js";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export interface TranscriptChunk {
  text: string;
  startTime: number;
  endTime: number;
}

export interface VideoInfo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  duration: number;
  description: string;
  hasTranscript: boolean;
  chunks: TranscriptChunk[];
}

export function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  return h * 3600 + m * 60 + s;
}

async function fetchYouTubeMetadata(videoId: string): Promise<{
  title: string;
  thumbnail: string;
  channelName: string;
  duration: number;
  description: string;
} | null> {
  if (!YOUTUBE_API_KEY) {
    logger.warn("YOUTUBE_API_KEY not set, using fallback metadata");
    return null;
  }
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    items?: {
      snippet: {
        title: string;
        thumbnails: { maxres?: { url: string }; high?: { url: string } };
        channelTitle: string;
        description: string;
      };
      contentDetails: { duration: string };
    }[];
  };
  const item = data.items?.[0];
  if (!item) return null;
  return {
    title: item.snippet.title,
    thumbnail:
      item.snippet.thumbnails.maxres?.url ??
      item.snippet.thumbnails.high?.url ??
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    channelName: item.snippet.channelTitle,
    duration: parseDuration(item.contentDetails.duration),
    description: item.snippet.description.slice(0, 2000),
  };
}

function chunkTranscript(
  entries: { text: string; offset: number; duration: number }[]
): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = [];
  let buffer = "";
  let startTime = 0;
  let endTime = 0;
  const TARGET_CHARS = 2000;

  for (const entry of entries) {
    const cleanText = entry.text.replace(/\[.*?\]/g, "").trim();
    if (!cleanText) continue;
    if (buffer === "") {
      startTime = entry.offset / 1000;
    }
    buffer += " " + cleanText;
    endTime = (entry.offset + entry.duration) / 1000;

    if (buffer.length >= TARGET_CHARS) {
      chunks.push({ text: buffer.trim(), startTime, endTime });
      buffer = "";
    }
  }
  if (buffer.trim()) {
    chunks.push({ text: buffer.trim(), startTime, endTime });
  }
  return chunks;
}

export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const cacheKey = `video:${videoId}`;
  const cached = getCached<VideoInfo>(cacheKey);
  if (cached) return cached;

  const [metadata, transcriptEntries] = await Promise.allSettled([
    fetchYouTubeMetadata(videoId),
    YoutubeTranscript.fetchTranscript(videoId),
  ]);

  const meta =
    metadata.status === "fulfilled" && metadata.value
      ? metadata.value
      : {
          title: `YouTube Video (${videoId})`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          channelName: "Unknown Channel",
          duration: 0,
          description: "",
        };

  let chunks: TranscriptChunk[] = [];
  let hasTranscript = false;

  if (
    transcriptEntries.status === "fulfilled" &&
    transcriptEntries.value.length > 0
  ) {
    hasTranscript = true;
    chunks = chunkTranscript(transcriptEntries.value);
  } else {
    if (meta.description) {
      chunks = [
        {
          text: meta.description,
          startTime: 0,
          endTime: meta.duration,
        },
      ];
    }
  }

  const info: VideoInfo = {
    videoId,
    ...meta,
    hasTranscript,
    chunks,
  };

  setCached(cacheKey, info);
  return info;
}

export async function getRecommendations(
  videoId: string,
  query?: string
): Promise<{ title: string; url: string; thumbnail: string }[]> {
  if (!YOUTUBE_API_KEY) return [];

  const searchQuery = query ?? videoId;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&relatedToVideoId=${videoId}&maxResults=6&key=${YOUTUBE_API_KEY}`;
  const fallbackUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(searchQuery)}&maxResults=6&key=${YOUTUBE_API_KEY}`;

  async function tryFetch(fetchUrl: string) {
    const res = await fetch(fetchUrl);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items?: {
        id: { videoId: string };
        snippet: {
          title: string;
          thumbnails: { high?: { url: string }; default?: { url: string } };
        };
      }[];
    };
    return (data.items ?? [])
      .filter((item) => item.id.videoId && item.id.videoId !== videoId)
      .slice(0, 3)
      .map((item) => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail:
          item.snippet.thumbnails.high?.url ??
          item.snippet.thumbnails.default?.url ??
          "",
      }));
  }

  try {
    const results = await tryFetch(url);
    if (results.length > 0) return results;
    return await tryFetch(fallbackUrl);
  } catch {
    return [];
  }
}
