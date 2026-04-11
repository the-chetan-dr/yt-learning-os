import { useState, useRef, useEffect } from "react";
import { useRoute } from "wouter";
import { useGetVideoInfo } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, FileText, CheckCircle, PlayCircle, Info } from "lucide-react";
import { motion } from "framer-motion";
import ChatPanel from "@/components/workspace/chat-panel";
import SummaryPanel from "@/components/workspace/summary-panel";
import NotesPanel from "@/components/workspace/notes-panel";
import QuizPanel from "@/components/workspace/quiz-panel";
import RecommendationsPanel from "@/components/workspace/recommendations-panel";
import StuckModal from "@/components/workspace/stuck-modal";
import { useProgress } from "@/hooks/use-progress";

export default function Learn() {
  const [, params] = useRoute("/learn/:videoId");
  const videoId = params?.videoId;
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [stuckModalOpen, setStuckModalOpen] = useState(false);
  
  const { data: videoInfo, isLoading, error } = useGetVideoInfo(
    { videoId: videoId || "" },
    { query: { enabled: !!videoId } }
  );

  const { markVideoWatched } = useProgress();

  useEffect(() => {
    if (videoInfo) {
      markVideoWatched(videoInfo.videoId, Math.round(videoInfo.duration / 60));
    }
  }, [videoInfo]);

  const handleSeek = (seconds: number) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: "seekTo",
          args: [seconds, true],
        }),
        "*"
      );
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: "playVideo",
          args: [],
        }),
        "*"
      );
    }
  };

  if (!videoId) return null;

  return (
    <div className="h-[100dvh] w-full bg-[#050B14] flex flex-col md:flex-row overflow-hidden relative">
      {/* Background Noise */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none z-0" />
      
      {/* LEFT PANEL: Video & Metadata */}
      <div className="w-full md:w-[55%] lg:w-[60%] flex flex-col h-[40vh] md:h-full border-b md:border-b-0 md:border-r border-white/10 z-10 relative">
        <div className="w-full aspect-video bg-black shrink-0 relative">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0`}
            className="w-full h-full absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4 bg-white/10" />
              <Skeleton className="h-4 w-1/2 bg-white/10" />
              <Skeleton className="h-24 w-full bg-white/10 mt-6" />
            </div>
          ) : error ? (
            <div className="p-6 glass-panel rounded-xl text-center">
              <Info className="w-8 h-8 text-destructive mx-auto mb-3" />
              <p className="text-white font-medium">Failed to load video info</p>
              <p className="text-muted-foreground text-sm mt-1">Please try another video.</p>
            </div>
          ) : videoInfo ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{videoInfo.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1 font-medium text-white/80">
                  <PlayCircle className="w-4 h-4 text-primary" />
                  {videoInfo.channelName}
                </span>
                <span>•</span>
                <span>{Math.floor(videoInfo.duration / 60)}:{String(videoInfo.duration % 60).padStart(2, '0')}</span>
                <span>•</span>
                <span className={videoInfo.hasTranscript ? "text-green-400" : "text-yellow-400"}>
                  {videoInfo.hasTranscript ? "Transcript Available" : "No Transcript"}
                </span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                {videoInfo.description?.slice(0, 300)}
                {videoInfo.description?.length > 300 ? "..." : ""}
              </p>
            </motion.div>
          ) : null}
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-3">
          <Button 
            size="icon" 
            variant="outline" 
            className="w-12 h-12 rounded-full glass-panel border-primary/20 hover:border-primary text-primary hover:text-primary-foreground hover:bg-primary transition-all hover:scale-110 shadow-lg"
            onClick={() => setActiveTab("notes")}
            title="Generate Notes"
          >
            <FileText className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            className="w-12 h-12 rounded-full glass-panel border-accent/20 hover:border-accent text-accent hover:text-accent-foreground hover:bg-accent transition-all hover:scale-110 shadow-lg"
            onClick={() => setActiveTab("quiz")}
            title="Take Quiz"
          >
            <CheckCircle className="w-5 h-5" />
          </Button>
          <Button 
            size="lg" 
            className="rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all hover:scale-105 font-bold tracking-wide"
            onClick={() => setStuckModalOpen(true)}
          >
            <BrainCircuit className="w-5 h-5 mr-2" />
            I'm Stuck
          </Button>
        </div>
      </div>

      {/* RIGHT PANEL: AI Workspace */}
      <div className="w-full md:w-[45%] lg:w-[40%] h-[60vh] md:h-full bg-black/40 backdrop-blur-xl z-10 flex flex-col border-l border-white/5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full h-full overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
            <TabsList className="w-full bg-white/5 p-1 rounded-xl grid grid-cols-5 h-12">
              <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-xs lg:text-sm">Chat</TabsTrigger>
              <TabsTrigger value="summary" className="rounded-lg data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all text-xs lg:text-sm">Summary</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all text-xs lg:text-sm">Notes</TabsTrigger>
              <TabsTrigger value="quiz" className="rounded-lg data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all text-xs lg:text-sm">Quiz</TabsTrigger>
              <TabsTrigger value="recs" className="rounded-lg data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all text-xs lg:text-sm">More</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden relative">
              <TabsContent value="chat" className="h-full m-0 p-0 absolute inset-0 outline-none data-[state=inactive]:hidden">
                <ChatPanel videoId={videoId} onSeek={handleSeek} />
              </TabsContent>
              <TabsContent value="summary" className="h-full m-0 p-0 absolute inset-0 outline-none data-[state=inactive]:hidden">
                <SummaryPanel videoId={videoId} />
              </TabsContent>
              <TabsContent value="notes" className="h-full m-0 p-0 absolute inset-0 outline-none data-[state=inactive]:hidden">
                <NotesPanel videoId={videoId} />
              </TabsContent>
              <TabsContent value="quiz" className="h-full m-0 p-0 absolute inset-0 outline-none data-[state=inactive]:hidden">
                <QuizPanel videoId={videoId} />
              </TabsContent>
              <TabsContent value="recs" className="h-full m-0 p-0 absolute inset-0 outline-none data-[state=inactive]:hidden">
                <RecommendationsPanel videoId={videoId} />
              </TabsContent>
          </div>
        </Tabs>
      </div>

      <StuckModal 
        isOpen={stuckModalOpen} 
        onClose={() => setStuckModalOpen(false)} 
        videoId={videoId} 
        onSeek={handleSeek}
      />
    </div>
  );
}
