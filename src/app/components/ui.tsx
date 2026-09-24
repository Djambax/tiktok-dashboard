import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { AccountStatus, VideoStatus } from "@/lib/types";

const ACCOUNT_STATUS: Record<
  AccountStatus,
  { label: string; className: string }
> = {
  ok: {
    label: "Sain",
    className: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
  },
  warn: {
    label: "Vigilance",
    className: "bg-amber-400/10 text-amber-300 border-amber-400/25",
  },
  critical: {
    label: "Alerte",
    className: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  },
  nodata: {
    label: "En attente",
    className: "bg-zinc-400/10 text-zinc-400 border-zinc-500/25",
  },
};

const VIDEO_STATUS: Record<VideoStatus, { label: string; className: string }> =
  {
    ok: {
      label: "Normal",
      className: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
    },
    suspect: {
      label: "Suspecte",
      className: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    },
    new: {
      label: "Nouvelle",
      className: "bg-cyan-400/10 text-cyan-300 border-cyan-400/25",
    },
    nodata: {
      label: "En attente",
      className: "bg-zinc-400/10 text-zinc-400 border-zinc-500/25",
    },
  };

export function AccountPill({ status }: { status: AccountStatus }) {
  const meta = ACCOUNT_STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

export function VideoPill({ status }: { status: VideoStatus }) {
  const meta = VIDEO_STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${meta.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

export function TrendBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-zinc-500">—</span>;
  }
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        positive ? "text-emerald-400" : "text-rose-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}

export function KpiCard({
  icon,
  label,
  value,
  sub,
  accent = "zinc",
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: ReactNode;
  accent?: "brand" | "cyan" | "emerald" | "amber" | "zinc";
  className?: string;
}) {
  const accents = {
    brand: "bg-[#fe2c55]/10 text-[#fe2c55] border-[#fe2c55]/20",
    cyan: "bg-[#25f4ee]/10 text-[#25f4ee] border-[#25f4ee]/20",
    emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    amber: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    zinc: "bg-zinc-400/10 text-zinc-300 border-zinc-500/20",
  };
  return (
    <div className={`card card-hover p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg border ${accents[accent]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {sub ? <div className="mt-1.5 text-xs text-zinc-500">{sub}</div> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  right,
}: {
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {right}
    </div>
  );
}
