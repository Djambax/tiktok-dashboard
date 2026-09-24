"use client";

import { useRef, useState } from "react";
import { formatCompact, formatNumber } from "@/lib/format";

export type AreaPoint = {
  label: string;
  value: number;
  detail?: string;
};

type Props = {
  points: AreaPoint[];
  height?: number;
  color?: string;
  format?: "full" | "compact";
  unit?: string;
};

const VIEW_W = 1000;

function smoothPath(points: [number, number][]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

export default function AreaChart({
  points,
  height = 220,
  color = "#25f4ee",
  format = "compact",
  unit,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const formatValue = (value: number) =>
    `${format === "full" ? formatNumber(value) : formatCompact(value)}${
      unit ? ` ${unit}` : ""
    }`;

  const padding = { top: 18, right: 14, bottom: 30, left: 14 };
  const innerW = VIEW_W - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(...points.map((p) => p.value), 1);

  const coords: [number, number][] = points.map((point, index) => {
    const x =
      padding.left +
      (points.length === 1
        ? innerW / 2
        : (index / (points.length - 1)) * innerW);
    const y = padding.top + innerH - (point.value / max) * innerH;
    return [x, y];
  });

  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-zinc-600"
        style={{ height }}
      >
        Pas encore de données
      </div>
    );
  }

  const line = smoothPath(coords);
  const area = `${line} L ${coords[coords.length - 1][0]},${padding.top + innerH} L ${coords[0][0]},${padding.top + innerH} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const labelStep = Math.max(1, Math.ceil(points.length / 7));

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    setHover(Math.round(ratio * (points.length - 1)));
  }

  const hoverPoint = hover !== null ? points[hover] : null;
  const hoverCoord = hover !== null ? coords[hover] : null;
  const tooltipLeft = hoverCoord
    ? Math.min(92, Math.max(8, (hoverCoord[0] / VIEW_W) * 100))
    : 50;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            x2={VIEW_W - padding.right}
            y1={padding.top + innerH * ratio}
            y2={padding.top + innerH * ratio}
            stroke="rgb(63 63 70 / 0.35)"
            strokeWidth="1"
            strokeDasharray={ratio === 1 ? undefined : "4 6"}
          />
        ))}

        <path d={area} fill="url(#area-grad)" />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {hoverCoord && (
          <>
            <line
              x1={hoverCoord[0]}
              x2={hoverCoord[0]}
              y1={padding.top}
              y2={padding.top + innerH}
              stroke="rgb(228 228 231 / 0.35)"
              strokeWidth="1"
            />
            <circle
              cx={hoverCoord[0]}
              cy={hoverCoord[1]}
              r="4.5"
              fill="#09090b"
              stroke={color}
              strokeWidth="2.5"
            />
          </>
        )}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5">
        {points.map((point, index) =>
          index % labelStep === 0 || index === points.length - 1 ? (
            <span
              key={point.label + index}
              className="absolute -translate-x-1/2 text-[10px] text-zinc-500"
              style={{ left: `${(coords[index][0] / VIEW_W) * 100}%` }}
            >
              {point.label}
            </span>
          ) : null,
        )}
      </div>

      {hoverPoint && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
          style={{ left: `${tooltipLeft}%` }}
        >
          <p className="font-medium text-zinc-300">{hoverPoint.label}</p>
          <p className="mt-0.5 font-semibold text-zinc-50">
            {formatValue(hoverPoint.value)}
            {hoverPoint.detail ? (
              <span className="ml-1 font-normal text-zinc-400">
                {hoverPoint.detail}
              </span>
            ) : null}
          </p>
        </div>
      )}
    </div>
  );
}
