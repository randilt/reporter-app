"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Register service worker
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New version available
                  toast.info("Update available", {
                    description: "A new version is ready. Refresh to update.",
                    action: {
                      label: "Refresh",
                      onClick: () => window.location.reload(),
                    },
                    duration: 10000,
                  });
                }
              });
            }
          });

          // Check for updates periodically (every hour)
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((err) => {
          console.error("[PWA] Service Worker registration failed:", err);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SYNC_SUCCESS") {
          toast.success("Report synced", {
            description: "Your report was successfully uploaded.",
          });
        }

        if (event.data && event.data.type === "SYNC_COMPLETE") {
          const { successCount, failCount } = event.data;
          if (successCount > 0) {
            toast.success(`${successCount} report(s) synced`, {
              description:
                failCount > 0
                  ? `${failCount} failed and will retry later.`
                  : "All reports uploaded successfully.",
            });
          }
        }
      });
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log("[PWA] Install prompt available");

      // Show install prompt after a delay
      setTimeout(() => {
        toast.info("Install Aegis Reporter", {
          description: "Install the app for offline access and quick launch.",
          action: {
            label: "Install",
            onClick: () => {
              if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                  if (choiceResult.outcome === "accepted") {
                    console.log("[PWA] User accepted the install prompt");
                  } else {
                    console.log("[PWA] User dismissed the install prompt");
                  }
                  setDeferredPrompt(null);
                });
              }
            },
          },
          duration: 10000,
        });
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Handle app installation
    window.addEventListener("appinstalled", () => {
      console.log("[PWA] App installed successfully");
      toast.success("App installed!", {
        description: "Aegis Reporter is now installed on your device.",
      });
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [deferredPrompt]);

  return <>{children}</>;
}
