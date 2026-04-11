import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { extractVideoId } from "@/lib/youtube";
import { useProgress } from "@/hooks/use-progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flame, Play, Search, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const { progress } = useProgress();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!url.trim()) return;
    
    const videoId = extractVideoId(url);
    if (videoId) {
      setLocation(`/learn/${videoId}`);
    } else {
      setError("Invalid YouTube URL. Please check and try again.");
      toast({
        title: "Invalid URL",
        description: "Could not extract video ID from the provided URL.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#050B14] overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Lumina OS</span>
        </div>
        
        <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Flame className={`w-4 h-4 ${progress.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
            <span className="font-medium">{progress.currentStreak} Day Streak</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="font-medium">{Math.round(progress.timeSpentMinutes / 60)}h Learned</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center w-full"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel mb-8 border-primary/30">
            <span className="flex w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary-foreground/80">Lumina Intelligence v2.0 Online</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6 leading-tight">
            Learn anything from <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-blue-400">
              YouTube instantly.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Paste any video URL to generate intelligent notes, interactive quizzes, and a real-time AI tutor that understands the entire transcript.
          </p>

          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative glass-card p-2 rounded-2xl flex items-center gap-2 bg-background/80 focus-within:bg-background transition-colors">
              <Search className="w-6 h-6 text-muted-foreground ml-3" />
              <Input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg h-14 placeholder:text-muted-foreground/50"
              />
              <Button type="submit" size="lg" className="rounded-xl h-14 px-8 bg-white text-black hover:bg-gray-200 text-base font-semibold transition-all hover:scale-105">
                Analyze
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            {error && (
              <p className="absolute -bottom-8 left-0 text-red-400 text-sm">{error}</p>
            )}
          </form>
        </motion.div>

        {progress.videosWatched.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-24 w-full"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Sessions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {progress.videosWatched.slice(-3).reverse().map((id) => (
                <div 
                  key={id} 
                  onClick={() => setLocation(`/learn/${id}`)}
                  className="glass-card p-4 flex gap-4 items-center cursor-pointer group"
                >
                  <div className="w-24 h-16 rounded-lg overflow-hidden relative flex-shrink-0 bg-muted">
                    <img 
                      src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} 
                      alt="Thumbnail"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div>
                    <p className="font-medium text-sm line-clamp-2 text-white/90 group-hover:text-primary transition-colors">
                      Resume session
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">ID: {id}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
