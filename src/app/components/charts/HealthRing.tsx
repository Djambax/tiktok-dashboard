type Props = {
  score: number | null;
  size?: number;
  strokeWidth?: number;
};

export default function HealthRing({
  score,
  size = 72,
  strokeWidth = 7,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score === null ? 0 : Math.min(1, Math.max(0, score / 100));
  const color =
    score === null
      ? "#3f3f46"
      : score >= 80
        ? "#34d399"
        : score >= 50
          ? "#fbbf24"
          : "#fb7185";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(39 39 42 / 0.9)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-lg font-semibold leading-none tracking-tight"
          style={{ color: score === null ? "#71717a" : color }}
        >
          {score === null ? "—" : score}
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
          santé
        </span>
      </div>
    </div>
  );
}
