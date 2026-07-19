/** "N-day streak" pill with up to 7 dots. Render only when streak > 0. */
export function StreakPill({ streak }: { streak: number }) {
  const dots = Math.min(streak, 7);
  return (
    <div className="flex items-center gap-2 rounded-full bg-accent-tint px-[13px] py-[7px]">
      <div className="flex gap-[3px]">
        {Array.from({ length: dots }, (_, i) => (
          <div key={i} className="h-[5px] w-[5px] rounded-full bg-accent" />
        ))}
      </div>
      <div className="text-[11.5px] font-bold text-accent-deep">
        {streak}-day streak
      </div>
    </div>
  );
}
