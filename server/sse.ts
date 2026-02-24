import type { Response } from "express";

const clients = new Set<Response>();

export function addSseClient(res: Response): void {
  clients.add(res);
  res.on("close", () => clients.delete(res));
}

/**
 * Notify all connected clients that the opinion list has changed.
 * Called after any admin moderation action (hide/delete/approve/reject).
 */
export function broadcastOpinionChange(): void {
  const payload = `data: ${JSON.stringify({ type: "opinion_change" })}\n\n`;
  clients.forEach((client) => client.write(payload));
}
