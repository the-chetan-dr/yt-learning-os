import { useState } from "react";
import { useImStuck } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Clock, ChevronRight, Zap, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

interface StuckModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  onSeek: (seconds: number) => void;
}

export default function StuckModal({ isOpen, onClose, videoId, onSeek }: StuckModalProps) {
  const [concept, setConcept] = useState("");
  const [language, setLanguage] = useState<"en" | "hi" | "es">("en");
  const [, setLocation] = useLocation();
  const stuckMutation = useImStuck();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;
    stuckMutation.mutate({ data: { videoId, concept: concept.trim(), language } });
  };

  const handleClose = () => {
    stuckMutation.reset();
    setConcept("");
    onClose();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0D1117] border border-white/10 text-white max-w-md w-full rounded-2xl p-0 overflow-hidden shadow-2xl shadow-black/50">
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-white/10 p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-red-400" />
              </div>
              I'm Stuck
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/50 mt-2">
            Tell me what's confusing you and I'll break it down simply with an analogy.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {!stuckMutation.data ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="What are you stuck on? e.g. 'gradient descent'"
                  className="bg-white/5 border-white/10 focus-visible:ring-red-500/30 rounded-xl text-white placeholder:text-white/30 h-12"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                {(["en", "hi", "es"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      language === lang
                        ? "bg-primary border-primary text-white"
                        : "border-white/10 text-white/50 hover:border-white/30"
                    }`}
                  >
                    {lang === "en" ? "EN" : lang === "hi" ? "HI" : "ES"}
                  </button>
                ))}
              </div>

              {stuckMutation.isPending ? (
                <div className="space-y-3 pt-4">
                  <Skeleton className="h-4 w-full bg-white/10" />
                  <Skeleton className="h-4 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-full bg-white/10" />
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={!concept.trim() || stuckMutation.isPending}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl h-12"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Explain It Simply
                </Button>
              )}
            </form>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Simple Explanation */}
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Simple Explanation</p>
                  <p className="text-sm text-white/85 leading-relaxed">{stuckMutation.data.simpleExplanation}</p>
                </div>

                {/* Analogy */}
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                    <Lightbulb className="inline w-3.5 h-3.5 mr-1" />
                    Analogy
                  </p>
                  <p className="text-sm text-white/85 leading-relaxed">{stuckMutation.data.analogy}</p>
                </div>

                {/* Timestamp */}
                {stuckMutation.data.timestamp && (
                  <button
                    onClick={() => {
                      onSeek(stuckMutation.data!.timestamp!.start);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors w-full"
                  >
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm text-white/80">
                      Jump to {formatTime(stuckMutation.data.timestamp.start)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/30 ml-auto" />
                  </button>
                )}

                {/* Suggested Videos */}
                {stuckMutation.data.suggestedVideos && stuckMutation.data.suggestedVideos.length > 0 && (
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Better Resources</p>
                    <div className="space-y-2">
                      {stuckMutation.data.suggestedVideos.slice(0, 2).map((v, i) => {
                        const match = v.url.match(/[?&]v=([^&]+)/);
                        const vid = match?.[1];
                        return vid ? (
                          <button
                            key={i}
                            onClick={() => { setLocation(`/learn/${vid}`); onClose(); }}
                            className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                          >
                            {v.thumbnail && <img src={v.thumbnail} className="w-12 h-8 rounded object-cover" alt="" />}
                            <span className="text-xs text-white/70 line-clamp-2 flex-1">{v.title}</span>
                            <ChevronRight className="w-3 h-3 text-white/30 shrink-0" />
                          </button>
                        ) : (
                          <a key={i} href={v.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            {v.thumbnail && <img src={v.thumbnail} className="w-12 h-8 rounded object-cover" alt="" />}
                            <span className="text-xs text-white/70 line-clamp-2 flex-1">{v.title}</span>
                            <ExternalLink className="w-3 h-3 text-white/30 shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { stuckMutation.reset(); setConcept(""); }}
                  className="w-full border-white/10 text-white/50 hover:text-white"
                >
                  Ask Another Question
                </Button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
