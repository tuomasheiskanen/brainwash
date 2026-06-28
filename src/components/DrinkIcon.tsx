"use client";

import type { DrinkKey } from "@/lib/types";

/** Outline glassware icons, traced from the imported design. */
function Glyph({ kind, stroke }: { kind: DrinkKey; stroke: string }) {
  switch (kind) {
    case "can":
    case "canIV":
      return (
        <svg width="22" height="30" viewBox="0 0 22 30" fill="none" stroke={stroke} strokeWidth={1.8}>
          <rect x="4" y="4" width="14" height="23" rx="3" />
          <path d="M4 9 H18" />
          <ellipse cx="11" cy="4" rx="7" ry="1.6" fill={stroke} stroke="none" />
        </svg>
      );
    case "pint":
    case "pintIV":
      return (
        <svg width="24" height="30" viewBox="0 0 24 30" fill="none" stroke={stroke} strokeWidth={1.8}>
          <path d="M6 4 L7.5 27 H16.5 L18 4 Z" />
          <path d="M6.4 10 H17.6" />
        </svg>
      );
    case "wine":
      return (
        <svg width="22" height="30" viewBox="0 0 22 30" fill="none" stroke={stroke} strokeWidth={1.8}>
          <path d="M6 4 H16 C16 11 13 14 11 14 C9 14 6 11 6 4 Z" />
          <path d="M11 14 V25" />
          <path d="M6.5 25 H15.5" />
        </svg>
      );
    case "winePlus":
      return (
        <svg width="24" height="30" viewBox="0 0 24 30" fill="none" stroke={stroke} strokeWidth={1.8}>
          <path d="M5 4 H19 C19 12 15 16 12 16 C9 16 5 12 5 4 Z" />
          <path d="M12 16 V25" />
          <path d="M7 25 H17" />
        </svg>
      );
  }
}

/**
 * One drink type. Tap the tile to add a serving; when the count is > 0 a teal
 * count badge and a minus button (decrement/undo for misclicks) appear.
 */
export function DrinkIcon({
  kind,
  label,
  volume,
  count,
  onInc,
  onDec,
}: {
  kind: DrinkKey;
  label: string;
  volume: string;
  count: number;
  onInc: () => void;
  onDec: () => void;
}) {
  const has = count > 0;
  const stroke = has ? "#0f766e" : "#9ca3af";

  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onInc}
        aria-label={`Add one ${label}`}
        className="relative flex aspect-square w-full items-center justify-center rounded-2xl"
        style={
          has
            ? { background: "#f0fdfa", boxShadow: "inset 0 0 0 2px #14b8a6" }
            : { background: "#f3f4f6" }
        }
      >
        <Glyph kind={kind} stroke={stroke} />
        {has && (
          <>
            <span
              role="button"
              tabIndex={0}
              aria-label={`Remove one ${label}`}
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
        <span className="text-ghost">{volume}</span>
      </div>
    </div>
  );
}
