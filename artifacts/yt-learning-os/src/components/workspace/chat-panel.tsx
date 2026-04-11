import { useState, useEffect, useRef } from "react";
import { useAiChat } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatMessage } from "@workspace/api-client-react";

interface TimestampRef {
  start: number;
  end: number;
}

interface ChatPanelProps {
  videoId: string;
  onSeek: (seconds: number) => void;
}

export default function ChatPanel({ videoId, onSeek }: ChatPanelProps) {
  const [messages, setMessages] = useState<Array<{role: "user"|"assistant", content: string, details?: any}>>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatMutation = useAiChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, chatMutation.isPending]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);

    const history = messages.map(m => ({ role: m.role, content: m.content })) as ChatMessage[];

    chatMutation.mutate({
      data: {
        videoId,
        question: userMsg,
        history,
        language: "en"
      }
    }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.answer,
          details: {
            simple: data.simpleExplanation,
            timestamps: data.timestamps,
            confidence: data.confidence,
            suggested: data.suggestedVideos
          }
        }]);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <Bot className="w-16 h-16 mb-4 text-primary" />
            <h3 className="text-xl font-medium text-white mb-2">Lumina AI Tutor</h3>
            <p className="text-sm text-white/60 max-w-[250px]">
              Ask any question about the video. I've analyzed the entire transcript.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
              }`}>
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                <div className={`p-4 rounded-2xl ${
                  msg.role === "user" 
                    ? "bg-accent/10 border border-accent/20 text-white rounded-tr-sm" 
                    : "bg-white/5 border border-white/10 text-white rounded-tl-sm"
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                </div>

                {msg.details && (
                  <div className="w-full space-y-3 mt-2">
                    {msg.details.simple && (
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-xs text-primary/80 font-medium mb-1">ELI5 (Explain Like I'm 5):</p>
                        <p className="text-sm text-white/80">{msg.details.simple}</p>
                      </div>
                    )}
                    
                    {msg.details.timestamps && msg.details.timestamps.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.details.timestamps.map((t: TimestampRef, i: number) => (
                          <button
                            key={i}
                            onClick={() => onSeek(t.start)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-blue-400 transition-colors"
                          >
                            <Clock size={12} />
                            {formatTime(t.start)} - {formatTime(t.end)}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.details.confidence === "low" && (
                      <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20">
                        <AlertTriangle size={14} />
                        Low confidence. The video might not cover this deeply.
                      </div>
                    )}

                    {msg.details.suggested && msg.details.suggested.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-white/50 mb-2 uppercase tracking-wider font-semibold">Suggested Videos</p>
                        <div className="space-y-2">
                          {msg.details.suggested.map((vid: any, i: number) => (
                            <a 
                              key={i}
                              href={vid.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors group"
                            >
                              <img src={vid.thumbnail} className="w-16 h-9 object-cover rounded bg-white/10" alt="" />
                              <span className="text-xs text-white/80 line-clamp-2 flex-1 group-hover:text-primary transition-colors">{vid.title}</span>
                              <ChevronRight size={14} className="text-white/30 group-hover:text-white" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
        
        {chatMutation.isPending && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-primary animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm w-24 flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-black/20 border-t border-white/10 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the video..."
            className="min-h-[52px] max-h-[150px] resize-none bg-white/5 border-white/10 focus-visible:ring-primary/50 rounded-xl pr-12 text-sm py-3.5"
            rows={1}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || chatMutation.isPending}
            className="absolute right-2 bottom-1.5 h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 text-white"
          >
            <Send size={16} className={input.trim() && !chatMutation.isPending ? "text-white" : "text-white/50"} />
          </Button>
        </form>
      </div>
    </div>
  );
}
