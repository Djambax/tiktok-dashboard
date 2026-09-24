"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

export default function AddAccountForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        account?: { username: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Erreur inconnue");
        return;
      }
      setSuccess(`@${data.account?.username} ajouté`);
      setValue("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-zinc-500">
            @
          </span>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="nomducompte"
            disabled={loading}
            className="w-52 rounded-xl border border-zinc-700/80 bg-zinc-900/60 py-2.5 pr-3 pl-7 text-sm outline-none transition-all placeholder:text-zinc-600 focus:border-[#fe2c55]/60 focus:ring-2 focus:ring-[#fe2c55]/20 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium transition-all hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {loading ? "Collecte…" : "Ajouter"}
        </button>
      </div>
      {error && (
        <p className="max-w-md text-right text-sm text-rose-400">{error}</p>
      )}
      {success && (
        <p className="text-right text-sm text-emerald-400">{success}</p>
      )}
    </form>
  );
}
