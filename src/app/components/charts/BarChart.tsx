"use client";

import { useState } from "react";
import { formatCompact, formatNumber } from "@/lib/format";

export type BarItem = {
  id: string;
  label: string;
  value: number;
  detail?: string;
  ratioLabel?: string;
  suspect?: boolean;
};

type Props = {
  bars: BarItem[];
  median?: number | null;
  format?: "full" | "compact";
  unit?: string;
  height?: number;
};

export default function BarChart({
  bars,
  median = null,
  format = "compact",
  unit,
  height = 240,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const formatValue = (value: number) =>
    `${format === "full" ? formatNumber(value) : formatCompact(value)}${
      unit ? ` ${unit}` : ""
    }`;

  if (bars.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-zinc-600"
        style={{ height }}
      >
        Pas encore de données
      </div>
    );
  }

  const max = Math.max(...bars.map((bar) => bar.value), median ?? 0, 1);
  const medianRatio = median !== null ? median / max : null;
  const labelStep = Math.max(1, Math.ceil(bars.length / 10));
  const hoveredBar = bars.find((bar) => bar.id === hover) ?? null;

  return (
    <div className="relative" style={{ height }}>
      <div className="flex h-full items-end gap-[3px] pb-6">
        {bars.map((bar, index) => {
          const ratio = bar.value / max;
          const isHovered = hover === bar.id;
          return (
            <button
              key={bar.id}
              type="button"
              onMouseEnter={() => setHover(bar.id)}
              onMouseLeave={() => setHover(null)}
              className="group relative flex h-full flex-1 cursor-default flex-col justify-end"
              aria-label={bar.detail ?? bar.label}
            >
              <div
                className={`w-full rounded-t-[4px] transition-all duration-200 ${
                  bar.suspect
                    ? "bg-gradient-to-t from-rose-500/50 to-rose-400"
                    : "bg-gradient-to-t from-zinc-700/60 to-zinc-500"
                } ${isHovered ? "brightness-125" : ""}`}
                style={{ height: `${Math.max(ratio * 100, 1.5)}%` }}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-zinc-500">
                {index % labelStep === 0 ? bar.label : ""}
              </span>
            </button>
          );
        })}
      </div>

      {medianRatio !== null && (
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#25f4ee]/60"
          style={{ bottom: `${24 + medianRatio * (height - 24)}px` }}
        >
          <span className="absolute -top-5 right-0 rounded bg-[#25f4ee]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#25f4ee]">
            médiane {formatValue(median ?? 0)}
          </span>
        </div>
      )}

      {hoveredBar && (
        <div className="pointer-events-none absolute top-0 left-1/2 z-10 w-64 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
          <p className="font-semibold text-zinc-50">
            {formatValue(hoveredBar.value)}
            {hoveredBar.ratioLabel ? (
              <span
                className={`ml-1.5 font-medium ${
                  hoveredBar.suspect ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {hoveredBar.ratioLabel}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 line-clamp-2 text-zinc-400">
            {hoveredBar.detail ?? hoveredBar.label}
          </p>
        </div>
      )}
    </div>
  );
}
