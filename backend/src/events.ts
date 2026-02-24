import type { Response } from "express";

type Client = { id: string; res: Response; userId: string };
const clients = new Map<string, Client>();

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function subscribe(res: Response, userId: string) {
  const id = genId();
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  } as Record<string, string>;
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.flushHeaders?.();
  res.write(`event: ready\ndata: {}\n\n`);
  const c: Client = { id, res, userId };
  clients.set(id, c);
  res.on("close", () => {
    clients.delete(id);
  });
}

export function broadcast(type: string, data: unknown) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [, c] of clients) {
    try {
      c.res.write(payload);
    } catch {
      clients.delete(c.id);
    }
  }
}
