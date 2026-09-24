export type Account = {
  id: number;
  username: string;
  sec_uid: string | null;
  followers: number | null;
  added_at: string;
  last_collected_at: string | null;
};

export type Video = {
  id: string;
  account_id: number;
  url: string;
  description: string | null;
  duration: number | null;
  published_at: string | null;
  thumbnail_path: string | null;
  first_seen_at: string;
};

export type VideoWithStats = Video & {
  username: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  snapshot_count: number;
  captured_at: string | null;
};

export type SnapshotLite = {
  video_id: string;
  captured_at: string;
  views: number | null;
};

export type VideoStatus = "new" | "ok" | "suspect" | "nodata";

export type VideoMetrics = VideoWithStats & {
  views24h: number | null;
  ratio: number | null;
  status: VideoStatus;
};

export type AccountStatus = "ok" | "warn" | "critical" | "nodata";

export type DailyPoint = {
  date: string;
  label: string;
  views: number;
};

export type AccountMetrics = Account & {
  videoCount: number;
  totalViews: number;
  views7d: number;
  previous7d: number;
  trend: number | null;
  median24h: number | null;
  healthScore: number | null;
  okCount: number;
  suspectCount: number;
  classifiedCount: number;
  status: AccountStatus;
  daily: DailyPoint[];
  lastPublishedAt: string | null;
};

export type DashboardTotals = {
  accountCount: number;
  videoCount: number;
  suspectCount: number;
  views7d: number;
  trend: number | null;
  healthScore: number | null;
  newThisWeek: number;
  lastCollectedAt: string | null;
};

export type Dashboard = {
  accounts: AccountMetrics[];
  videos: VideoMetrics[];
  alerts: VideoMetrics[];
  daily: DailyPoint[];
  totals: DashboardTotals;
};

export type JobAccount = {
  username: string;
  status: "pending" | "running" | "done" | "error";
  videosFound?: number;
  newVideos?: number;
  error?: string;
};

export type RefreshJob = {
  status: "running" | "done";
  startedAt: string;
  finishedAt: string | null;
  current: number;
  accounts: JobAccount[];
};
