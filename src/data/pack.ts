import { CARD_PALETTE } from "./cardPalette";

// Conteúdo e aparência provisória; a lógica do gesto não depende desta arte.
export const packConfig = {
  title: "Uma surpresa para você",
  message: "Um pacote pequeno. Presentes cheios de carinho.",
  label: "Feliz aniversário!",
  emblem: "✦",
  color: CARD_PALETTE.pink,
  labelTexture: "textures/pack-label.png",
  tearThreshold: 0.75,
  idle: { shakeInterval: 2, shakeDuration: 0.4, tiltDuration: 0.25 },
};
