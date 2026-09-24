import fs from "node:fs";
import path from "node:path";
import { getDb, nowIso, THUMBS_DIR } from "./db";
import { fetchAccountVideos, thumbnailUrl, type AccountVideos } from "./ytdlp";
import type { Account, RefreshJob } from "./types";

const globalForJob = globalThis as unknown as { __refreshJob?: RefreshJob };

const THUMB_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Referer: "https://www.tiktok.com/",
};

type SnapshotRow = {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
};

function toCount(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sameSnapshot(a: SnapshotRow, b: SnapshotRow): boolean {
  return (
    a.views === b.views &&
    a.likes === b.likes &&
    a.comments === b.comments &&
    a.shares === b.shares &&
    a.saves === b.saves
  );
}

async function downloadThumb(id: string, url: string): Promise<string | null> {
  const filename = `${id}.jpg`;
  const dest = path.join(THUMBS_DIR, filename);
  if (fs.existsSync(dest)) return filename;
  try {
    const response = await fetch(url, { headers: THUMB_HEADERS });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 1000) return null;
    fs.writeFileSync(dest, buffer);
    return filename;
  } catch {
    return null;
  }
}

export async function collectAccount(
  account: Account,
  preloaded?: AccountVideos,
): Promise<{ videosFound: number; newVideos: number }> {
  const db = getDb();
  const data = preloaded ?? (await fetchAccountVideos(account.username));
  const capturedAt = nowIso();

  if (data.secUid && !account.sec_uid) {
    db.prepare("UPDATE accounts SET sec_uid = ? WHERE id = ?").run(
      data.secUid,
      account.id,
    );
  }

  const findVideo = db.prepare(
    "SELECT id, thumbnail_path FROM videos WHERE id = ?",
  );
  const insertVideo = db.prepare(
    `INSERT INTO videos (id, account_id, url, description, duration, published_at, thumbnail_path, first_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
  );
  const updateVideo = db.prepare(
    `UPDATE videos SET url = ?, description = ?, duration = ?, published_at = ?
     WHERE id = ?`,
  );
  const findLastSnapshot = db.prepare(
    `SELECT views, likes, comments, shares, saves FROM snapshots
     WHERE video_id = ? ORDER BY captured_at DESC, id DESC LIMIT 1`,
  );
  const insertSnapshot = db.prepare(
    `INSERT INTO snapshots (video_id, captured_at, views, likes, comments, shares, saves)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const setThumb = db.prepare(
    "UPDATE videos SET thumbnail_path = ? WHERE id = ?",
  );

  let newVideos = 0;
  const pendingThumbs: { id: string; url: string }[] = [];

  for (const entry of data.entries) {
    const url =
      entry.url ??
      `https://www.tiktok.com/@${account.username}/video/${entry.id}`;
    const description = entry.description ?? entry.title ?? null;
    const duration = toCount(entry.duration);
    const publishedAt = entry.timestamp
      ? new Date(entry.timestamp * 1000).toISOString()
      : null;
    const snapshot: SnapshotRow = {
      views: toCount(entry.view_count),
      likes: toCount(entry.like_count),
      comments: toCount(entry.comment_count),
      shares: toCount(entry.repost_count),
      saves: toCount(entry.save_count),
    };

    const existing = findVideo.get(entry.id) as
      { id: string; thumbnail_path: string | null } | undefined;

    if (!existing) {
      insertVideo.run(
        entry.id,
        account.id,
        url,
        description,
        duration,
        publishedAt,
        capturedAt,
      );
      newVideos++;
    } else {
      updateVideo.run(url, description, duration, publishedAt, entry.id);
    }

    const last = findLastSnapshot.get(entry.id) as SnapshotRow | undefined;
    if (!last || !sameSnapshot(last, snapshot)) {
      insertSnapshot.run(
        entry.id,
        capturedAt,
        snapshot.views,
        snapshot.likes,
        snapshot.comments,
        snapshot.shares,
        snapshot.saves,
      );
    }

    const thumb = thumbnailUrl(entry);
    const hasThumb = existing?.thumbnail_path ?? null;
    if (
      thumb &&
      !hasThumb &&
      !fs.existsSync(path.join(THUMBS_DIR, `${entry.id}.jpg`))
    ) {
      pendingThumbs.push({ id: entry.id, url: thumb });
    }
  }

  for (let i = 0; i < pendingThumbs.length; i += 6) {
    const chunk = pendingThumbs.slice(i, i + 6);
    await Promise.all(
      chunk.map(async ({ id, url }) => {
        const filename = await downloadThumb(id, url);
        if (filename) setThumb.run(filename, id);
      }),
    );
  }

  db.prepare("UPDATE accounts SET last_collected_at = ? WHERE id = ?").run(
    capturedAt,
    account.id,
  );

  return { videosFound: data.entries.length, newVideos };
}

export function getJob(): RefreshJob | null {
  return globalForJob.__refreshJob ?? null;
}

export function startRefresh(): RefreshJob {
  const existing = globalForJob.__refreshJob;
  if (existing && existing.status === "running") return existing;

  const db = getDb();
  const accounts = db
    .prepare("SELECT * FROM accounts ORDER BY id")
    .all() as unknown as Account[];

  const job: RefreshJob = {
    status: "running",
    startedAt: nowIso(),
    finishedAt: null,
    current: 0,
    accounts: accounts.map((account) => ({
      username: account.username,
      status: "pending",
    })),
  };
  globalForJob.__refreshJob = job;
  void runRefresh(accounts, job);
  return job;
}

async function runRefresh(accounts: Account[], job: RefreshJob): Promise<void> {
  const db = getDb();
  for (let i = 0; i < accounts.length; i++) {
    const item = job.accounts[i];
    job.current = i;
    item.status = "running";
    try {
      const fresh = db
        .prepare("SELECT * FROM accounts WHERE id = ?")
        .get(accounts[i].id) as unknown as Account | undefined;
      if (!fresh) {
        item.status = "error";
        item.error = "Compte supprimé";
        continue;
      }
      const result = await collectAccount(fresh);
      item.status = "done";
      item.videosFound = result.videosFound;
      item.newVideos = result.newVideos;
    } catch (error) {
      item.status = "error";
      item.error = error instanceof Error ? error.message : String(error);
    }
    if (i < accounts.length - 1) await sleep(700);
  }
  job.status = "done";
  job.finishedAt = nowIso();
}
