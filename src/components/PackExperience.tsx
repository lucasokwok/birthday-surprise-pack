import {
  useCallback, useEffect, useLayoutEffect, useRef, useState,
  type CSSProperties, type PointerEvent,
} from "react";
import { gsap } from "gsap";
import { EffectLayer, type EffectLayerHandle } from "@react-cards-opening/ui";
import { usePrefersReducedMotion } from "@react-cards-opening/core";
import type { GiftDefinition } from "../data/gifts";
import { packConfig } from "../data/pack";
import { GiftCard } from "./GiftCard";

type Phase = "sealed" | "tearing" | "returning" | "opening" | "dealing" | "ready" | "flipping" | "reading" | "discarding";
type Gesture = { id: number; start: number; distance: number; progress: number; target: HTMLButtonElement };
type Actions = { open: () => void; reveal: () => void; next: () => void; cancel: () => void };

export function PackExperience({ gifts, onComplete }: {
  gifts: readonly GiftDefinition[]; onComplete: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const pack = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLDivElement>(null);
  const tearLine = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLSpanElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const slots = useRef<(HTMLDivElement | null)[]>([]);
  const flips = useRef<(HTMLDivElement | null)[]>([]);
  const effectLayer = useRef<EffectLayerHandle>(null);
  const tear = useRef<gsap.core.Timeline | null>(null);
  const activeTimeline = useRef<gsap.core.Timeline | null>(null);
  const returning = useRef<gsap.core.Tween | null>(null);
  const actions = useRef<Actions | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const phaseRef = useRef<Phase>("sealed");
  const indexRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("sealed");
  const [index, setIndex] = useState(0);
  const [opened, setOpened] = useState<string[]>([]);
  const mainButton = useRef<HTMLButtonElement>(null);
  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const moveTilt = useRef<{ x: (value: number) => void; y: (value: number) => void } | null>(null);
  const tiltBox = useRef<DOMRect | null>(null);

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const releasePointer = useCallback(() => {
    const current = gesture.current;
    gesture.current = null; // lostpointercapture must not cancel a committed gesture.
    if (current?.target.hasPointerCapture(current.id)) current.target.releasePointerCapture(current.id);
  }, []);

  useLayoutEffect(() => {
    let alive = true;
    const layer = effectLayer.current;
    const time = (normal: number) => reducedRef.current ? 0.01 : normal;
    const finish = (callback: () => void) => { if (alive) callback(); };
    const context = gsap.context(() => {
      gsap.set(flips.current.filter(Boolean), { rotationY: 180 });
      slots.current.forEach((slot, at) => {
        gsap.set(slot, { y: 24 + at * 4, scale: 0.88, autoAlpha: 0, rotation: (at - (gifts.length - 1) / 2) * 2 });
      });
      tear.current = gsap.timeline({ paused: true, defaults: { duration: 1, ease: "none" } })
        .to(cap.current, { x: 12, y: -22, rotation: -7, transformOrigin: "0% 50%" }, 0)
        .fromTo(tearLine.current, { scaleX: 0 }, { scaleX: 1 }, 0)
        .fromTo(meter.current, { scaleX: 0 }, { scaleX: 1 }, 0)
        .to(pack.current, { rotation: -2, x: -4 }, 0)
        .to(glow.current, { opacity: 0.3 }, 0);
      const x = gsap.quickTo(tilt.current, "rotationX", { duration: 0.3, ease: "power2.out" });
      const y = gsap.quickTo(tilt.current, "rotationY", { duration: 0.3, ease: "power2.out" });
      moveTilt.current = { x, y };
    }, root);

    actions.current = {
      cancel: () => {
        if (phaseRef.current !== "tearing") return;
        changePhase("returning");
        returning.current?.kill();
        context.add(() => {
          returning.current = gsap.to(tear.current, {
            progress: 0, duration: time(0.35), ease: "power2.out",
            onComplete: () => finish(() => changePhase("sealed")),
          });
        });
      },
      open: () => {
        if (phaseRef.current !== "sealed" && phaseRef.current !== "tearing") return;
        releasePointer();
        changePhase("opening");
        context.add(() => {
          const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" } });
          activeTimeline.current = timeline;
          timeline.to(tear.current, { progress: 1, duration: time(0.2) })
            .to(cap.current, {
              x: 210, y: -150, rotation: -40, autoAlpha: 0,
              duration: time(0.6), ease: "power2.in",
            })
            .call(() => finish(() => changePhase("dealing")))
            .to(glow.current, { opacity: reducedRef.current ? 0 : 0.6, duration: time(0.25) }, "<")
            .set(slots.current.filter(Boolean), { autoAlpha: 1 })
            .to(slots.current.filter(Boolean), {
              y: (at: number) => -140 + at * 5, scale: 1,
              rotation: (at: number) => (at - (gifts.length - 1) / 2) * 3,
              duration: time(0.8), stagger: reducedRef.current ? 0 : 0.06, ease: "power3.out",
            })
            .to(pack.current, { y: 280, rotation: 12, autoAlpha: 0, duration: time(0.65), ease: "power2.in" }, reducedRef.current ? ">" : "-=0.2")
            .to(slots.current.filter(Boolean), {
              y: (at: number) => at * 7, rotation: (at: number) => at * 2,
              scale: (at: number) => 1 - Math.min(at, 12) * 0.015,
              duration: time(0.7), ease: "back.out(1.2)",
            }, reducedRef.current ? ">" : "-=0.25")
            .to(glow.current, { opacity: 0, duration: time(0.4) }, "<")
            .call(() => finish(() => changePhase("ready")));
        });
      },
      reveal: () => {
        if (phaseRef.current !== "ready") return;
        changePhase("flipping");
        const at = indexRef.current;
        const gift = gifts[at];
        if (!gift) return;
        context.add(() => {
          const timeline = gsap.timeline();
          activeTimeline.current = timeline;
          timeline.to(slots.current[at], { y: -12, scale: 1.035, duration: time(0.22), ease: "power2.out" })
            .to(flips.current[at], { rotationY: 90, duration: time(0.28), ease: "power2.in" })
            .call(() => finish(() => {
              setOpened((previous) => previous.includes(gift.id) ? previous : [...previous, gift.id]);
              if (!reducedRef.current) {
                const effects = gift.revealEffect === "celebration"
                  ? ["confetti", "starburst"] as const
                  : gift.revealEffect === "glow" ? ["glitter", "halo"] as const : ["glitter"] as const;
                layer?.play(effects, { at: slots.current[at] ?? undefined, tone: gift.appearance?.primaryColor ?? packConfig.color });
              }
            }))
            .to(flips.current[at], { rotationY: 0, duration: time(0.42), ease: "power2.out" })
            .to(slots.current[at], { y: 0, scale: 1, duration: time(0.3), ease: "back.out(1.4)" }, reducedRef.current ? ">" : "-=0.15")
            .call(() => finish(() => changePhase("reading")));
        });
      },
      next: () => {
        if (phaseRef.current !== "reading") return;
        changePhase("discarding");
        layer?.clear();
        moveTilt.current?.x(0);
        moveTilt.current?.y(0);
        const at = indexRef.current;
        context.add(() => {
          const timeline = gsap.timeline();
          activeTimeline.current = timeline;
          timeline.to(slots.current[at], {
            x: at % 2 ? -330 : 330, y: -50, rotation: at % 2 ? -24 : 24,
            autoAlpha: 0, duration: time(0.48), ease: "power2.in",
          });
          if (at === gifts.length - 1) {
            timeline.call(() => finish(onComplete));
          } else {
            slots.current.slice(at + 1).forEach((slot, offset) => {
              timeline.to(slot, {
                y: offset * 7, rotation: offset * 2, scale: 1 - Math.min(offset, 12) * 0.015,
                duration: time(0.45), ease: "back.out(1.2)",
              }, time(0.25));
            });
            timeline.call(() => finish(() => {
              indexRef.current = at + 1;
              setIndex(at + 1);
              changePhase("ready");
            }));
          }
        });
      },
    };
    return () => {
      alive = false;
      releasePointer();
      actions.current = null;
      moveTilt.current = null;
      returning.current?.kill();
      layer?.clear();
      context.revert();
    };
  }, [gifts, onComplete, changePhase, releasePointer]);

  useEffect(() => {
    const cancel = () => {
      if (gesture.current) { releasePointer(); actions.current?.cancel(); }
    };
    window.addEventListener("resize", cancel);
    window.addEventListener("blur", cancel);
    return () => { window.removeEventListener("resize", cancel); window.removeEventListener("blur", cancel); };
  }, [releasePointer]);

  useEffect(() => {
    if (reduced) {
      moveTilt.current?.x(0);
      moveTilt.current?.y(0);
      effectLayer.current?.clear();
      activeTimeline.current?.progress(1);
    }
  }, [reduced]);

  useEffect(() => {
    if (phase === "ready") mainButton.current?.focus({ preventScroll: true });
  }, [phase, index]);

  function startGesture(event: PointerEvent<HTMLButtonElement>) {
    if (phaseRef.current !== "sealed" || !event.isPrimary || event.button !== 0) return;
    const box = event.currentTarget.getBoundingClientRect();
    gesture.current = { id: event.pointerId, start: event.clientX, distance: box.width * 0.85, progress: 0, target: event.currentTarget };
    event.currentTarget.setPointerCapture(event.pointerId);
    changePhase("tearing");
  }

  function dragGesture(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    const distance = event.clientX - current.start;
    current.progress = distance < 6 ? 0 : gsap.utils.clamp(0, 1, distance / current.distance);
    tear.current?.progress(current.progress);
  }

  function endGesture(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    if (!cancelled) dragGesture(event);
    releasePointer();
    if (!cancelled && current.progress >= packConfig.tearThreshold) actions.current?.open();
    else actions.current?.cancel();
  }

  const isPack = ["sealed", "tearing", "returning"].includes(phase);
  const busy = !["sealed", "ready", "reading"].includes(phase);
  const gift = gifts[index];
  const buttonLabel = phase === "reading"
    ? index === gifts.length - 1 ? "Ver meus presentes" : "Próximo presente"
    : phase === "ready" ? "Revelar presente" : "Abrir sem arrastar";
  const act = () => {
    if (phaseRef.current === "sealed") actions.current?.open();
    else if (phaseRef.current === "ready") actions.current?.reveal();
    else if (phaseRef.current === "reading") actions.current?.next();
  };

  return (
    <section ref={root} className="experience" data-phase={phase} aria-label="Abertura dos presentes"
      style={{ "--pack-color": packConfig.color } as CSSProperties}>
      <div className="scene">
        <div ref={glow} className="scene-glow" aria-hidden="true" />
        <div className="deck-position">
          <div ref={tilt} className="deck-tilt" aria-hidden="true">
            {gifts.map((card, at) => (
              <div key={card.id} className="card-slot" ref={(element) => { slots.current[at] = element; }}
                style={{ zIndex: gifts.length - at }}>
                <GiftCard gift={card} faceDown flipRef={(element) => { flips.current[at] = element; }} />
              </div>
            ))}
          </div>
          <button type="button" className="card-hit" aria-label={buttonLabel}
            hidden={phase !== "ready" && phase !== "reading"} onClick={act}
            onPointerEnter={(event) => { tiltBox.current = event.currentTarget.getBoundingClientRect(); }}
            onPointerMove={(event) => {
              const box = tiltBox.current;
              if (!box || phase !== "reading" || reduced || event.pointerType !== "mouse") return;
              moveTilt.current?.y(gsap.utils.clamp(-7, 7, ((event.clientX - box.left) / box.width - 0.5) * 14));
              moveTilt.current?.x(gsap.utils.clamp(-6, 6, -((event.clientY - box.top) / box.height - 0.5) * 12));
            }}
            onPointerLeave={() => { moveTilt.current?.x(0); moveTilt.current?.y(0); }} />
        </div>
        <div className="pack-position" aria-hidden={!isPack}>
          <div className="pack-float"><div ref={pack} className="pack-motion">
            <div className="pack-rear" />
            <div className="pack-mouth" />
            <div className="pack-front">
              <span className="pack-emblem">{packConfig.emblem}</span>
              <strong>{packConfig.label}</strong>
              <span className="pack-count">{gifts.length} {gifts.length === 1 ? "presente" : "presentes"} para descobrir</span>
              <div className="pack-bottom-seal" />
            </div>
            <div ref={cap} className="pack-cap"><span>RASGUE AQUI <span aria-hidden="true">→</span></span></div>
            <div ref={tearLine} className="tear-line"><svg viewBox="0 0 280 10" preserveAspectRatio="none" aria-hidden="true">
              <path d="m0 5 9-3 7 5 8-4 10 4 8-6 9 5 7-3 11 4 8-5 12 4 9-3 10 4 9-5 10 4 11-2 10 3 9-4 11 3 10-5 11 5 12-3 9 3 9-4 11 3 11-2 9 3 10-4" />
            </svg></div>
          </div></div>
          <button className="tear-target" type="button" disabled={!isPack || phase === "returning"}
            aria-label="Arraste da esquerda para a direita para rasgar, ou pressione Enter para abrir"
            onPointerDown={startGesture} onPointerMove={dragGesture}
            onPointerUp={(event) => endGesture(event)} onPointerCancel={(event) => endGesture(event, true)}
            onLostPointerCapture={(event) => endGesture(event, true)}
            onClick={(event) => { if (event.detail === 0) act(); }} />
        </div>
        <EffectLayer handle={effectLayer} className="scene-effects" />
      </div>
      <div className="experience-caption" aria-live="polite" aria-atomic="true">
        <h2>{phase === "reading" ? gift?.name : phase === "ready" ? `Presente ${index + 1} de ${gifts.length}`
          : phase === "flipping" ? "Uma surpresa chegando…" : phase === "opening" || phase === "dealing" ? "Seu pacote está se abrindo…"
          : phase === "discarding" ? "Guardando seu presente…" : "Puxe a faixa. Abra a surpresa."}</h2>
        <p>{phase === "reading" ? gift?.line : isPack ? "Arraste a faixa superior para a direita e solte para rasgar." : "Cada carta tem um presente esperando por você."}</p>
      </div>
      <div className="experience-controls">
        <button ref={mainButton} type="button" className={isPack ? "text-button" : "primary-button"} disabled={busy} onClick={act}>
          {busy ? "Só um instante…" : buttonLabel}
        </button>
        <div className="progress-track" aria-hidden="true" hidden={!isPack}><span ref={meter} /></div>
        <p className="progress-label">{opened.length} de {gifts.length} presentes revelados</p>
      </div>
    </section>
  );
}
