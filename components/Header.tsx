"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "./StatusIndicator";
import { SafePlaceDialog } from "./SafePlaceDialog";
import { useReports } from "@/hooks/useReports";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import LanguageSwitcher from "./LanguageSwitcher";

export const Header = () => {
  const { pendingCount, syncing, syncAllPending } = useReports();
  const { isOnline } = useOnlineStatus();
  const [safePlaceDialogOpen, setSafePlaceDialogOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4"
      >
        <div className="container py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Safe Place Button - Left */}
            <button
              onClick={() => setSafePlaceDialogOpen(true)}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-950 hover:bg-green-200 dark:hover:bg-green-900 transition-colors cursor-pointer"
              title="Mark Safe Place"
            >
              <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </button>

            {/* Status Indicator - Centered */}
            <div className="flex-1 flex justify-center">
              <StatusIndicator syncing={syncing} pendingCount={pendingCount} />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {isOnline && pendingCount > 0 && !syncing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={syncAllPending}
                  className="h-9 w-9"
                  title="Sync pending reports"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </motion.header>

      <SafePlaceDialog
        open={safePlaceDialogOpen}
        onOpenChange={setSafePlaceDialogOpen}
      />
    </>
  );
};
