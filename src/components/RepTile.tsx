"use client";

/**
 * One exercise. Tap the tile to add a set (`step` reps); when the rep count is
 * > 0 a teal count badge and a minus button (decrement/undo) appear. Mirrors
 * DrinkIcon's interaction, but counts reps in per-exercise steps and uses an
 * emoji glyph rather than traced glassware.
 */
export function RepTile({
  emoji,
  label,
  step,
  count,
  onInc,
  onDec,
}: {
  emoji: string;
  label: string;
  step: number;
  count: number;
  onInc: () => void;
  onDec: () => void;
}) {
  const has = count > 0;

  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onInc}
        aria-label={`Add ${step} ${label}`}
        className="relative mx-auto flex aspect-square w-full max-w-[78px] items-center justify-center rounded-2xl"
        style={
          has
            ? { background: "#f0fdfa", boxShadow: "inset 0 0 0 2px #14b8a6" }
            : { background: "#f3f4f6" }
        }
      >
        <span
          className="text-[26px] leading-none"
          style={{ filter: has ? "none" : "grayscale(1)", opacity: has ? 1 : 0.55 }}
        >
          {emoji}
        </span>
        {has && (
          <>
            <span
              role="button"
              tabIndex={0}
              aria-label={`Remove ${step} ${label}`}
              onClick={(e) => {
                e.stopPropagation();
                onDec();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onDec();
                }
              }}
              className="absolute -top-[7px] left-0 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-white text-[14px] font-bold text-faint shadow-pop"
            >
              −
            </span>
            <span className="absolute -top-[7px] right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-[5px] text-[11px] font-bold text-white">
              {count}
            </span>
          </>
        )}
      </button>
      <div className="text-center text-[10px] font-semibold leading-tight text-subtle">
        {label}
        <br />
        <span className="text-ghost">+{step} reps</span>
      </div>
    </div>
  );
}
