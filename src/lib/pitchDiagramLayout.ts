/** Pitch diagram layout constants — matches legacy SVG viewBox (300×420). */
export const PITCH_LAYOUT = {
  width: 300,
  height: 420,
  padding: 20,
} as const;

/** Horizontal grid position (0–100) → percentage from pitch left edge. */
export function pitchLeftPercent(x: number): number {
  const inner = PITCH_LAYOUT.width - PITCH_LAYOUT.padding * 2;
  const px = PITCH_LAYOUT.padding + (x / 100) * inner;
  return (px / PITCH_LAYOUT.width) * 100;
}

/** Away half — grid y (0–100) → percentage from pitch top edge. */
export function pitchTopPercentAway(y: number): number {
  const halfInner = PITCH_LAYOUT.height / 2 - PITCH_LAYOUT.padding;
  const px = PITCH_LAYOUT.padding + (y / 100) * halfInner;
  return (px / PITCH_LAYOUT.height) * 100;
}

/** Home half — grid y (0–100) → percentage from pitch top edge. */
export function pitchTopPercentHome(y: number): number {
  const halfInner = PITCH_LAYOUT.height / 2 - PITCH_LAYOUT.padding;
  const px = PITCH_LAYOUT.height - PITCH_LAYOUT.padding - (y / 100) * halfInner;
  return (px / PITCH_LAYOUT.height) * 100;
}
