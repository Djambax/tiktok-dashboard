import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Eye,
  Info,
  Music2,
  ShieldAlert,
  Users,
  Video as VideoIcon,
} from "lucide-react";
import AddAccountForm from "./components/AddAccountForm";
import RefreshPanel from "./components/RefreshPanel";
import AreaChart from "./components/charts/AreaChart";
import HealthRing from "./components/charts/HealthRing";
import Sparkline from "./components/charts/Sparkline";
import {
  AccountPill,
  KpiCard,
  SectionTitle,
  TrendBadge,
  VideoPill,
} from "./components/ui";
import { getDashboard } from "@/lib/dashboard";
import {
  formatCompact,
  formatDate,
  formatNumber,
  timeAgo,
  truncate,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default function Home() {
  const dashboard = getDashboard();
  const { accounts, alerts, videos, daily, totals } = dashboard;
  const recent = videos.slice(0, 12);
  const dailyTotal = daily.reduce((sum, point) => sum + point.views, 0);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-[#08080a]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#fe2c55] to-[#ff5c8a] shadow-lg shadow-[#fe2c55]/25">
              <Music2 className="h-5 w-5 text-white" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight">
                TikTok Dashboard
              </span>
              <span className="block truncate text-[11px] text-zinc-500">
                {formatNumber(totals.accountCount)} comptes · collecte{" "}
                {timeAgo(totals.lastCollectedAt)}
              </span>
            </span>
          </Link>
          <RefreshPanel accountCount={totals.accountCount} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {totals.accountCount === 0 ? (
          <div className="card rise mx-auto mt-16 max-w-xl p-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fe2c55] to-[#ff5c8a] shadow-xl shadow-[#fe2c55]/25">
              <Music2 className="h-7 w-7 text-white" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight">
              Bienvenue sur ton cockpit TikTok
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Ajoute ton premier compte pour suivre les vues, repérer les vidéos
              qui sous-performent et surveiller les shadowbans.
            </p>
            <div className="mt-6 flex justify-center">
              <AddAccountForm />
            </div>
          </div>
        ) : (
          <>
            {accounts.every((account) => account.median24h === null) && (
              <div className="rise mb-6 flex flex-wrap items-start gap-2 rounded-2xl border border-[#25f4ee]/25 bg-[#25f4ee]/[0.05] p-4 text-sm text-zinc-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#25f4ee]" />
                <p>
                  <span className="font-semibold text-[#25f4ee]">
                    En attente de relevés à 24 h.
                  </span>{" "}
                  Les scores de santé et la médiane se calculent à partir
                  d&apos;un relevé effectué entre 12 h et 48 h après chaque
                  publication. Actualise chaque jour : ils apparaîtront
                  automatiquement.
                </p>
              </div>
            )}

            {alerts.length > 0 && (
              <div className="rise mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-rose-300">
                  <ShieldAlert className="h-4 w-4" />
                  {alerts.length} vidéo{alerts.length > 1 ? "s" : ""} sous la
                  médiane du compte — shadowban possible
                </p>
                <ul className="mt-3 space-y-2">
                  {alerts.slice(0, 3).map((video) => (
                    <li
                      key={video.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                    >
                      <Link
                        href={`/accounts/${video.username}`}
                        className="font-medium text-rose-200 hover:underline"
                      >
                        @{video.username}
                      </Link>
                      <Link
                        href={`/videos/${video.id}`}
                        className="min-w-0 flex-1 truncate text-zinc-300 hover:underline"
                      >
                        {truncate(video.description, 70)}
                      </Link>
                      <span className="font-mono text-xs text-rose-300">
                        {Math.round((video.ratio ?? 0) * 100)}% de la médiane
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatDate(video.published_at)}
                      </span>
                    </li>
                  ))}
                </ul>
                {alerts.length > 3 && (
                  <p className="mt-2 text-xs text-zinc-500">
                    + {alerts.length - 3} autre
                    {alerts.length - 3 > 1 ? "s" : ""} vidéo
                    {alerts.length - 3 > 1 ? "s" : ""} suspecte
                    {alerts.length - 3 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                className="rise"
                icon={<Users className="h-4 w-4" />}
                label="Comptes suivis"
                value={formatNumber(totals.accountCount)}
                sub={
                  totals.suspectCount > 0 ? (
                    <span className="text-rose-400">
                      {totals.suspectCount} vidéo
                      {totals.suspectCount > 1 ? "s" : ""} en alerte
                    </span>
                  ) : (
                    <span className="text-emerald-400">
                      Aucune alerte en cours
                    </span>
                  )
                }
              />
              <KpiCard
                className="rise-1"
                icon={<Eye className="h-4 w-4" />}
                label="Vues 7 jours"
                value={formatCompact(totals.views7d)}
                sub={
                  <span className="inline-flex items-center gap-1.5">
                    <TrendBadge value={totals.trend} /> vs 7 jours précédents
                  </span>
                }
                accent="cyan"
              />
              <KpiCard
                className="rise-2"
                icon={<VideoIcon className="h-4 w-4" />}
                label="Vidéos suivies"
                value={formatNumber(totals.videoCount)}
                sub={`+${formatNumber(totals.newThisWeek)} cette semaine`}
                accent="brand"
              />
              <KpiCard
                className="rise-3"
                icon={<Activity className="h-4 w-4" />}
                label="Santé moyenne"
                value={
                  totals.healthScore === null
                    ? "—"
                    : `${totals.healthScore}/100`
                }
                sub={`${formatNumber(totals.suspectCount)} vidéos suspectes`}
                accent={
                  totals.healthScore === null
                    ? "zinc"
                    : totals.healthScore >= 80
                      ? "emerald"
                      : totals.healthScore >= 50
                        ? "amber"
                        : "brand"
                }
              />
            </section>

            <section className="card rise-2 mt-6 p-6">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold">Vues générées</h2>
                  <p className="text-xs text-zinc-500">
                    Somme des vues des vidéos publiées ces 14 derniers jours
                  </p>
                </div>
                <p className="text-sm font-semibold text-zinc-300">
                  {formatCompact(dailyTotal)}{" "}
                  <span className="font-normal text-zinc-500">vues</span>
                </p>
              </div>
              <div className="mt-4">
                <AreaChart
                  points={daily.map((point) => ({
                    label: point.label,
                    value: point.views,
                  }))}
                  format="compact"
                  unit="vues"
                />
              </div>
            </section>

            <section className="mt-10">
              <SectionTitle title="Comptes" right={<AddAccountForm />} />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {accounts.map((account, index) => (
                  <Link
                    key={account.id}
                    href={`/accounts/${account.username}`}
                    className={`card card-hover p-5 ${
                      ["rise", "rise-1", "rise-2", "rise-3"][Math.min(index, 3)]
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">
                            @{account.username}
                          </p>
                          <AccountPill status={account.status} />
                        </div>
                        <p className="mt-1.5 text-xs text-zinc-500">
                          {formatNumber(account.videoCount)} vidéos · dernière
                          publication {timeAgo(account.lastPublishedAt)}
                        </p>
                      </div>
                      <HealthRing score={account.healthScore} />
                    </div>

                    <div className="mt-4">
                      <Sparkline
                        id={`acc-${account.id}`}
                        data={account.daily.map((point) => point.views)}
                        stroke={
                          account.status === "critical"
                            ? "#fb7185"
                            : account.status === "warn"
                              ? "#fbbf24"
                              : "#fe2c55"
                        }
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-zinc-800/70 pt-4">
                      <div>
                        <p className="text-sm font-semibold">
                          {formatCompact(account.views7d)}
                        </p>
                        <p className="text-[11px] text-zinc-500">vues 7 j</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {formatCompact(account.median24h)}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          médiane 24 h
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {formatCompact(account.totalViews)}
                        </p>
                        <p className="text-[11px] text-zinc-500">vues total</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <TrendBadge value={account.trend} />
                      <span className="text-[11px] text-zinc-500">
                        {account.classifiedCount > 0
                          ? `${account.okCount}/${account.classifiedCount} vidéos normales`
                          : "Analyse en cours"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <SectionTitle title="Dernières vidéos" />
              {recent.length === 0 ? (
                <p className="card rise-3 p-8 text-center text-sm text-zinc-500">
                  Aucune vidéo pour l&apos;instant — lance une actualisation.
                </p>
              ) : (
                <div className="card rise-3 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-sm">
                      <thead className="border-b border-zinc-800/70 bg-zinc-900/40 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Vidéo</th>
                          <th className="px-4 py-3 font-medium">Compte</th>
                          <th className="px-4 py-3 font-medium">Statut</th>
                          <th className="px-4 py-3 text-right font-medium">
                            Vues
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Likes
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Comm.
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Partages
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Saves
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {recent.map((video) => (
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
                              <Link
                                href={`/accounts/${video.username}`}
                                className="text-zinc-300 hover:underline"
                              >
                                @{video.username}
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-zinc-800/60 px-6 py-4 text-center text-xs text-zinc-600">
        Données collectées via yt-dlp · {formatNumber(totals.videoCount)} vidéos
        suivies · les chiffres reflètent le dernier relevé
      </footer>
    </>
  );
}
