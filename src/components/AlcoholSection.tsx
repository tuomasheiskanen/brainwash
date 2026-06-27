"use client";

import { DRINKS, dailyUnits, totalServings } from "@/lib/config";
import type { Drinks } from "@/lib/types";
import { Card } from "./Card";
import { DrinkIcon } from "./DrinkIcon";

export function AlcoholSection({
  drinks,
  onInc,
  onDec,
}: {
  drinks: Drinks;
  onInc: (key: keyof Drinks) => void;
  onDec: (key: keyof Drinks) => void;
}) {
  const servings = totalServings(drinks);
  const alcoholFree = servings === 0;
  const units = dailyUnits(drinks);
  // Neutral, non-judgmental summary. Units shown only as a calm total, never
  // as per-drink math while logging.
  const summary = `${servings} ${servings === 1 ? "drink" : "drinks"} · ≈ ${units.toFixed(1)} units`;

  return (
    <Card className="mb-[14px] px-4 pb-[14px] pt-[18px]">
      <div className="mx-1 mb-[14px] flex items-baseline justify-between">
        <div className="text-[13px] font-bold text-body">Alcohol</div>
        {alcoholFree ? (
          <div className="text-[11.5px] font-bold text-accent-deep">🌿 Alcohol-free</div>
        ) : (
          <div className="text-[11.5px] font-semibold text-faint">{summary}</div>
        )}
      </div>

      <div className="flex justify-between gap-1.5">
        {DRINKS.map((d) => (
          <DrinkIcon
            key={d.key}
            kind={d.key}
            label={d.label}
            volume={d.volume}
            count={drinks[d.key]}
            onInc={() => onInc(d.key)}
            onDec={() => onDec(d.key)}
          />
        ))}
      </div>

      {alcoholFree && (
        <div className="mt-[14px] flex items-center gap-2.5 rounded-[14px] bg-accent-tint px-[14px] py-3">
          <div className="text-[20px]">🌿</div>
          <div>
            <div className="text-[12.5px] font-bold text-accent-deep">Alcohol-free day</div>
            <div className="mt-px text-[11px] font-medium text-accent-muted">
              Nice — a calm one for you. Keep it light.
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
