import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import AreaChart from "@/app/components/charts/AreaChart";
import { KpiCard, VideoPill } from "@/app/components/ui";
import { getDashboard } from "@/lib/dashboard";
import { getVideoSnapshots } from "@/lib/queries";
import {
  formatCompact,
  formatDate,
  formatDateTime,
  formatNumber,
  timeAgo,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dashboard = getDashboard();
  const video = dashboard.videos.find((item) => item.id === id);
  if (!video) notFound();

  const account = dashboard.accounts.find(
    (item) => item.id === video.account_id,
  );
  const snapshots = getVideoSnapshots(id).filter(
    (snapshot) => snapshot.views !== null,
  );
  const points = snapshots.map((snapshot) => ({
    label: formatDateTime(snapshot.captured_at),
    value: snapshot.views ?? 0,
  }));
  const engagement =
    video.views && video.likes ? (video.likes / video.views) * 100 : null;

  const details = [
    { label: "Partages", value: formatNumber(video.shares) },
    { label: "Saves", value: formatNumber(video.saves) },
    {
      label: "Taux de like",
      value: engagement === null ? "—" : `${engagement.toFixed(1)} %`,
    },
    {
      label: "Durée",
      value: video.duration === null ? "—" : `${video.duration} s`,
    },
    {
      label: "Médiane du compte",
      value: account ? formatCompact(account.median24h) : "—",
    },
    {
      label: "Vues à 24 h",
      value: formatNumber(video.views24h),
    },
    {
      label: "Premier relevé",
      value: snapshots[0] ? formatDateTime(snapshots[0].captured_at) : "—",
    },
    {
      label: "Dernier relevé",
      value: video.captured_at ? timeAgo(video.captured_at) : "—",
    },
    { label: "Nombre de relevés", value: formatNumber(snapshots.length) },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <div className="rise mt-5 flex flex-wrap gap-6">
        {video.thumbnail_path ? (
          <Image
            src={`/api/thumb/${video.id}`}
            alt=""
            width={160}
            height={216}
            unoptimized
            className="h-[216px] w-40 shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900 object-cover"
          />
        ) : (
          <div className="h-[216px] w-40 shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900" />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="max-w-3xl text-xl font-semibold leading-snug tracking-tight">
            {video.description ?? "Sans description"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            <Link
              href={`/accounts/${video.username}`}
              className="text-zinc-300 hover:underline"
            >
              @{video.username}
            </Link>{" "}
            · publiée le {formatDate(video.published_at)}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <VideoPill status={video.status} />
            {video.ratio !== null && (
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  video.status === "suspect"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : "border-zinc-700 bg-zinc-900/60 text-zinc-300"
                }`}
              >
                {Math.round(video.ratio * 100)}% de la médiane du compte
              </span>
            )}
            <a
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium transition-colors hover:border-zinc-500 hover:bg-zinc-900"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Voir sur TikTok
            </a>
          </div>
        </div>
      </div>

      <section className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          className="rise"
          icon={<Eye className="h-4 w-4" />}
          label="Vues actuelles"
          value={formatNumber(video.views)}
          sub={`relevé ${timeAgo(video.captured_at)}`}
          accent="cyan"
        />
        <KpiCard
          className="rise-1"
          icon={<Clock className="h-4 w-4" />}
          label="Vues à 24 h"
          value={formatNumber(video.views24h)}
          sub={
            video.ratio !== null ? (
              <span
                className={
                  video.status === "suspect"
                    ? "text-rose-400"
                    : "text-emerald-400"
                }
              >
                {Math.round(video.ratio * 100)}% de la médiane
              </span>
            ) : (
              "Pas encore de relevé à 24 h"
            )
          }
          accent="brand"
        />
        <KpiCard
          className="rise-2"
          icon={<Heart className="h-4 w-4" />}
          label="Likes"
          value={formatNumber(video.likes)}
          sub={
            engagement === null
              ? undefined
              : `${engagement.toFixed(1)} % des vues`
          }
        />
        <KpiCard
          className="rise-3"
          icon={<MessageCircle className="h-4 w-4" />}
          label="Commentaires"
          value={formatNumber(video.comments)}
          sub={`${formatNumber(video.shares)} partages · ${formatNumber(video.saves)} saves`}
        />
      </section>

      <section className="card rise-2 mt-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Croissance des vues</h2>
            <p className="text-xs text-zinc-500">
              {formatNumber(snapshots.length)} relevés
              {snapshots[0]
                ? ` depuis le ${formatDateTime(snapshots[0].captured_at)}`
                : ""}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <AreaChart
            points={points}
            color="#fe2c55"
            format="full"
            unit="vues"
          />
        </div>
      </section>

      <section className="card mt-6 p-6">
        <h2 className="text-sm font-semibold">Détails</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-3">
          {details.map((detail) => (
            <div key={detail.label}>
              <dt className="text-xs text-zinc-500">{detail.label}</dt>
              <dd className="mt-0.5 font-medium">{detail.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
