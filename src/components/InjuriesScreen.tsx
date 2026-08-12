"use client";

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import { addDays, todayISO } from "@/lib/date";
import { useDay } from "@/lib/useDay";
import type { Injury } from "@/lib/types";
import { BODY_ASPECT, BODY_SIL_PATH, BODY_VIEWBOX } from "./bodySilhouette";
import { classifyRegion, regionLabel, type Side } from "./bodyParts";
import { BackHeader } from "./BackHeader";
import { DateHeader } from "./DateHeader";

// viewBox "55.77 -3 94.79 212.32" — the tap coordinate space.
const VB = { x: 55.77, y: -3, w: 94.79, h: 212.32 };

/** True if the (x%, y%) tap falls on the filled silhouette (not empty space). */
function onBody(stage: HTMLElement, xPct: number, yPct: number): boolean {
  const svg = stage.querySelector("svg");
  const path = svg?.querySelector<SVGPathElement>("#bodySil");
  if (!svg || !path || !("createSVGPoint" in svg) || !path.isPointInFill) return true;
  const pt = svg.createSVGPoint();
  pt.x = VB.x + (xPct / 100) * VB.w;
  pt.y = VB.y + (yPct / 100) * VB.h;
  try {
    return path.isPointInFill(pt);
  } catch {
    return true;
  }
}

function BodySilhouette() {
  return (
    <svg
      viewBox={BODY_VIEWBOX}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <path id="bodySil" fill="#e9ebee" d={BODY_SIL_PATH} />
    </svg>
  );
}

export function InjuriesScreen() {
  const params = useSearchParams();
  const paramDate = params.get("date");
  const [date, setDate] = useState(paramDate ?? todayISO());
  const [side, setSide] = useState<Side>("front");
  const [miss, setMiss] = useState(false);

  // Follow a ?date= deep link if one is present.
  useEffect(() => {
    if (paramDate) setDate(paramDate);
  }, [paramDate]);

  const { entry, update } = useDay(date);

  // Marks on the currently-shown side, paired with their index in the full array.
  const marks = entry.injuries
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.side === side);

  // Tap the figure → classify the body region, drop a marker; off the body nudges.
  const addMark = (e: ReactMouseEvent<HTMLDivElement>) => {
    const stage = e.currentTarget;
    const r = stage.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return;
    if (!onBody(stage, x, y)) {
      setMiss(true);
      window.setTimeout(() => setMiss(false), 1800);
      return;
    }
    const region = classifyRegion(x, y);
    const injury: Injury = {
      x,
      y,
      side,
      label: regionLabel(region, side),
      partId: region.id,
    };
    setMiss(false);
    update((p) => ({ ...p, injuries: [...p.injuries, injury] }));
  };

  const removeAt = (index: number) => (e?: ReactMouseEvent) => {
    e?.stopPropagation();
    update((p) => ({ ...p, injuries: p.injuries.filter((_, idx) => idx !== index) }));
  };

  const tabStyle = (active: boolean) =>
    `rounded-full px-[18px] py-[6px] text-[12px] font-bold ${
      active ? "bg-white text-accent-deep shadow-[0_1px_3px_rgba(31,41,55,.12)]" : "text-faint"
    }`;

  return (
    <div className="flex min-h-full flex-col px-5 pb-4 pt-[22px]">
      <BackHeader title="Aches & injuries" href={`/exercise?date=${date}`} />

      <DateHeader
        date={date}
        onPrev={() => setDate((d) => addDays(d, -1))}
        onNext={() => setDate((d) => addDays(d, 1))}
      />

      <div className="mx-1 mb-4 text-center text-[12.5px] font-medium text-faint">
        Tap the body where something hurts.
      </div>

      {/* front / back toggle */}
      <div className="mb-2.5 flex gap-0.5 self-center rounded-full bg-surface-field p-[3px]">
        <button type="button" onClick={() => setSide("front")} className={tabStyle(side === "front")}>
          Front
        </button>
        <button type="button" onClick={() => setSide("back")} className={tabStyle(side === "back")}>
          Back
        </button>
      </div>

      {/* body stage */}
      <div className="relative mb-3.5 flex h-[440px] items-center justify-center overflow-hidden rounded-card bg-white shadow-card">
        <div
          onClick={addMark}
          className="relative h-full cursor-crosshair select-none"
          style={{ aspectRatio: BODY_ASPECT }}
        >
          <BodySilhouette />

          {marks.map(({ m, i }) => (
            <div
              key={i}
              onClick={removeAt(i)}
              style={{
                position: "absolute",
                left: `${m.x}%`,
                top: `${m.y}%`,
                width: "30%",
                aspectRatio: "1",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                cursor: "pointer",
                background:
                  "radial-gradient(circle, rgba(214,64,64,.72) 0%, rgba(219,78,78,.42) 42%, rgba(224,96,96,0) 72%)",
                filter: "blur(6px)",
              }}
            />
          ))}
        </div>

        {marks.length === 0 && !miss && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[12px] font-medium text-[#c2c7ce]">
            Nothing marked — tap anywhere on the body.
          </div>
        )}
        {miss && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[12px] font-semibold text-faint">
            Tap on the figure to mark a spot.
          </div>
        )}
      </div>

      {/* marked spots list */}
      {marks.length > 0 ? (
        <div className="rounded-[20px] bg-white px-4 py-1 shadow-card">
          {marks.map(({ m, i }) => (
            <div
              key={i}
              className="flex items-center gap-[11px] border-b border-surface-field py-[13px]"
            >
              <div className="h-[9px] w-[9px] rounded-full" style={{ background: "#e07a7a" }} />
              <div className="flex-1 text-[13.5px] font-bold">{m.label}</div>
              <button
                type="button"
                onClick={removeAt(i)}
                className="rounded-full bg-surface-field px-[10px] py-1.5 text-[12px] font-bold text-faint"
              >
                Clear
              </button>
            </div>
          ))}
          <div className="py-[11px] text-[11px] font-medium text-ghost">
            Tap a spot on the body to remove it.
          </div>
        </div>
      ) : (
        <div className="px-3.5 pb-1.5 text-center text-[11.5px] font-medium leading-[1.5] text-ghost">
          Just a note for yourself — helpful for spotting patterns, not a diagnosis.
        </div>
      )}
    </div>
  );
}
