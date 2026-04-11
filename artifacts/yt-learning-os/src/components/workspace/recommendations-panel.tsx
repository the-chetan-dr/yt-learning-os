import { useGetRecommendations, getGetRecommendationsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Tv } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface RecommendationsPanelProps {
  videoId: string;
}

export default function RecommendationsPanel({ videoId }: RecommendationsPanelProps) {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useGetRecommendations(
    { videoId },
    { query: { enabled: !!videoId, queryKey: getGetRecommendationsQueryKey({ videoId }) } }
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-32 h-20 rounded-xl bg-white/10 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-3/4 bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data?.videos || data.videos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-4 p-6">
        <Tv className="w-12 h-12 text-white/20" />
        <p className="text-white/40 text-sm">No recommendations available.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4 custom-scrollbar">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-6">Related Videos</h4>
      {data.videos.map((video, i) => {
        const match = video.url.match(/[?&]v=([^&]+)/);
        const vid = match?.[1];

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            {vid ? (
              <button
                onClick={() => setLocation(`/learn/${vid}`)}
                className="w-full flex gap-4 items-start p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group text-left"
              >
                <div className="w-32 h-20 rounded-xl overflow-hidden shrink-0 bg-black relative">
                  {video.thumbnail && (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-medium text-white/90 line-clamp-3 group-hover:text-primary transition-colors leading-snug">
                    {video.title}
                  </p>
                  <p className="text-xs text-white/30 mt-2 group-hover:text-white/50 transition-colors">
                    Open in Lumina
                  </p>
                </div>
              </button>
            ) : (
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="flex gap-4 items-start p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
              >
                <div className="w-32 h-20 rounded-xl overflow-hidden shrink-0 bg-black relative">
                  {video.thumbnail && (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-medium text-white/90 line-clamp-3 group-hover:text-primary transition-colors">
                    {video.title}
                  </p>
                  <span className="flex items-center gap-1 text-xs text-white/30 mt-2">
                    <ExternalLink className="w-3 h-3" /> YouTube
                  </span>
                </div>
              </a>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
