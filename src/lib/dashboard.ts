import { buildDashboard } from "./metrics";
import {
  getAccountByUsername,
  getRecentSnapshots,
  listAccountsBasic,
  listAllVideos,
} from "./queries";
import type { Dashboard } from "./types";

const SNAPSHOT_DAYS = 60;

function snapshotCutoff(): string {
  return new Date(Date.now() - SNAPSHOT_DAYS * 86_400_000).toISOString();
}

export function getDashboard(): Dashboard {
  return buildDashboard(
    listAccountsBasic(),
    listAllVideos(),
    getRecentSnapshots(snapshotCutoff()),
  );
}

export function getAccountDashboard(username: string): Dashboard | null {
  const account = getAccountByUsername(username);
  if (!account) return null;
  const videos = listAllVideos().filter(
    (video) => video.account_id === account.id,
  );
  const ids = new Set(videos.map((video) => video.id));
  const snapshots = getRecentSnapshots(snapshotCutoff()).filter((snapshot) =>
    ids.has(snapshot.video_id),
  );
  return buildDashboard([account], videos, snapshots);
}
