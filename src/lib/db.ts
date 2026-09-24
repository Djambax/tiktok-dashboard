import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const globalForDb = globalThis as unknown as { __tiktokDb?: DatabaseSync };

export const DATA_DIR = path.join(process.cwd(), "data");
export const THUMBS_DIR = path.join(DATA_DIR, "thumbs");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  sec_uid TEXT,
  followers INTEGER,
  added_at TEXT NOT NULL,
  last_collected_at TEXT
);

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  description TEXT,
  duration INTEGER,
  published_at TEXT,
  thumbnail_path TEXT,
  first_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  captured_at TEXT NOT NULL,
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER
);

CREATE INDEX IF NOT EXISTS idx_snapshots_video ON snapshots(video_id, captured_at);
CREATE INDEX IF NOT EXISTS idx_videos_account ON videos(account_id, published_at);
`;

function createDb(): DatabaseSync {
  fs.mkdirSync(THUMBS_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, "tiktok.db"));
  db.exec(SCHEMA);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__tiktokDb) {
    globalForDb.__tiktokDb = createDb();
  }
  return globalForDb.__tiktokDb;
}

export function nowIso(): string {
  return new Date().toISOString();
}
