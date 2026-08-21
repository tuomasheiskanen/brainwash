// Explicit body-part regions for the injury figure, authored to match the drawn
// silhouette (see bodySilhouette.ts). Coordinates are percentages (0–100) of the
// body surface — the same space taps are measured in — so classification is by
// real anatomy, not y-band guesswork. `side` is the person's own side: "r" is
// screen-left (their right), "l" is screen-right (their left).
//
// Geometry was derived by probing the silhouette's isPointInFill on a grid: the
// arms are diagonal clusters separated from the torso in x, which the previous
// coordinate heuristic could not capture.

export type Side = "front" | "back";
export type PartSide = "l" | "r" | "";

export interface BodyRegion {
  id: string;
  side: PartSide;
  /** Region name on the front figure and on the back figure. */
  front: string;
  back: string;
  /** Polygon in %-space: [x, y] pairs, 0–100. */
  poly: [number, number][];
}

// Order matters: extremities/shoulders are tested before the torso so an arm tap
// near the body isn't captured by a torso region.
export const BODY_REGIONS: BodyRegion[] = [
  { id: "head", side: "", front: "Head", back: "Head",
    poly: [[44, 0], [58, 0], [64, 8], [58, 17], [44, 17], [38, 8]] },
  { id: "neck", side: "", front: "Neck", back: "Neck",
    poly: [[44, 13], [58, 13], [58, 19], [44, 19]] },

  // shoulders (top of the arm, where it meets the torso)
  { id: "shoulder-r", side: "r", front: "Shoulder", back: "Shoulder",
    poly: [[24, 17], [40, 17], [42, 26], [21, 26]] },
  { id: "shoulder-l", side: "l", front: "Shoulder", back: "Shoulder",
    poly: [[60, 17], [76, 17], [79, 26], [58, 26]] },

  // arms (person's right = screen-left). The arm hangs alongside the torso, so the
  // upper arm is merged with the body down to ~y40 before the elbow separates out.
  { id: "upperarm-r", side: "r", front: "Upper arm", back: "Upper arm",
    poly: [[22, 26], [33, 26], [31, 37], [17, 37]] },
  { id: "elbow-r", side: "r", front: "Elbow", back: "Elbow",
    poly: [[17, 37], [31, 37], [27, 41], [15, 41]] },
  { id: "forearm-r", side: "r", front: "Forearm", back: "Forearm",
    poly: [[15, 41], [27, 41], [22, 50], [10, 50]] },
  { id: "hand-r", side: "r", front: "Hand", back: "Hand",
    poly: [[10, 50], [22, 50], [18, 59], [3, 59]] },
  // arms (person's left = screen-right)
  { id: "upperarm-l", side: "l", front: "Upper arm", back: "Upper arm",
    poly: [[67, 26], [78, 26], [83, 37], [69, 37]] },
  { id: "elbow-l", side: "l", front: "Elbow", back: "Elbow",
    poly: [[69, 37], [83, 37], [85, 41], [73, 41]] },
  { id: "forearm-l", side: "l", front: "Forearm", back: "Forearm",
    poly: [[73, 41], [85, 41], [90, 50], [78, 50]] },
  { id: "hand-l", side: "l", front: "Hand", back: "Hand",
    poly: [[78, 50], [90, 50], [97, 59], [82, 59]] },

  // torso (center)
  { id: "chest", side: "", front: "Chest", back: "Upper back",
    poly: [[33, 18], [67, 18], [68, 38], [32, 38]] },
  { id: "abdomen", side: "", front: "Abdomen", back: "Mid back",
    poly: [[33, 38], [67, 38], [69, 46], [31, 46]] },
  { id: "lower-abdomen", side: "", front: "Lower abdomen", back: "Lower back",
    poly: [[30, 46], [70, 46], [72, 56], [28, 56]] },

  // hips
  { id: "hip-r", side: "r", front: "Hip", back: "Hip",
    poly: [[29, 55], [50, 55], [50, 59], [30, 59]] },
  { id: "hip-l", side: "l", front: "Hip", back: "Hip",
    poly: [[50, 55], [72, 55], [71, 59], [50, 59]] },

  // legs (person's right = screen-left)
  { id: "thigh-r", side: "r", front: "Thigh", back: "Hamstring",
    poly: [[30, 59], [50, 59], [48, 70], [31, 70]] },
  { id: "knee-r", side: "r", front: "Knee", back: "Knee",
    poly: [[31, 70], [48, 70], [46, 77], [32, 77]] },
  { id: "shin-r", side: "r", front: "Shin", back: "Calf",
    poly: [[32, 77], [47, 77], [46, 93], [32, 93]] },
  { id: "foot-r", side: "r", front: "Foot", back: "Foot",
    poly: [[32, 92], [50, 92], [50, 100], [34, 100]] },
  // legs (person's left = screen-right)
  { id: "thigh-l", side: "l", front: "Thigh", back: "Hamstring",
    poly: [[50, 59], [72, 59], [71, 70], [52, 70]] },
  { id: "knee-l", side: "l", front: "Knee", back: "Knee",
    poly: [[52, 70], [69, 70], [68, 77], [54, 77]] },
  { id: "shin-l", side: "l", front: "Shin", back: "Calf",
    poly: [[54, 77], [68, 77], [68, 93], [54, 93]] },
  { id: "foot-l", side: "l", front: "Foot", back: "Foot",
    poly: [[50, 92], [68, 92], [66, 100], [50, 100]] },
];

function pointInPoly(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function centroid(poly: [number, number][]): [number, number] {
  let sx = 0, sy = 0;
  for (const [x, y] of poly) {
    sx += x;
    sy += y;
  }
  return [sx / poly.length, sy / poly.length];
}

/**
 * Classify a tap (x/y as % of the body surface) to a body region. Returns the
 * first region whose polygon contains the point; if the point is on the body but
 * between polygons, snaps to the nearest region so a tap is never left unlabeled.
 */
export function classifyRegion(x: number, y: number): BodyRegion {
  for (const r of BODY_REGIONS) {
    if (pointInPoly(x, y, r.poly)) return r;
  }
  let best = BODY_REGIONS[0];
  let bestD = Infinity;
  for (const r of BODY_REGIONS) {
    const [cx, cy] = centroid(r.poly);
    const d = (cx - x) ** 2 + (cy - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}

/** Human-readable label for a region on the given side of the body. */
export function regionLabel(region: BodyRegion, side: Side): string {
  const lr = region.side === "r" ? "Right " : region.side === "l" ? "Left " : "";
  const part = side === "front" ? region.front : region.back;
  return lr ? lr + part.toLowerCase() : part;
}
