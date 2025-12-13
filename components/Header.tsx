import { motion } from 'framer-motion';
import { Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from './StatusIndicator';
import { useReports } from '@/hooks/useReports';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export const Header = () => {
  const { pendingCount, syncing, syncAllPending } = useReports();
  const { isOnline } = useOnlineStatus();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
    >
      <div className="container py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Project Aegis</h1>
              <p className="text-xs text-muted-foreground">Field Reporter</p>
            </div>
          </div>

          {/* Status & Sync */}
          <div className="flex items-center gap-2">
            <StatusIndicator syncing={syncing} pendingCount={pendingCount} />
            
            {isOnline && pendingCount > 0 && !syncing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={syncAllPending}
                className="h-9 w-9"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};
