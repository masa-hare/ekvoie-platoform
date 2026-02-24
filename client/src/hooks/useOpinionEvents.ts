import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Connects to the server's SSE stream and invalidates opinion caches
 * whenever an admin performs a moderation action (hide / delete / approve / reject).
 * This makes the user-facing view update instantly without polling.
 */
export function useOpinionEvents() {
  const utils = trpc.useUtils();

  useEffect(() => {
    const es = new EventSource("/api/events");

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type: string };
        if (data.type === "opinion_change") {
          utils.opinions.list.invalidate();
          utils.opinions.getById.invalidate();
        }
      } catch {
        // ignore malformed messages
      }
    };

    // Reconnect automatically on error (EventSource already retries, but
    // we close explicitly to ensure a clean reconnect cycle if needed)
    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [utils]);
}
