import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { getUserIdFromBearerToken } from '../middleware/auth';
import logger from '../utils/logger';

const topicSockets = new Map<string, Set<WebSocket>>();
const userSockets = new Map<string, Set<WebSocket>>();

function addSocket(map: Map<string, Set<WebSocket>>, key: string, ws: WebSocket): void {
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  set.add(ws);
}

function removeSocket(map: Map<string, Set<WebSocket>>, key: string, ws: WebSocket): void {
  const set = map.get(key);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) map.delete(key);
}

function removeSocketFromAllTopics(ws: WebSocket, topics: Set<string>): void {
  topics.forEach((t) => removeSocket(topicSockets, t, ws));
}

/** Підписники на тред (inq:… / rnt:…). */
export function broadcastChatTopic(topic: string, payload: object): void {
  const set = topicSockets.get(topic);
  if (!set?.size) return;
  const msg = JSON.stringify(payload);
  for (const client of set) {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
}

/** Особистий канал користувача (бейджі непрочитаних). */
export function broadcastToUser(userId: string, payload: object): void {
  const uid = String(userId).toLowerCase();
  const set = userSockets.get(`user:${uid}`);
  if (!set?.size) return;
  const msg = JSON.stringify(payload);
  for (const client of set) {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
}

export function attachChatWebSocket(server: Server, pathname: string): void {
  const wss = new WebSocketServer({ server, path: pathname });

  wss.on('connection', (ws, req) => {
    const token = new URL(req.url || '', 'http://localhost').searchParams.get('token');
    if (!token) {
      ws.close(1008, 'Unauthorized');
      return;
    }
    const userId = getUserIdFromBearerToken(token);
    if (!userId) {
      ws.close(1008, 'Unauthorized');
      return;
    }
    const uid = String(userId).toLowerCase();
    const subscribedTopics = new Set<string>();

    addSocket(userSockets, `user:${uid}`, ws);

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(String(raw)) as { type?: string; topics?: unknown };
        if (data.type === 'subscribe' && Array.isArray(data.topics)) {
          for (const t of data.topics) {
            if (typeof t !== 'string' || !t) continue;
            subscribedTopics.add(t);
            addSocket(topicSockets, t, ws);
          }
        }
        if (data.type === 'unsubscribe' && Array.isArray(data.topics)) {
          for (const t of data.topics) {
            if (typeof t !== 'string') continue;
            subscribedTopics.delete(t);
            removeSocket(topicSockets, t, ws);
          }
        }
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (e) {
        logger.warn('chat ws: bad message', { error: e });
      }
    });

    ws.on('close', () => {
      removeSocket(userSockets, `user:${uid}`, ws);
      removeSocketFromAllTopics(ws, subscribedTopics);
    });

    ws.send(JSON.stringify({ type: 'connected', userId: uid }));
  });

  logger.info(`Chat WebSocket listening on ${pathname}`);
}
