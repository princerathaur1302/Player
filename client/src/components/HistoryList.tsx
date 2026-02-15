import { useHistory, useCreateHistory } from "@/hooks/use-history";
import { format } from "date-fns";
import { PlayCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface HistoryListProps {
  onSelect: (url: string, referrer?: string) => void;
}

export function HistoryList({ onSelect }: HistoryListProps) {
  const { data: history, isLoading } = useHistory();

  if (isLoading) return <div className="h-32 animate-pulse bg-card/50 rounded-xl" />;
  if (!history?.length) return null;

  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center gap-3 border-b border-border/50 pb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold font-display">Recent Streams</h2>
      </div>
      
      <div className="grid gap-3">
        {history.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(item.url, item.referrer || undefined)}
            className="group glass-panel p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors border border-border/50 hover:border-primary/50"
          >
            <div className="min-w-0 flex-1 mr-4 overflow-hidden">
              <h3 className="font-medium text-foreground truncate">{item.title || "Untitled Stream"}</h3>
              <p className="text-sm text-muted-foreground break-all mt-1 font-mono">{item.url}</p>
              {item.referrer && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium flex-shrink-0">Ref</span>
                  <span className="text-xs text-muted-foreground break-all">{item.referrer}</span>
                </div>
              )}
            </div>
            
            <button className="p-3 rounded-full bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110">
              <PlayCircle className="w-6 h-6" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
