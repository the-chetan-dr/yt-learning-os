import { useState } from "react";
import { useSummarizeVideo } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, BookOpen, List, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SummaryPanelProps {
  videoId: string;
}

export default function SummaryPanel({ videoId }: SummaryPanelProps) {
  const [language, setLanguage] = useState<"en" | "hi" | "es">("en");
  const [detailedOpen, setDetailedOpen] = useState(false);
  const summarize = useSummarizeVideo();

  const handleGenerate = () => {
    summarize.mutate({ data: { videoId, language } });
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar p-6 gap-6">
      {!summarize.data && !summarize.isPending && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Generate Summary</h3>
            <p className="text-sm text-white/50 max-w-[240px] mx-auto">
              Get a short overview, detailed breakdown, and key takeaways from the video.
            </p>
          </div>

          <div className="flex gap-2">
            {(["en", "hi", "es"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  language === lang
                    ? "bg-primary border-primary text-white"
                    : "border-white/10 text-white/50 hover:border-white/30"
                }`}
              >
                {lang === "en" ? "English" : lang === "hi" ? "Hindi" : "Spanish"}
              </button>
            ))}
          </div>

          <Button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Summary
          </Button>
        </motion.div>
      )}

      {summarize.isPending && (
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 bg-white/10" />
            <Skeleton className="h-4 w-full bg-white/10" />
            <Skeleton className="h-4 w-full bg-white/10" />
            <Skeleton className="h-4 w-3/4 bg-white/10" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-28 bg-white/10" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-full bg-white/10" />
            ))}
          </div>
        </div>
      )}

      {summarize.data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Short Summary */}
          <div className="p-5 rounded-2xl bg-violet-500/5 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-violet-400" />
              <h4 className="text-sm font-semibold text-violet-300 uppercase tracking-wider">Quick Summary</h4>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{summarize.data.shortSummary}</p>
          </div>

          {/* Key Takeaways */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <List className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">Key Takeaways</h4>
            </div>
            <ul className="space-y-3">
              {summarize.data.keyTakeaways.map((tk, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    {i + 1}
                  </span>
                  {tk}
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Summary */}
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setDetailedOpen((o) => !o)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-semibold text-white/80">Detailed Summary</span>
              {detailedOpen ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </button>
            <AnimatePresence>
              {detailedOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5">
                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                      {summarize.data.detailedSummary}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            className="border-white/10 text-white/50 hover:text-white hover:border-white/30"
          >
            Regenerate
          </Button>
        </motion.div>
      )}
    </div>
  );
}
