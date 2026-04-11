import { useState } from "react";
import { useGenerateNotes } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Copy, Check, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface NotesPanelProps {
  videoId: string;
}

type NoteStyle = "short" | "bullet" | "detailed";

export default function NotesPanel({ videoId }: NotesPanelProps) {
  const [style, setStyle] = useState<NoteStyle>("bullet");
  const [language, setLanguage] = useState<"en" | "hi" | "es">("en");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const notesMutation = useGenerateNotes();

  const handleGenerate = () => {
    notesMutation.mutate({ data: { videoId, style, language } });
  };

  const handleCopy = () => {
    if (!notesMutation.data?.notes) return;
    navigator.clipboard.writeText(notesMutation.data.notes);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!notesMutation.data?.notes) return;
    const blob = new Blob([notesMutation.data.notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${videoId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderNotes = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) {
        return <h2 key={i} className="text-lg font-bold text-white mt-6 mb-2">{line.slice(2)}</h2>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={i} className="text-base font-semibold text-violet-300 mt-4 mb-1">{line.slice(3)}</h3>;
      }
      if (line.startsWith("### ")) {
        return <h4 key={i} className="text-sm font-semibold text-cyan-300 mt-3 mb-1">{line.slice(4)}</h4>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={i} className="text-sm text-white/80 leading-relaxed ml-4 flex items-start gap-2">
            <span className="text-primary mt-1.5 shrink-0">•</span>
            <span>{line.slice(2)}</span>
          </li>
        );
      }
      if (line.match(/^\d+\. /)) {
        return (
          <li key={i} className="text-sm text-white/80 leading-relaxed ml-4 list-decimal">
            {line.replace(/^\d+\. /, "")}
          </li>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="text-sm font-semibold text-white mt-2">{line.slice(2, -2)}</p>;
      }
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      return <p key={i} className="text-sm text-white/80 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {!notesMutation.data && !notesMutation.isPending ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 p-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Generate Notes</h3>
            <p className="text-sm text-white/50 max-w-[240px] mx-auto">
              Create structured study notes from the video transcript.
            </p>
          </div>

          <div className="flex gap-2">
            {(["short", "bullet", "detailed"] as NoteStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                  style === s
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-white/10 text-white/50 hover:border-white/30"
                }`}
              >
                {s}
              </button>
            ))}
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
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Notes
          </Button>
        </div>
      ) : (
        <>
          {notesMutation.isPending ? (
            <div className="flex-1 p-6 space-y-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className={`h-4 bg-white/10 ${i % 3 === 0 ? "w-1/2" : "w-full"}`} />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
                <div className="flex gap-2">
                  {(["short", "bullet", "detailed"] as NoteStyle[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setStyle(s); notesMutation.mutate({ data: { videoId, style: s, language } }); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors capitalize ${
                        style === s
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-white/10 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white" onClick={handleDownload}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 overflow-y-auto p-6 custom-scrollbar"
              >
                <div className="space-y-1">
                  {notesMutation.data && renderNotes(notesMutation.data.notes)}
                </div>
              </motion.div>
            </>
          )}
        </>
      )}
    </div>
  );
}
