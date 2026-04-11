import { useState } from "react";
import { useGenerateQuiz } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Trophy, RotateCcw, BrainCircuit, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuizPanelProps {
  videoId: string;
}

export default function QuizPanel({ videoId }: QuizPanelProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const quizMutation = useGenerateQuiz();

  const handleGenerate = () => {
    setSelectedAnswers({});
    setRevealed({});
    setShowResults(false);
    quizMutation.mutate({ data: { videoId } });
  };

  const handleSelect = (qId: string, optIdx: number, correctIdx: number) => {
    if (revealed[qId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
    setRevealed((prev) => ({ ...prev, [qId]: true }));
  };

  const score = quizMutation.data
    ? quizMutation.data.questions.filter((q) => selectedAnswers[q.id] === q.correctIndex).length
    : 0;

  const total = quizMutation.data?.questions.length ?? 0;
  const allAnswered = total > 0 && Object.keys(revealed).length === total;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {!quizMutation.data && !quizMutation.isPending ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 p-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <BrainCircuit className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Take a Quiz</h3>
            <p className="text-sm text-white/50 max-w-[240px] mx-auto">
              Test your understanding with AI-generated questions based strictly on the video content.
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <BrainCircuit className="w-4 h-4 mr-2" />
            Generate Quiz
          </Button>
        </div>
      ) : quizMutation.isPending ? (
        <div className="flex-1 p-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-full bg-white/10" />
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-12 w-full bg-white/10 rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Score Header */}
          <div className="px-6 py-3 border-b border-white/10 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">
                {Object.keys(revealed).length}/{total} answered
                {allAnswered && (
                  <span className="ml-2 text-emerald-400">
                    · Score: {score}/{total}
                  </span>
                )}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              className="text-white/50 hover:text-white h-8 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {allAnswered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl text-center"
                style={{
                  background: score >= total * 0.8
                    ? "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))"
                    : "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))",
                  border: score >= total * 0.8 ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(245,158,11,0.2)"
                }}
              >
                <Trophy className={`w-10 h-10 mx-auto mb-3 ${score >= total * 0.8 ? "text-emerald-400" : "text-yellow-400"}`} />
                <p className="text-2xl font-bold text-white">{score}/{total}</p>
                <p className="text-sm text-white/60 mt-1">
                  {score >= total * 0.8 ? "Excellent work!" : score >= total * 0.5 ? "Good effort!" : "Keep learning!"}
                </p>
              </motion.div>
            )}

            {quizMutation.data?.questions.map((q, qIdx) => {
              const sel = selectedAnswers[q.id];
              const isRevealed = !!revealed[q.id];
              const isCorrect = sel === q.correctIndex;

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: qIdx * 0.05 }}
                  className="space-y-3"
                >
                  <p className="text-sm font-medium text-white/90">
                    <span className="text-primary mr-2">Q{qIdx + 1}.</span>
                    {q.question}
                  </p>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = sel === optIdx;
                      const isCorrectOpt = optIdx === q.correctIndex;
                      let cls = "flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-all ";

                      if (!isRevealed) {
                        cls += "border-white/10 bg-white/[0.03] hover:bg-white/10 hover:border-white/20 text-white/80";
                      } else if (isCorrectOpt) {
                        cls += "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
                      } else if (isSelected && !isCorrect) {
                        cls += "border-red-500/40 bg-red-500/10 text-red-300";
                      } else {
                        cls += "border-white/5 bg-white/[0.02] text-white/40";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelect(q.id, optIdx, q.correctIndex)}
                          className={cls}
                          disabled={isRevealed}
                        >
                          <span className={`w-5 h-5 rounded-full border text-xs flex items-center justify-center shrink-0 font-medium ${
                            !isRevealed ? "border-white/20 text-white/40" :
                            isCorrectOpt ? "border-emerald-400 text-emerald-400" :
                            isSelected ? "border-red-400 text-red-400" :
                            "border-white/10 text-white/20"
                          }`}>
                            {["A","B","C","D"][optIdx]}
                          </span>
                          <span className="flex-1 text-left">{opt}</span>
                          {isRevealed && isCorrectOpt && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {isRevealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {isRevealed && q.explanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-2"
                    >
                      <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-200/80">{q.explanation}</p>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
