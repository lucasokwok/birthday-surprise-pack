import type { GlyphCard } from "@react-cards-opening/ui";
import { DEFAULT_RARITIES } from "@react-cards-opening/core";

export interface GiftDefinition extends GlyphCard {
  line: string;
  icon?: "bag" | "pudding" | "gift";
  visual?: { src: string; alt: string; fit?: "contain" | "cover" };
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
    rarity: "epic",
    icon: "bag",
    appearance: { primaryColor: "#c5a5ff", style: "foil" },
    revealEffect: "celebration",
    info: { amountInCents: 10000, currency: "BRL", note: "Escolha seus favoritos, com carinho." },
  },
  {
    id: "pudim-rebeca",
    name: "Vale Caixa de Pudim da Rebeca",
    line: "Um vale-presente para ganhar uma caixa de pudim da Rebeca.",
    rarity: "rare",
    icon: "pudding",
    appearance: { primaryColor: "#f0bf86", style: "classic" },
    revealEffect: "glow",
    info: { note: "Uma surpresa doce para o seu dia." },
  },
];

export function rarityLabel(id: string) {
  return rarityLabels[id] ?? id;
}
