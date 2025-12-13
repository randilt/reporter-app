"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, List, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { IncidentForm } from "@/components/IncidentForm";
import { ReportsList } from "@/components/ReportsList";
import { Button } from "@/components/ui/button";
import { useReports } from "@/hooks/useReports";
import { cn } from "@/lib/utils";
import type { SyncStatus } from "@/lib/db";
import { useTranslations } from "next-intl";

type View = "new" | "queue";
type QueueFilter = SyncStatus | "all";

const Index = () => {
  const [view, setView] = useState<View>("new");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");
  const { pendingCount, syncedCount, failedCount } = useReports();
  const t = useTranslations("HomePage");
  const tList = useTranslations("ReportsList");

  const filterTabs: {
    value: QueueFilter;
    label: string;
    count: number;
    icon: typeof Clock;
  }[] = [
    {
      value: "all",
      label: t("all"),
      count: pendingCount + syncedCount + failedCount,
      icon: List,
    },
    {
      value: "pending",
      label: tList("pending"),
      count: pendingCount,
      icon: Clock,
    },
    {
      value: "synced",
      label: tList("synced"),
      count: syncedCount,
      icon: CheckCircle,
    },
    {
      value: "failed",
      label: tList("failed"),
      count: failedCount,
      icon: AlertCircle,
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4 mx-auto container">
      <Header />

      <main className="container py-6 pb-32">
        <AnimatePresence mode="wait">
          {view === "new" ? (
            <motion.div
              key="new"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">
                  {t("newIncidentReport")}
                </h2>
                <p className="text-muted-foreground">{t("newIncidentDesc")}</p>
              </div>

              <IncidentForm onSuccess={() => setView("queue")} />
            </motion.div>
          ) : (
            <motion.div
              key="queue"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">{t("reportQueue")}</h2>
                <p className="text-muted-foreground">{t("reportQueueDesc")}</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
                {filterTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setQueueFilter(tab.value)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium",
                        queueFilter === tab.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {tab.count > 0 && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded-full text-xs font-bold",
                            queueFilter === tab.value
                              ? "bg-primary-foreground/20"
                              : "bg-muted"
                          )}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <ReportsList filter={queueFilter} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-card/90 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="container py-3">
          <div className="flex gap-2">
            <Button
              variant={view === "new" ? "default" : "secondary"}
              className={cn(
                "flex-1 h-14 text-base font-semibold gap-2",
                view === "new" && "glow-primary"
              )}
              onClick={() => setView("new")}
            >
              <Plus className="w-5 h-5" />
              {t("newReport")}
            </Button>
            <Button
              variant={view === "queue" ? "default" : "secondary"}
              className={cn(
                "flex-1 h-14 text-base font-semibold gap-2 relative",
                view === "queue" && "glow-primary"
              )}
              onClick={() => setView("queue")}
            >
              <List className="w-5 h-5" />
              {t("queue")}
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pending text-xs font-bold flex items-center justify-center text-background">
                  {pendingCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Index;
