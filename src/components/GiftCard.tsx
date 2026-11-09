import { useState, type CSSProperties, type Ref } from "react";
import { Card, PixelGlyph, themeOf } from "@react-cards-opening/ui";
import { giftRarities, rarityLabel, type GiftDefinition } from "../data/gifts";

const cardTheme = themeOf("mono", "dark");
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
  const tone = gift.appearance?.primaryColor ?? "#c5a5ff";
  return (
    <div className="gift-face">
      <span className="gift-rarity">{rarityLabel(gift.rarity)}</span>
      <div className="gift-art">
        {gift.visual && !imageFailed ? (
          <img src={gift.visual.src} alt={gift.visual.alt} draggable={false}
            style={{ objectFit: gift.visual.fit ?? "contain" }} onError={() => setImageFailed(true)} />
        ) : gift.art ? <PixelGlyph art={gift.art} colour={tone} /> : <GiftIcon kind={gift.icon} />}
      </div>
      <h3>{gift.name}</h3>
      {gift.info?.amountInCents !== undefined ? (
        <strong className="gift-value">{money.format(gift.info.amountInCents / 100)}</strong>
      ) : null}
      <p>{gift.line}</p>
    </div>
  );
}

export function GiftCard({ gift, faceDown = false, flipRef }: {
  gift: GiftDefinition; faceDown?: boolean; flipRef?: Ref<HTMLDivElement>;
}) {
  const tone = gift.appearance?.primaryColor ?? "#c5a5ff";
  return (
    <div className="gift-card" data-down={faceDown || undefined}
      data-style={gift.appearance?.style ?? "classic"}
      style={{ "--gift-tone": tone, "--gift-secondary": gift.appearance?.secondaryColors?.[0] ?? tone } as CSSProperties}>
      <div className="gift-flip" ref={flipRef}>
        <div className="gift-front">
          <Card card={gift} rarities={giftRarities} theme={cardTheme} tone={tone} width="100%" ratio={1.45}>
            <GiftCardFace gift={gift} />
          </Card>
          <i className="gift-shine" aria-hidden="true" />
        </div>
        <div className="gift-back" aria-hidden="true">
          <div className="gift-back-border"><span>✦</span><small>Uma surpresa<br />só sua</small></div>
        </div>
      </div>
    </div>
  );
}
