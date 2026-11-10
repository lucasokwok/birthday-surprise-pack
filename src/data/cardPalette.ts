/** Rosa principal extraído do rótulo; tons de apoio para frente, verso e leitura. */
export const CARD_PALETTE = {
  base: "#2b0d21",
  raised: "#62183f",
  pink: "#fa118f",
  blush: "#ffafd8",
  text: "#fff1f8",
  muted: "#e5b7cf",
} as const;

export const CARD_COLOR_VARIABLES = {
  "--gift-base": CARD_PALETTE.base,
  "--gift-raised": CARD_PALETTE.raised,
  "--gift-pink": CARD_PALETTE.pink,
  "--gift-blush": CARD_PALETTE.blush,
  "--gift-ink": CARD_PALETTE.text,
  "--gift-muted": CARD_PALETTE.muted,
} as const;
