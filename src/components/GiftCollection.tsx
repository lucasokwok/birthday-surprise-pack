import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "@react-cards-opening/core";
import type { GiftDefinition } from "../data/gifts";
import { GiftCard } from "./GiftCard";

function GiftDialog({ gift, onClose }: { gift: GiftDefinition; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    const context = gsap.context(() => {
      if (!reduced) gsap.from(content.current, { y: 18, autoAlpha: 0, duration: 0.25 });
    }, element);
    return () => { context.revert(); element.close(); };
  }, [reduced]);
  return (
    <dialog ref={dialog} className="gift-dialog" aria-label={gift.name}
      onClose={onClose} onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}>
      <div ref={content} className="gift-dialog-content">
        <button autoFocus type="button" className="dialog-close" onClick={() => dialog.current?.close()} aria-label="Fechar presente">×</button>
        <GiftCard gift={gift} />
        <h2 className="gift-detail-title">{gift.name}</h2>
        <p className="gift-note">{gift.line}</p>
        {gift.info?.note ? <p className="gift-note">{gift.info.note}</p> : null}
      </div>
    </dialog>
  );
}

export function GiftCollection({ gifts, onRestart }: { gifts: readonly GiftDefinition[]; onRestart: () => void }) {
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [selected, setSelected] = useState<GiftDefinition | null>(null);
  const close = useCallback(() => setSelected(null), []);
  const reduced = usePrefersReducedMotion();
  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true });
    const context = gsap.context(() => {
      if (!reduced) gsap.from(".collection-item", {
        y: 35, rotation: (i: number) => i % 2 ? 5 : -5,
        autoAlpha: 0, duration: 0.65, stagger: 0.12, ease: "back.out(1.3)",
      });
    }, root);
    return () => context.revert();
  }, [reduced]);
  return (
    <section ref={root} className="collection" aria-labelledby="collection-title">
      <h2 id="collection-title" ref={heading} tabIndex={-1}>Seus presentes, todos seus.</h2>
      <p>Toque em uma carta para ver de novo.</p>
      <div className="collection-grid">
        {gifts.map((gift) => (
          <button className="collection-item" type="button" key={gift.id}
            aria-label={`Ver ${gift.name}`} onClick={() => setSelected(gift)}>
            <GiftCard gift={gift} />
          </button>
        ))}
      </div>
      <button className="primary-button" type="button" onClick={onRestart}>Abrir novamente</button>
      {selected ? <GiftDialog gift={selected} onClose={close} /> : null}
    </section>
  );
}
