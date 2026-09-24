import type {
  Account,
  AccountMetrics,
  AccountStatus,
  DailyPoint,
  Dashboard,
  DashboardTotals,
  SnapshotLite,
  VideoMetrics,
  VideoStatus,
  VideoWithStats,
} from "./types";

const HOUR = 3_600_000;
const DAY = 86_400_000;
const SUSPECT_RATIO = 0.3;
const MEDIAN_WINDOW = 20;
const MEDIAN_MIN_SAMPLE = 3;
const HEALTH_WINDOW = 10;
const HEALTH_MIN_SAMPLE = 3;
const DAILY_DAYS = 14;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function views24h(
  publishedAt: string | null,
  snapshots: SnapshotLite[],
): number | null {
  if (!publishedAt) return null;
  const published = Date.parse(publishedAt);
  if (Number.isNaN(published)) return null;
  let best: { distance: number; views: number } | null = null;
  for (const snapshot of snapshots) {
    if (snapshot.views === null) continue;
    const ageHours = (Date.parse(snapshot.captured_at) - published) / HOUR;
    if (ageHours < 12 || ageHours > 48) continue;
    const distance = Math.abs(ageHours - 24);
    if (!best || distance < best.distance) {
      best = { distance, views: snapshot.views };
    }
  }
  return best ? best.views : null;
}

function buildDaily(videos: VideoWithStats[], days = DAILY_DAYS): DailyPoint[] {
  const byDay = new Map<string, number>();
  for (const video of videos) {
    if (!video.published_at) continue;
    const key = video.published_at.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + (video.views ?? 0));
  }
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  });
  const points: DailyPoint[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * DAY);
    const key = date.toISOString().slice(0, 10);
    points.push({
      date: key,
      label: formatter.format(date),
      views: byDay.get(key) ?? 0,
    });
  }
  return points;
}

export function buildDashboard(
  accounts: Account[],
  videos: VideoWithStats[],
  snapshots: SnapshotLite[],
): Dashboard {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * DAY;
  const fourteenDaysAgo = now - 14 * DAY;

  const snapsByVideo = new Map<string, SnapshotLite[]>();
  for (const snapshot of snapshots) {
    const list = snapsByVideo.get(snapshot.video_id);
    if (list) list.push(snapshot);
    else snapsByVideo.set(snapshot.video_id, [snapshot]);
  }

  const videosByAccount = new Map<number, VideoWithStats[]>();
  for (const video of videos) {
    const list = videosByAccount.get(video.account_id);
    if (list) list.push(video);
    else videosByAccount.set(video.account_id, [video]);
  }

  const views24hByVideo = new Map<string, number | null>();
  for (const video of videos) {
    views24hByVideo.set(
      video.id,
      views24h(video.published_at, snapsByVideo.get(video.id) ?? []),
    );
  }

  const medianByAccount = new Map<number, number | null>();
  for (const account of accounts) {
    const accountVideos = videosByAccount.get(account.id) ?? [];
    const values: number[] = [];
    for (const video of accountVideos) {
      if (!video.published_at) continue;
      if (now - Date.parse(video.published_at) < DAY) continue;
      const value = views24hByVideo.get(video.id);
      if (typeof value === "number") values.push(value);
      if (values.length >= MEDIAN_WINDOW) break;
    }
    medianByAccount.set(
      account.id,
      values.length >= MEDIAN_MIN_SAMPLE ? median(values) : null,
    );
  }

  const videoMetrics: VideoMetrics[] = videos.map((video) => {
    const value = views24hByVideo.get(video.id) ?? null;
    const medianValue = medianByAccount.get(video.account_id) ?? null;
    let status: VideoStatus = "nodata";
    let ratio: number | null = null;
    if (video.published_at && now - Date.parse(video.published_at) < DAY) {
      status = "new";
    } else if (typeof value === "number" && medianValue && medianValue > 0) {
      ratio = value / medianValue;
      status = ratio < SUSPECT_RATIO ? "suspect" : "ok";
    }
    return { ...video, views24h: value, ratio, status };
  });

  const metricsByAccount = new Map<number, VideoMetrics[]>();
  for (const video of videoMetrics) {
    const list = metricsByAccount.get(video.account_id);
    if (list) list.push(video);
    else metricsByAccount.set(video.account_id, [video]);
  }

  const accountMetrics: AccountMetrics[] = accounts.map((account) => {
    const accountVideos = metricsByAccount.get(account.id) ?? [];
    let totalViews = 0;
    let views7d = 0;
    let previous7d = 0;
    for (const video of accountVideos) {
      totalViews += video.views ?? 0;
      if (!video.published_at) continue;
      const published = Date.parse(video.published_at);
      if (published >= sevenDaysAgo) views7d += video.views ?? 0;
      else if (published >= fourteenDaysAgo) previous7d += video.views ?? 0;
    }

    let okCount = 0;
    let suspectCount = 0;
    for (const video of accountVideos) {
      if (video.status !== "ok" && video.status !== "suspect") continue;
      if (video.status === "ok") okCount++;
      else suspectCount++;
      if (okCount + suspectCount >= HEALTH_WINDOW) break;
    }
    const classifiedCount = okCount + suspectCount;
    const healthScore =
      classifiedCount >= HEALTH_MIN_SAMPLE
        ? Math.round((okCount / classifiedCount) * 100)
        : null;
    const status: AccountStatus =
      classifiedCount < HEALTH_MIN_SAMPLE
        ? "nodata"
        : suspectCount >= 3
          ? "critical"
          : suspectCount >= 1
            ? "warn"
            : "ok";

    return {
      ...account,
      videoCount: accountVideos.length,
      totalViews,
      views7d,
      previous7d,
      trend:
        previous7d > 0
          ? Math.round(((views7d - previous7d) / previous7d) * 100)
          : null,
      median24h: medianByAccount.get(account.id) ?? null,
      healthScore,
      okCount,
      suspectCount,
      classifiedCount,
      status,
      daily: buildDaily(accountVideos),
      lastPublishedAt: accountVideos[0]?.published_at ?? null,
    };
  });

  accountMetrics.sort(
    (a, b) => b.views7d - a.views7d || b.totalViews - a.totalViews,
  );

  const alerts = videoMetrics.filter((video) => video.status === "suspect");

  const totalsViews7d = accountMetrics.reduce((sum, a) => sum + a.views7d, 0);
  const totalsPrevious7d = accountMetrics.reduce(
    (sum, a) => sum + a.previous7d,
    0,
  );
  const scores = accountMetrics
    .map((a) => a.healthScore)
    .filter((score): score is number => score !== null);

  const totals: DashboardTotals = {
    accountCount: accounts.length,
    videoCount: videos.length,
    suspectCount: alerts.length,
    views7d: totalsViews7d,
    trend:
      totalsPrevious7d > 0
        ? Math.round(
            ((totalsViews7d - totalsPrevious7d) / totalsPrevious7d) * 100,
          )
        : null,
    healthScore:
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length,
          )
        : null,
    newThisWeek: videos.filter((video) => {
      const seen = Date.parse(video.first_seen_at);
      return !Number.isNaN(seen) && seen >= sevenDaysAgo;
    }).length,
    lastCollectedAt: accounts.reduce<string | null>(
      (latest, account) =>
        account.last_collected_at &&
        (!latest || account.last_collected_at > latest)
          ? account.last_collected_at
          : latest,
      null,
    ),
  };

  return {
    accounts: accountMetrics,
    videos: videoMetrics,
    alerts,
    daily: buildDaily(videos),
    totals,
  };
}
