import { useState, useEffect } from "react";

interface Progress {
  videosWatched: string[];
  timeSpentMinutes: number;
  currentStreak: number;
  lastSessionDate: string | null;
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>({
    videosWatched: [],
    timeSpentMinutes: 0,
    currentStreak: 0,
    lastSessionDate: null,
  });

  useEffect(() => {
    const stored = localStorage.getItem("yt_os_progress");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Calculate streak
        const today = new Date().toDateString();
        let streak = parsed.currentStreak || 0;
        
        if (parsed.lastSessionDate) {
          const lastDate = new Date(parsed.lastSessionDate);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastDate.toDateString() === yesterday.toDateString()) {
            // Continuation of streak, will update when action taken
          } else if (lastDate.toDateString() !== today) {
            streak = 0; // Streak broken
          }
        }
        
        setProgress({ ...parsed, currentStreak: streak });
      } catch (e) {}
    }
  }, []);

  const markVideoWatched = (videoId: string, durationMinutes: number) => {
    setProgress((prev) => {
      const today = new Date().toDateString();
      let newStreak = prev.currentStreak;
      
      if (prev.lastSessionDate !== today) {
        const lastDate = prev.lastSessionDate ? new Date(prev.lastSessionDate) : null;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (!lastDate || lastDate.toDateString() === yesterday.toDateString()) {
          newStreak += 1;
        } else if (lastDate.toDateString() !== today) {
          newStreak = 1;
        }
      }

      const updated = {
        videosWatched: prev.videosWatched.includes(videoId) 
          ? prev.videosWatched 
          : [...prev.videosWatched, videoId],
        timeSpentMinutes: prev.timeSpentMinutes + durationMinutes,
        currentStreak: newStreak,
        lastSessionDate: today,
      };
      
      localStorage.setItem("yt_os_progress", JSON.stringify(updated));
      return updated;
    });
  };

  return { progress, markVideoWatched };
}
