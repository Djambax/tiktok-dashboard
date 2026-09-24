import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const MAX_VIDEOS_PER_ACCOUNT = 50;

const BINARIES = [
  process.env.YTDLP_PATH,
  "yt-dlp",
  "/opt/homebrew/bin/yt-dlp",
  "/usr/local/bin/yt-dlp",
].filter((b): b is string => Boolean(b));

export type YtThumbnail = { id?: string; url?: string; preference?: number };

export type YtEntry = {
  id: string;
  url?: string;
  title?: string;
  description?: string;
  timestamp?: number;
  duration?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  repost_count?: number;
  save_count?: number;
  thumbnails?: YtThumbnail[];
};

export type AccountVideos = {
  secUid: string | null;
  entries: YtEntry[];
};

async function run(args: string[]): Promise<string> {
  const cookiesFrom = process.env.YTDLP_COOKIES_FROM_BROWSER?.trim();
  const finalArgs = cookiesFrom
    ? ["--cookies-from-browser", cookiesFrom, ...args]
    : args;
  for (const bin of BINARIES) {
    try {
      const { stdout } = await execFileAsync(bin, finalArgs, {
        maxBuffer: 256 * 1024 * 1024,
        timeout: 120_000,
      });
      return stdout;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        continue;
      }
      const stderr = (error as { stderr?: string }).stderr ?? "";
      const firstError = stderr
        .split("\n")
        .find((line) => line.includes("ERROR"));
      throw new Error(
        firstError?.replace(/^ERROR:\s*/, "").trim() ||
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }
  throw new Error(
    `yt-dlp introuvable (${BINARIES.join(", ")}). Installe-le avec: brew install yt-dlp`,
  );
}

export async function fetchAccountVideos(
  username: string,
  limit = MAX_VIDEOS_PER_ACCOUNT,
): Promise<AccountVideos> {
  const stdout = await run([
    "--flat-playlist",
    "--playlist-end",
    String(limit),
    "--no-warnings",
    "-J",
    `https://www.tiktok.com/@${username}`,
  ]);
  let data: { id?: string; entries?: YtEntry[] };
  try {
    data = JSON.parse(stdout) as { id?: string; entries?: YtEntry[] };
  } catch {
    throw new Error("Réponse yt-dlp illisible (JSON invalide)");
  }
  const entries = (data.entries ?? []).filter((entry): entry is YtEntry =>
    Boolean(entry?.id),
  );
  if (entries.length === 0) {
    throw new Error(
      `Aucune vidéo trouvée pour @${username} (compte inexistant ou vide ?)`,
    );
  }
  return { secUid: data.id ?? null, entries };
}

export function normalizeUsername(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, "")
    .replace(/^@+/, "")
    .replace(/[/?#].*$/, "")
    .toLowerCase();
}

export function thumbnailUrl(entry: YtEntry): string | null {
  const thumbs = entry.thumbnails ?? [];
  return (
    thumbs.find((t) => t.id === "cover")?.url ??
    thumbs.find((t) => t.url)?.url ??
    null
  );
}
