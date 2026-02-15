import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { VideoPlayer } from "@/components/VideoPlayer";
import { HistoryList } from "@/components/HistoryList";
import { useCreateHistory, useClearHistory } from "@/hooks/use-history";
import { streamRequestSchema } from "@shared/schema";
import { Play, Download, Trash2, Link as LinkIcon, Globe, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type FormData = z.infer<typeof streamRequestSchema>;

export default function Home() {
  const [activeStream, setActiveStream] = useState<{ url: string; referrer?: string } | null>(null);
  const createHistory = useCreateHistory();
  const clearHistory = useClearHistory();

  const form = useForm<FormData>({
    resolver: zodResolver(streamRequestSchema),
    defaultValues: {
      url: "",
      referrer: "",
    },
  });

  const onSubmit = (data: FormData) => {
    setActiveStream(data);
    createHistory.mutate({
      url: data.url,
      referrer: data.referrer,
      title: `Stream ${new Date().toLocaleTimeString()}`,
    });
  };

  const handleHistorySelect = (url: string, referrer?: string) => {
    form.setValue("url", url);
    form.setValue("referrer", referrer || "");
    setActiveStream({ url, referrer });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getProxyUrl = (url: string, referrer?: string) => {
    const params = new URLSearchParams();
    params.set("url", url);
    if (referrer) params.set("referrer", referrer);
    return `/api/proxy/manifest?${params.toString()}`;
  };

  const handleDownload = () => {
    const values = form.getValues();
    if (!values.url) return;
    
    // For now, download the M3U8 directly
    const link = document.createElement('a');
    link.href = getProxyUrl(values.url, values.referrer);
    link.download = 'stream.m3u8';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25">
            <Play className="w-5 h-5 text-white fill-current" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight">
            Stream<span className="text-primary">X</span>
          </h1>
        </div>
        
        <button 
          onClick={() => clearHistory.mutate()}
          className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
          Clear History
        </button>
      </header>

      <main className="grid lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-8">
          {/* Player Section */}
          <section className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative">
              {activeStream ? (
                <VideoPlayer 
                  key={`${activeStream.url}-${activeStream.referrer}`} // Force remount on change
                  src={getProxyUrl(activeStream.url, activeStream.referrer)} 
                  autoPlay 
                />
              ) : (
                <div className="aspect-video rounded-xl bg-card border border-white/5 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Play className="w-8 h-8 opacity-50 ml-1" />
                  </div>
                  <p className="font-medium">Enter a URL to start watching</p>
                </div>
              )}
            </div>
          </section>

          {/* History Section (Mobile/Tablet usually, strictly below player on desktop left col) */}
          <div className="lg:hidden">
            <HistoryList onSelect={handleHistorySelect} />
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          <div className="glass-panel p-6 rounded-2xl sticky top-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Stream Configuration
            </h2>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5" /> Source URL (.m3u8)
                </label>
                <div className="relative group">
                  <input
                    {...form.register("url")}
                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                    placeholder="https://example.com/video.m3u8"
                  />
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
                </div>
                {form.formState.errors.url && (
                  <p className="text-xs text-destructive ml-1">{form.formState.errors.url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Referrer URL
                </label>
                <input
                  {...form.register("referrer")}
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                  placeholder="https://website.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!form.watch("url")}
                  className="px-4 py-3 rounded-xl font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  type="submit"
                  disabled={createHistory.isPending}
                  className="px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {createHistory.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Play Stream
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="hidden lg:block">
            <HistoryList onSelect={handleHistorySelect} />
          </div>
        </div>
      </main>
    </div>
  );
}
