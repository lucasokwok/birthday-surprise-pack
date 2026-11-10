import type { GlyphCard } from "@react-cards-opening/ui";
import { DEFAULT_RARITIES } from "@react-cards-opening/core";
import { CARD_PALETTE } from "./cardPalette";

export interface GiftDefinition extends GlyphCard {
  line: string;
  icon?: "bag" | "pudding" | "gift";
  visual?: { src: string; alt: string; fit?: "contain" | "cover"; kind?: "image" | "logo" | "card" };
  brand?: { src: string; alt: string };
  appearance?: {
    primaryColor?: string;
    secondaryColors?: readonly string[];
    style?: "classic" | "foil";
  };
  revealEffect?: "default" | "celebration" | "glow";
  info?: { amountInCents?: number; currency?: "BRL"; note?: string };
}

const rarityLabels: Record<string, string> = {
  common: "Comum", uncommon: "Incomum", rare: "Rara",
  epic: "Épica", legendary: "Lendária", mythic: "Mítica",
};

export const giftRarities = DEFAULT_RARITIES.map((tier) => ({
  ...tier, label: rarityLabels[tier.id] ?? tier.label,
}));

export const giftCards: GiftDefinition[] = [
  {
    id: "carrinho-shein",
    name: "Vale Carrinho SHEIN",
    line: "Um vale para escolher R$ 100 em produtos na SHEIN.",
    rarity: "rare",
    icon: "bag",
    visual: { src: `${import.meta.env.BASE_URL}cards/shein_card.png`, alt: "Vale Carrinho SHEIN de R$ 100,00", kind: "card" },
    appearance: { primaryColor: CARD_PALETTE.pink, secondaryColors: [CARD_PALETTE.blush], style: "foil" },
    revealEffect: "celebration",
    info: { amountInCents: 10000, currency: "BRL", note: "Escolha seus favoritos, com carinho." },
  },
  {
    id: "perfiloplastia",
    name: "Vale Perfiloplastia",
    line: "Um vale-presente de perfiloplastia.",
    rarity: "legendary",
    icon: "gift",
    visual: { src: `${import.meta.env.BASE_URL}cards/perfiloplastia_card.png`, alt: "Vale Perfiloplastia", kind: "card" },
    appearance: { primaryColor: "#f5c56b", secondaryColors: [CARD_PALETTE.blush], style: "foil" },
    revealEffect: "celebration",
  },
  {
    id: "pudim-rebeca",
    name: "Vale Caixa de Pudim da Rebeca",
    line: "Um vale-presente para ganhar uma caixa de pudim da Rebeca.",
    rarity: "epic",
    icon: "pudding",
    visual: { src: `${import.meta.env.BASE_URL}cards/caixadepudim_card.png`, alt: "Vale Caixa de Pudim da Rebeca", kind: "card" },
    appearance: { primaryColor: CARD_PALETTE.blush, secondaryColors: [CARD_PALETTE.pink], style: "foil" },
    revealEffect: "glow",
    info: { note: "Uma surpresa doce para o seu dia." },
  },
  {
    id: "cafe-da-tarde",
    name: "Vale Café da Tarde",
    line: "Um vale-presente para um café da tarde.",
    rarity: "legendary",
    icon: "gift",
    visual: { src: `${import.meta.env.BASE_URL}cards/cafedatarde_card.png`, alt: "Vale Café da Tarde", kind: "card" },
    appearance: { primaryColor: "#f5c56b", secondaryColors: [CARD_PALETTE.blush], style: "foil" },
    revealEffect: "celebration",
  },
  {
    id: "chocolate-laranja",
    name: "Vale Chocolate com Laranja",
    line: "Um vale-presente para um chocolate com laranja.",
    rarity: "legendary",
    icon: "gift",
    visual: { src: `${import.meta.env.BASE_URL}cards/chocolatelaranja_card.png`, alt: "Vale Chocolate com Laranja", kind: "card" },
    appearance: { primaryColor: "#f5c56b", secondaryColors: [CARD_PALETTE.pink], style: "foil" },
    revealEffect: "celebration",
  },
];

export function rarityLabel(id: string) {
  return rarityLabels[id] ?? id;
}
