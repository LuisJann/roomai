import fs from "fs";
import path from "path";
import os from "os";

const dbPath = path.join(os.tmpdir(), "roomai_sessions.json");

interface Session {
  createdAt: number;
  photos: Array<{ id: string; name: string; url: string; size: string; uploadedAt: number }>;
}

function readDb(): Record<string, Session> {
  if (!fs.existsSync(dbPath)) return {};
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function writeDb(data: Record<string, Session>) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
}

export function createSession(sessionId: string) {
  const db = readDb();
  db[sessionId] = { createdAt: Date.now(), photos: [] };
  writeDb(db);
}

export function getSession(sessionId: string): Session | null {
  const db = readDb();
  return db[sessionId] || null;
}

export function addPhotoToSession(sessionId: string, photo: Session["photos"][0]) {
  const db = readDb();
  if (!db[sessionId]) return false;
  db[sessionId].photos.push(photo);
  writeDb(db);
  return true;
}
