"use client";

import { useEffect, useRef } from "react";

export function DueNotifier() {
  const lastCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    async function checkDue() {
      try {
        const res = await fetch("/api/due-count");
        if (!res.ok) return;
        const { count } = await res.json() as { count: number };

        if (
          lastCountRef.current !== null &&
          count > lastCountRef.current &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("openNotes", { body: "You have cards due!" });
        }
        lastCountRef.current = count;
      } catch {
        // ignore network errors
      }
    }

    checkDue();
    const id = setInterval(checkDue, 60_000);
    return () => clearInterval(id);
  }, []);

  return null;
}
