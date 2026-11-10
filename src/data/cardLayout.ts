/** Proporções compartilhadas pelo frame DOM e pelas cartas que emergem em 3D. */
export const CARD_LAYOUT = {
  width: 2.06,
  ratio: 1.45,
  depth: 0.018,
  cornerRatio: 28 / 300,
} as const;

export const CARD_CSS_RADIUS = `${CARD_LAYOUT.cornerRatio * 100}% / ${CARD_LAYOUT.cornerRatio / CARD_LAYOUT.ratio * 100}%`;
