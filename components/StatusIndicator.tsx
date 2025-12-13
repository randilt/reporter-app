import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  syncing?: boolean;
  pendingCount?: number;
}

export const StatusIndicator = ({ syncing = false, pendingCount = 0 }: StatusIndicatorProps) => {
  const { isOnline } = useOnlineStatus();

  return (
    <div className="flex items-center gap-3">
      <AnimatePresence mode="wait">
        {syncing ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30"
          >
            <RefreshCw className="w-4 h-4 text-primary sync-spin" />
            <span className="text-sm font-medium text-primary">Syncing...</span>
          </motion.div>
        ) : isOnline ? (
          <motion.div
            key="online"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/20 border border-success/30"
          >
            <div className="relative">
              <Wifi className="w-4 h-4 text-success" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success status-pulse" />
            </div>
            <span className="text-sm font-medium text-success">Online</span>
          </motion.div>
        ) : (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/20 border border-destructive/30"
          >
            <WifiOff className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Offline</span>
          </motion.div>
        )}
      </AnimatePresence>

      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
            isOnline 
              ? "bg-primary/20 text-primary" 
              : "bg-muted text-muted-foreground"
          )}
        >
          <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-primary status-pulse" : "bg-muted-foreground")} />
          {pendingCount} pending
        </motion.div>
      )}
    </div>
  );
};
