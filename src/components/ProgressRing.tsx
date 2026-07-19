/** Teal progress ring (SVG). `pct` is 0..1; the arc fills clockwise from top. */
export function ProgressRing({
  pct,
  size = 76,
}: {
  pct: number;
  size?: number;
}) {
  const r = 26;
  const circumference = 2 * Math.PI * r; // ≈ 163.36
  const clamped = Math.min(1, Math.max(0, pct));
  const offset = circumference * (1 - clamped);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#eef0f2" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#14b8a6"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 32 32)"
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  );
}
