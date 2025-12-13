"use client";

import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface StatusIndicatorProps {
  syncing?: boolean;
  pendingCount?: number;
}

export const StatusIndicator = ({
  syncing = false,
  pendingCount = 0,
}: StatusIndicatorProps) => {
  const { isOnline } = useOnlineStatus();
  const t = useTranslations("StatusIndicator");

  return (
    <div className="flex items-center gap-3">
      <AnimatePresence mode="wait">
        {syncing ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-700"
          >
            <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 sync-spin" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {t("syncing")}
            </span>
          </motion.div>
        ) : isOnline ? (
          <motion.div
            key="online"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-700"
          >
            <div className="relative">
              <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 status-pulse" />
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {t("online")}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700"
          >
            <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              {t("offline")}
            </span>
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
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              isOnline ? "bg-primary status-pulse" : "bg-muted-foreground"
            )}
          />
          {pendingCount} {t("pending")}
        </motion.div>
      )}
    </div>
  );
};
