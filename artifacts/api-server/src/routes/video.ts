import { Router } from "express";
import { z } from "zod/v4";
import { getVideoInfo, getRecommendations, extractVideoId } from "../lib/youtube.js";
import {
  GetVideoInfoQueryParams,
  GetRecommendationsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/video/info", async (req, res) => {
  const parsed = GetVideoInfoQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "bad_request", message: "Missing or invalid videoId" });
    return;
  }

  const rawId = parsed.data.videoId;
  const videoId = extractVideoId(rawId) ?? rawId;

  if (!videoId || videoId.length < 5) {
    res.status(400).json({ error: "bad_request", message: "Invalid YouTube video ID or URL" });
    return;
  }

  try {
    const info = await getVideoInfo(videoId);
    res.json(info);
  } catch (err: unknown) {
    req.log.error({ err }, "Failed to fetch video info");
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Could not get") || msg.includes("disabled") || msg.includes("not found")) {
      res.status(404).json({ error: "not_found", message: "Video not found or unavailable" });
    } else {
      res.status(500).json({ error: "server_error", message: "Failed to fetch video info" });
    }
  }
});

router.get("/video/recommendations", async (req, res) => {
  const parsed = GetRecommendationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "bad_request", message: "Missing videoId" });
    return;
  }

  try {
    const videos = await getRecommendations(
      parsed.data.videoId,
      parsed.data.query ?? undefined
    );
    res.json({ videos });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch recommendations");
    res.json({ videos: [] });
  }
});

export default router;
