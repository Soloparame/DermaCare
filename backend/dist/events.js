"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribe = subscribe;
exports.broadcast = broadcast;
const clients = new Map();
const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
function subscribe(res, userId) {
    const id = genId();
    const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    };
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    res.flushHeaders?.();
    res.write(`event: ready\ndata: {}\n\n`);
    const c = { id, res, userId };
    clients.set(id, c);
    res.on("close", () => {
        clients.delete(id);
    });
}
function broadcast(type, data) {
    const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [, c] of clients) {
        try {
            c.res.write(payload);
        }
        catch {
            clients.delete(c.id);
        }
    }
}
