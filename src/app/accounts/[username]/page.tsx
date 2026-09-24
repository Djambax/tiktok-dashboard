import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Gauge,
  ShieldAlert,
  Video as VideoIcon,
} from "lucide-react";
import BarChart from "@/app/components/charts/BarChart";
import HealthRing from "@/app/components/charts/HealthRing";
import {
  AccountPill,
  KpiCard,
  SectionTitle,
  TrendBadge,
  VideoPill,
} from "@/app/components/ui";
import { getAccountDashboard } from "@/lib/dashboard";
import {
  formatCompact,
  formatDate,
  formatNumber,
  formatShortDate,
  timeAgo,
  truncate,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const dashboard = getAccountDashboard(username.toLowerCase());
  const account = dashboard?.accounts[0];
  if (!dashboard || !account) notFound();

  const using24h = dashboard.videos.some((video) => video.views24h !== null);
  const bars = (
    using24h
      ? dashboard.videos.filter((video) => video.views24h !== null)
      : dashboard.videos
  )
    .slice(0, 20)
    .reverse()
    .map((video) => ({
      id: video.id,
      label: formatShortDate(video.published_at),
      value: (using24h ? video.views24h : video.views) ?? 0,
      detail: truncate(video.description, 80),
      ratioLabel:
        video.ratio !== null
          ? `${Math.round(video.ratio * 100)}% de la médiane`
          : undefined,
      suspect: video.status === "suspect",
    }));

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <header className="rise mt-5 flex flex-wrap items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              @{account.username}
            </h1>
            <AccountPill status={account.status} />
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Suivi depuis le {formatDate(account.added_at)} · dernière collecte{" "}
            {timeAgo(account.last_collected_at)} ·{" "}
            {formatNumber(account.videoCount)} vidéos
          </p>
        </div>
        <HealthRing score={account.healthScore} size={96} strokeWidth={9} />
      </header>

      <section className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          className="rise"
          icon={<Eye className="h-4 w-4" />}
          label="Vues 7 jours"
          value={formatCompact(account.views7d)}
          sub={<TrendBadge value={account.trend} />}
          accent="cyan"
        />
        <KpiCard
          className="rise-1"
          icon={<Activity className="h-4 w-4" />}
          label="Médiane à 24 h"
          value={formatCompact(account.median24h)}
          sub={
            account.classifiedCount > 0
              ? `${account.classifiedCount} vidéos analysées`
              : "En attente de données"
          }
        />
        <KpiCard
          className="rise-2"
          icon={<VideoIcon className="h-4 w-4" />}
          label="Vues totales"
          value={formatCompact(account.totalViews)}
          sub={`${formatNumber(account.videoCount)} vidéos suivies`}
          accent="brand"
        />
        <KpiCard
          className="rise-3"
          icon={<Gauge className="h-4 w-4" />}
          label="Vidéos normales"
          value={
            account.classifiedCount > 0
              ? `${account.okCount}/${account.classifiedCount}`
              : "—"
          }
          sub={
            account.suspectCount > 0 ? (
              <span className="text-rose-400">
                {account.suspectCount} suspecte
                {account.suspectCount > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-emerald-400">Aucune suspecte</span>
            )
          }
          accent={account.suspectCount > 0 ? "amber" : "emerald"}
        />
      </section>

      {dashboard.alerts.length > 0 && (
        <section className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-rose-300">
            <ShieldAlert className="h-4 w-4" />
            {dashboard.alerts.length} vidéo
            {dashboard.alerts.length > 1 ? "s" : ""} sous la médiane du compte
          </p>
          <ul className="mt-3 space-y-2">
            {dashboard.alerts.slice(0, 5).map((video) => (
              <li
                key={video.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
              >
                <Link
                  href={`/videos/${video.id}`}
                  className="min-w-0 flex-1 truncate text-zinc-300 hover:underline"
                >
                  {truncate(video.description, 70)}
                </Link>
                <span className="font-mono text-xs text-rose-300">
                  {formatCompact(video.views24h)} vues à 24 h ·{" "}
                  {Math.round((video.ratio ?? 0) * 100)}% de la médiane
                </span>
                <span className="text-xs text-zinc-500">
                  {formatDate(video.published_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card rise-2 mt-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">
              {using24h ? "Vues à 24 h par vidéo" : "Vues actuelles par vidéo"}
            </h2>
            <p className="text-xs text-zinc-500">
              20 dernières vidéos · ligne pointillée = médiane du compte
              {account.median24h !== null
                ? ` (${formatCompact(account.median24h)})`
                : ""}
            </p>
          </div>
          {!using24h && (
            <p className="text-xs text-amber-400/90">
              Pas encore assez de relevés à 24 h — affichage des vues actuelles
            </p>
          )}
        </div>
        <div className="mt-6">
          <BarChart
            bars={bars}
            median={using24h ? account.median24h : null}
            format="compact"
            unit="vues"
          />
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle
          title={`Vidéos (${formatNumber(account.videoCount)})`}
          right={
            account.median24h !== null ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#25f4ee]" />
                médiane à 24 h : {formatCompact(account.median24h)} vues
              </span>
            ) : null
          }
        />
        <div className="card rise-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="border-b border-zinc-800/70 bg-zinc-900/40 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Vidéo</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Vues</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Vues à 24 h
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Likes</th>
                  <th className="px-4 py-3 text-right font-medium">Comm.</th>
                  <th className="px-4 py-3 text-right font-medium">Partages</th>
                  <th className="px-4 py-3 text-right font-medium">Saves</th>
                  <th className="px-4 py-3 text-right font-medium">Relevés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {dashboard.videos.map((video) => (
                  <tr
                    key={video.id}
                    className="transition-colors hover:bg-zinc-900/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/videos/${video.id}`}
                        className="group flex items-center gap-3"
                      >
                        {video.thumbnail_path ? (
                          <Image
                            src={`/api/thumb/${video.id}`}
                            alt=""
                            width={40}
                            height={54}
                            unoptimized
                            className="h-[54px] w-10 shrink-0 rounded-lg bg-zinc-800 object-cover"
                          />
                        ) : (
                          <div className="h-[54px] w-10 shrink-0 rounded-lg bg-zinc-800" />
                        )}
                        <span className="min-w-0">
                          <span className="line-clamp-2 block max-w-md group-hover:underline">
                            {truncate(video.description, 90)}
                          </span>
                          <span className="mt-0.5 block text-xs text-zinc-500">
                            {formatDate(video.published_at)}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <VideoPill status={video.status} />
                      {video.ratio !== null && (
                        <p
                          className={`mt-1 text-[11px] ${
                            video.status === "suspect"
                              ? "text-rose-400"
                              : "text-zinc-500"
                          }`}
                        >
                          {Math.round(video.ratio * 100)}% de la médiane
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatNumber(video.views)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {formatNumber(video.views24h)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {formatNumber(video.likes)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {formatNumber(video.comments)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {formatNumber(video.shares)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {formatNumber(video.saves)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500">
                      {formatNumber(video.snapshot_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
