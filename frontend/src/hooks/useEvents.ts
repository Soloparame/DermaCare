"use client";

import { useEffect, useRef } from "react";

export function useEvents(onEvent: (type: string, data: unknown) => void) {
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("derma_token");
    if (!token) return;
    const url = "/api/events";
    const es = new EventSource(url);
    // EventSource in browsers doesn't allow custom headers; we fall back to token via cookie in prod proxy or reject in dev.
    // As a workaround for dev, we re-open via fetch-based polyfill if needed; for now, rely on proxy passing Authorization header if configured.
    es.addEventListener("chat_message", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        onEvent("chat_message", data);
      } catch {
        onEvent("chat_message", null);
      }
    });
    es.addEventListener("ready", () => onEvent("ready", {}));
    sourceRef.current = es;
    return () => {
      es.close();
      sourceRef.current = null;
    };
  }, [onEvent]);
}
