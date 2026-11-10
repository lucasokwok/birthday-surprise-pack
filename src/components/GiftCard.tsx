import { useState, type CSSProperties, type Ref } from "react";
import { Card, PixelGlyph, themeOf } from "@react-cards-opening/ui";
import { giftRarities, rarityLabel, type GiftDefinition } from "../data/gifts";
import { CARD_CSS_RADIUS, CARD_LAYOUT } from "../data/cardLayout";
import { CARD_COLOR_VARIABLES, CARD_PALETTE } from "../data/cardPalette";
import { CARD_BACK_IMAGE } from "../data/cardBack";

const cardTheme = {
  ...themeOf("mono", "dark"),
  bg: CARD_PALETTE.base,
  card: CARD_PALETTE.base,
  fg: CARD_PALETTE.text,
  muted: CARD_PALETTE.muted,
  levels: [CARD_PALETTE.base, CARD_PALETTE.raised, CARD_PALETTE.muted, CARD_PALETTE.blush, CARD_PALETTE.pink] as const,
};
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function GiftIcon({ kind }: { kind?: GiftDefinition["icon"] }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {kind === "bag" ? <>
        <path d="M19 27h42l5 39H14l5-39Z" />
        <path d="M29 30V21a11 11 0 0 1 22 0v9M31 43c3 8 15 8 18 0" strokeLinecap="round" />
      </> : kind === "pudding" ? <>
        <ellipse cx="40" cy="64" rx="29" ry="7" />
        <path d="m24 26-7 32c8 9 38 9 46 0l-7-32" />
        <ellipse cx="40" cy="26" rx="16" ry="6" />
        <path d="M27 29v8c0 6 7 6 7 0v-4m12-1v11c0 5 7 5 7 0V30" strokeLinecap="round" />
      </> : <>
        <path d="M13 32h54v13H13zM19 45v23h42V45M40 32v36" />
        <path d="M40 32c-25 0-20-25-7-16 5 4 7 16 7 16Zm0 0c25 0 20-25 7-16-5 4-7 16-7 16Z" />
      </>}
    </svg>
  );
}

export function GiftCardFace({ gift }: { gift: GiftDefinition }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [brandFailed, setBrandFailed] = useState(false);
  const tone = gift.appearance?.primaryColor ?? CARD_PALETTE.pink;
  const hasVisual = !!gift.visual && !imageFailed;
  const hasBrand = !!gift.brand && !brandFailed;
  return (
    <div className="gift-face" data-visual={hasVisual || undefined}>
      <span className="gift-rarity">{rarityLabel(gift.rarity)}</span>
      <div className="gift-art" data-kind={hasVisual ? gift.visual?.kind ?? "image" : undefined}
        data-brand={hasBrand || undefined}>
        {gift.visual && hasVisual ? (
          <img className="gift-visual" src={gift.visual.src} alt={gift.visual.alt} draggable={false} decoding="async"
            style={{ objectFit: gift.visual.fit ?? "contain" }} onError={() => setImageFailed(true)} />
        ) : gift.art ? <PixelGlyph art={gift.art} colour={tone} /> : <GiftIcon kind={gift.icon} />}
        {gift.brand && hasBrand ? (
          <span className="gift-brand">
            <img src={gift.brand.src} alt={gift.brand.alt} draggable={false} decoding="async"
              onError={() => setBrandFailed(true)} />
          </span>
        ) : null}
      </div>
      <h3>{gift.name}</h3>
      {gift.info?.amountInCents !== undefined ? (
        <strong className="gift-value">{money.format(gift.info.amountInCents / 100)}</strong>
      ) : null}
    </div>
  );
}

export function GiftCard({ gift, faceDown = false, flipRef }: {
  gift: GiftDefinition; faceDown?: boolean; flipRef?: Ref<HTMLDivElement>;
}) {
  const tone = gift.appearance?.primaryColor ?? CARD_PALETTE.pink;
  return (
    <div className="gift-card" data-down={faceDown || undefined}
      data-style={gift.appearance?.style ?? "classic"}
      style={{ ...CARD_COLOR_VARIABLES, "--gift-tone": tone, "--gift-secondary": gift.appearance?.secondaryColors?.[0] ?? tone,
        "--gift-radius": CARD_CSS_RADIUS, aspectRatio: `1 / ${CARD_LAYOUT.ratio}` } as CSSProperties}>
      <div className="gift-flip" ref={flipRef}>
        <div className="gift-front">
          <Card card={gift} rarities={giftRarities} theme={cardTheme} tone={tone} width="100%" ratio={CARD_LAYOUT.ratio}
            classNames={{ back: "gift-frame-back" }} style={{ perspective: "none",
              "--rco-radius": `calc(100cqw * ${CARD_LAYOUT.cornerRatio})` } as CSSProperties}>
            <GiftCardFace gift={gift} />
          </Card>
          <i className="gift-shine" aria-hidden="true" />
        </div>
        <div className="gift-back" aria-hidden="true">
          <div className="gift-back-border">
            <img className="gift-back-image" src={CARD_BACK_IMAGE} alt="" draggable={false} decoding="async" />
          </div>
        </div>
      </div>
    </div>
  );
}
