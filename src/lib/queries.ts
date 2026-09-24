import { getDb } from "./db";
import type { Account, SnapshotLite, VideoWithStats } from "./types";

const VIDEO_FIELDS = `v.*, a.username,
  s.views, s.likes, s.comments, s.shares, s.saves, s.captured_at,
  (SELECT COUNT(*) FROM snapshots s3 WHERE s3.video_id = v.id) AS snapshot_count`;

const LATEST_SNAPSHOT = `(SELECT s2.id FROM snapshots s2 WHERE s2.video_id = v.id ORDER BY s2.captured_at DESC, s2.id DESC LIMIT 1)`;

const FROM_VIDEOS = `FROM videos v
  JOIN accounts a ON a.id = v.account_id
  LEFT JOIN snapshots s ON s.id = ${LATEST_SNAPSHOT}`;

export function listAccountsBasic(): Account[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM accounts ORDER BY username")
    .all() as unknown as Account[];
}

export function getAccountByUsername(username: string): Account | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM accounts WHERE username = ?")
    .get(username) as unknown as Account | undefined;
  return row ?? null;
}

export function listAllVideos(): VideoWithStats[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT ${VIDEO_FIELDS} ${FROM_VIDEOS}
       ORDER BY v.published_at DESC`,
    )
    .all() as unknown as VideoWithStats[];
}

export function getRecentSnapshots(sinceIso: string): SnapshotLite[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT video_id, captured_at, views FROM snapshots
       WHERE captured_at >= ? ORDER BY captured_at`,
    )
    .all(sinceIso) as unknown as SnapshotLite[];
}

export function getVideoById(id: string): VideoWithStats | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT ${VIDEO_FIELDS} ${FROM_VIDEOS} WHERE v.id = ?`)
    .get(id) as unknown as VideoWithStats | undefined;
  return row ?? null;
}

export function getVideoSnapshots(id: string): SnapshotLite[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT video_id, captured_at, views FROM snapshots
       WHERE video_id = ? ORDER BY captured_at`,
    )
    .all(id) as unknown as SnapshotLite[];
}
