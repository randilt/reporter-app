"use client";

import { useState, useEffect } from "react";
import { getCurrentResponder, type ResponderProfile } from "@/lib/db";

export function useResponder() {
  const [responder, setResponder] = useState<ResponderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResponder = async () => {
      try {
        const profile = await getCurrentResponder();
        setResponder(profile);
      } catch (error) {
        console.error("[RESPONDER] Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResponder();
  }, []);

  const refreshResponder = async () => {
    const profile = await getCurrentResponder();
    setResponder(profile);
  };

  return {
    responder,
    loading,
    isRegistered: !!responder,
    refreshResponder,
  };
}
