"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import type { RefreshJob } from "@/lib/types";

export default function RefreshPanel({
  accountCount,
}: {
  accountCount: number;
}) {
  const router = useRouter();
  const [job, setJob] = useState<RefreshJob | null>(null);
  const [starting, setStarting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/refresh/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { job: RefreshJob | null };
      setJob(data.job);
      if (!data.job || data.job.status === "done") {
        stopPolling();
        router.refresh();
      }
    } catch {
      // on retente au prochain tick
    }
  }, [router, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    timerRef.current = setInterval(() => void poll(), 900);
  }, [poll, stopPolling]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/refresh/status", {
        cache: "no-store",
      }).catch(() => null);
      if (!res?.ok) return;
      const data = (await res.json()) as { job: RefreshJob | null };
      setJob(data.job);
      if (data.job?.status === "running") startPolling();
    })();
    return stopPolling;
  }, [startPolling, stopPolling]);

  async function start() {
    setStarting(true);
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as { job: RefreshJob };
      setJob(data.job);
      startPolling();
    } finally {
      setStarting(false);
    }
  }

  const running = starting || job?.status === "running";
  const total = job?.accounts.length ?? 0;
  const finished = job?.accounts.filter((a) => a.status === "done").length ?? 0;
  const newVideos =
    job?.accounts.reduce((sum, a) => sum + (a.newVideos ?? 0), 0) ?? 0;
  const errors = job?.accounts.filter((a) => a.status === "error") ?? [];
  const currentAccount = job?.accounts[job.current]?.username;
  const progress = total > 0 ? (finished / total) * 100 : 0;

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={() => void start()}
        disabled={running || accountCount === 0}
        className="group inline-flex items-center gap-2 rounded-xl bg-[#fe2c55] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fe2c55]/20 transition-all hover:bg-[#e02349] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        <RefreshCw
          className={`h-4 w-4 ${running ? "animate-spin" : "transition-transform duration-300 group-hover:rotate-180"}`}
        />
        {running ? "Collecte en cours…" : "Actualiser maintenant"}
      </button>

      {running && total > 0 && (
        <div className="w-72">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#fe2c55] to-[#25f4ee] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-xs text-zinc-400">
            {finished}/{total}
            {currentAccount ? ` · @${currentAccount}` : ""}
          </p>
        </div>
      )}

      {!running && job?.finishedAt && (
        <p className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          {newVideos > 0
            ? `${newVideos} nouvelle${newVideos > 1 ? "s" : ""} vidéo${newVideos > 1 ? "s" : ""}`
            : "Stats à jour"}
        </p>
      )}

      {!running && errors.length > 0 && (
        <ul className="space-y-1 text-right text-xs text-rose-400">
          {errors.map((account) => (
            <li
              key={account.username}
              className="inline-flex items-start gap-1.5"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                @{account.username} : {account.error}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
