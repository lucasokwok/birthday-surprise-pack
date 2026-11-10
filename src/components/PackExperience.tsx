import {
  lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState,
  type PointerEvent,
} from "react";
import { gsap } from "gsap";
import { EffectLayer, type EffectLayerHandle } from "@react-cards-opening/ui";
import { usePrefersReducedMotion } from "@react-cards-opening/core";
import type { GiftDefinition } from "../data/gifts";
import { packConfig } from "../data/pack";
import { GiftCard } from "./GiftCard";
import { createBoosterMotion, packPointerTilt } from "../three/boosterMotion";

const BoosterScene = lazy(() => import("./BoosterScene"));

type Phase = "sealed" | "tearing" | "returning" | "opening" | "dealing" | "ready" | "flipping" | "reading" | "discarding";
type Gesture = { id: number; start: number; distance: number; progress: number; target: HTMLButtonElement };
type Actions = { open: () => void; reveal: () => void; next: () => void; cancel: () => void };

export function PackExperience({ gifts, onComplete }: {
  gifts: readonly GiftDefinition[]; onComplete: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const motion = useRef(createBoosterMotion());
  const invalidate = useRef<(() => void) | null>(null);
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");
  const loaded = useCallback(() => setModelStatus("ready"), []);
  const failed = useCallback(() => setModelStatus("error"), []);
  const connect = useCallback((callback: (() => void) | null) => { invalidate.current = callback; }, []);
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
  const cardAction = useRef<HTMLButtonElement>(null);
  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const movePack = useRef<{ x: (value: number) => void; y: (value: number) => void; stop: () => void } | null>(null);
  const idleMotion = useRef<{ play: () => void; stop: (immediate?: boolean) => void } | null>(null);
  const packTouchRegion = useRef<HTMLDivElement>(null);
  const packTouch = useRef<{ id: number; target: HTMLDivElement } | null>(null);
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

  const releasePackTouch = useCallback(() => {
    const current = packTouch.current;
    packTouch.current = null;
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
      tear.current = gsap.timeline({ paused: true, defaults: { duration: 1, ease: "none" }, onUpdate: () => invalidate.current?.() })
        .to(motion.current, { tear: 1, tension: 0.65 }, 0);
      const hoverX = gsap.quickTo(motion.current, "hoverX", { duration: packConfig.idle.tiltDuration, ease: "power2.out", onUpdate: () => invalidate.current?.() });
      const hoverY = gsap.quickTo(motion.current, "hoverY", { duration: packConfig.idle.tiltDuration, ease: "power2.out", onUpdate: () => invalidate.current?.() });
      movePack.current = { x: hoverX, y: hoverY, stop: () => { hoverX.tween.pause(); hoverY.tween.pause(); } };
      const x = gsap.quickTo(tilt.current, "rotationX", { duration: 0.3, ease: "power2.out" });
      const y = gsap.quickTo(tilt.current, "rotationY", { duration: 0.3, ease: "power2.out" });
      moveTilt.current = { x, y };
    }, root);

    context.add(() => {
      const breath = gsap.to(motion.current, {
        breath: 1, duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true, paused: true,
        onUpdate: () => invalidate.current?.(),
      });
      const { shakeInterval, shakeDuration } = packConfig.idle;
      const shake = gsap.timeline({
        paused: true, delay: shakeInterval, repeat: -1,
        onUpdate: () => invalidate.current?.(),
      });
      // Dois impulsos espelhados por ciclo, com início a cada dois segundos.
      [1, -1].forEach((direction, cycle) => {
        let at = cycle * shakeInterval;
        for (const [strength, fraction] of [[1, 0.15], [-0.75, 0.2], [0.45, 0.175], [-0.2, 0.175], [0, 0.3]]) {
          const duration = shakeDuration * fraction;
          shake.to(motion.current, { shake: strength * direction, duration, ease: "power2.out" }, at);
          at += duration;
        }
      });
      shake.set(motion.current, { shake: 0 }, shakeInterval * 2);
      let settle: gsap.core.Tween | null = null;
      let running = false;
      idleMotion.current = {
        play: () => {
          if (running) return;
          running = true;
          settle?.kill();
          breath.invalidate().restart();
          shake.restart(true);
        },
        stop: (immediate = false) => {
          running = false;
          breath.pause();
          shake.pause();
          settle?.kill();
          if (immediate) {
            motion.current.breath = 0;
            motion.current.shake = 0;
            invalidate.current?.();
          } else if (motion.current.breath !== 0 || motion.current.shake !== 0) {
            context.add(() => {
              settle = gsap.to(motion.current, {
                breath: 0, shake: 0, duration: 0.15, ease: "power2.out",
                onUpdate: () => invalidate.current?.(),
              });
            });
          }
        },
      };
    });

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
        movePack.current?.stop();
        idleMotion.current?.stop(reducedRef.current);
        releasePackTouch();
        releasePointer();
        changePhase("opening");
        context.add(() => {
          const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" }, onUpdate: () => invalidate.current?.() });
          activeTimeline.current = timeline;
          timeline.to(motion.current, { tension: 1, hoverX: 0, hoverY: 0, duration: time(0.18) })
            .to(tear.current, { progress: 1, duration: time(0.3) })
            .to(motion.current, { peel: 1, tension: 0, duration: time(0.7), ease: "power2.in" })
            .call(() => finish(() => changePhase("dealing")))
            .to(motion.current, { emerge: 1, duration: time(1.05), ease: "power3.out" })
            .to(motion.current, { drop: 1, duration: time(0.85), ease: "power2.in" }, reducedRef.current ? ">" : "-=0.4")
            .to(motion.current, { settle: 1, duration: time(0.65), ease: "power2.out" })
            .call(() => finish(() => {
              slots.current.forEach((slot, at) => {
                gsap.set(slot, { autoAlpha: 1, y: at * 7, rotation: at * 2, scale: 1 - Math.min(at, 12) * 0.015 });
              });
              changePhase("ready");
            }));
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
      releasePackTouch();
      actions.current = null;
      moveTilt.current = null;
      movePack.current = null;
      idleMotion.current = null;
      returning.current?.kill();
      layer?.clear();
      context.revert();
    };
  }, [gifts, onComplete, changePhase, releasePointer, releasePackTouch]);

  useEffect(() => {
    const update = () => {
      if (phaseRef.current === "sealed" && modelStatus === "ready" && !reduced && !document.hidden && !packTouch.current) {
        idleMotion.current?.play();
      } else idleMotion.current?.stop(reduced || document.hidden);
      if (document.hidden) {
        releasePackTouch();
        movePack.current?.stop();
        motion.current.hoverX = 0;
        motion.current.hoverY = 0;
        invalidate.current?.();
      }
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [phase, modelStatus, reduced, releasePackTouch]);

  useEffect(() => {
    const cancel = () => {
      if (gesture.current) { releasePointer(); actions.current?.cancel(); }
      const wasTilting = packTouch.current !== null;
      releasePackTouch();
      if (phaseRef.current === "sealed") {
        movePack.current?.x(0);
        movePack.current?.y(0);
        if (wasTilting && !document.hidden && !reducedRef.current) idleMotion.current?.play();
      }
    };
    window.addEventListener("resize", cancel);
    window.addEventListener("blur", cancel);
    return () => { window.removeEventListener("resize", cancel); window.removeEventListener("blur", cancel); };
  }, [releasePointer, releasePackTouch]);

  useEffect(() => {
    if (reduced) {
      releasePackTouch();
      idleMotion.current?.stop(true);
      moveTilt.current?.x(0);
      moveTilt.current?.y(0);
      movePack.current?.stop();
      motion.current.hoverX = 0;
      motion.current.hoverY = 0;
      invalidate.current?.();
      effectLayer.current?.clear();
      activeTimeline.current?.progress(1);
    }
  }, [reduced, releasePackTouch]);

  useEffect(() => {
    if (phase === "ready") cardAction.current?.focus({ preventScroll: true });
  }, [phase, index]);

  function startGesture(event: PointerEvent<HTMLButtonElement>) {
    if (modelStatus !== "ready" || phaseRef.current !== "sealed" || !event.isPrimary || event.button !== 0) return;
    movePack.current?.stop();
    idleMotion.current?.stop();
    releasePackTouch();
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
  const busy = !["sealed", "ready", "reading"].includes(phase) || modelStatus !== "ready";
  const showModel = isPack || phase === "opening" || phase === "dealing";
  const gift = gifts[index];
  const buttonLabel = phase === "reading"
    ? index === gifts.length - 1 ? "Ver meus presentes" : "Próximo presente"
    : phase === "ready" ? "Revelar presente" : "Abrir sem arrastar";
  const act = () => {
    if (modelStatus !== "ready") return;
    if (phaseRef.current === "sealed") actions.current?.open();
    else if (phaseRef.current === "ready") actions.current?.reveal();
    else if (phaseRef.current === "reading") actions.current?.next();
  };

  function followPack(clientX: number, clientY: number) {
    const box = packTouchRegion.current?.getBoundingClientRect();
    if (!box) return;
    const target = packPointerTilt(clientX - box.left, clientY - box.top, box.width, box.height);
    movePack.current?.x(target.x);
    movePack.current?.y(target.y);
  }

  function startPackTouch(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" || !event.isPrimary || event.button !== 0 || packTouch.current
      || phaseRef.current !== "sealed" || reducedRef.current || modelStatus !== "ready") return;
    packTouch.current = { id: event.pointerId, target: event.currentTarget };
    event.currentTarget.setPointerCapture(event.pointerId);
    idleMotion.current?.stop();
    followPack(event.clientX, event.clientY);
  }

  function endPackTouch(event: PointerEvent<HTMLDivElement>) {
    if (packTouch.current?.id !== event.pointerId) return;
    releasePackTouch();
    if (phaseRef.current !== "sealed") return;
    movePack.current?.x(0);
    movePack.current?.y(0);
    if (!reducedRef.current && !document.hidden && modelStatus === "ready") idleMotion.current?.play();
  }

  return (
    <section ref={root} className="experience" data-phase={phase} data-model-status={modelStatus} aria-label="Abertura dos presentes"
      onPointerMove={(event) => {
        if (phaseRef.current !== "sealed" || reducedRef.current || event.pointerType !== "mouse" || modelStatus !== "ready") return;
        followPack(event.clientX, event.clientY);
      }} onPointerLeave={() => {
        if (phaseRef.current === "sealed" && !packTouch.current) { movePack.current?.x(0); movePack.current?.y(0); }
      }}>
      <div className="scene">
        {showModel ? <Suspense fallback={null}>
          <BoosterScene motion={motion} count={gifts.length} reducedMotion={reduced}
            onReady={loaded} onError={failed} connect={connect} />
        </Suspense> : null}
        <div className="deck-position">
          <div className="deck-backlight" aria-hidden="true" />
          <div ref={tilt} className="deck-tilt" aria-hidden="true">
            {gifts.map((card, at) => (
              <div key={card.id} className="card-slot" ref={(element) => { slots.current[at] = element; }}
                style={{ zIndex: gifts.length - at }}>
                <GiftCard gift={card} faceDown flipRef={(element) => { flips.current[at] = element; }} />
              </div>
            ))}
          </div>
          <button ref={cardAction} type="button" className="card-hit" aria-label={buttonLabel}
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
        {phase === "sealed" && modelStatus === "ready" ? <div ref={packTouchRegion} className="pack-touch-target" aria-hidden="true"
          onPointerDown={startPackTouch}
          onPointerMove={(event) => {
            if (phaseRef.current === "sealed" && !reducedRef.current && packTouch.current?.id === event.pointerId) {
              followPack(event.clientX, event.clientY);
            }
          }}
          onPointerUp={endPackTouch} onPointerCancel={endPackTouch} onLostPointerCapture={endPackTouch} /> : null}
        {isPack ? <button className="tear-target" type="button" disabled={modelStatus !== "ready" || phase === "returning"}
          aria-label="Arraste da esquerda para a direita para rasgar, ou pressione Enter para abrir"
          onPointerDown={startGesture} onPointerMove={dragGesture}
          onPointerUp={(event) => endGesture(event)} onPointerCancel={(event) => endGesture(event, true)}
          onLostPointerCapture={(event) => endGesture(event, true)}
          onClick={(event) => { if (event.detail === 0) act(); }} /> : null}
        <EffectLayer handle={effectLayer} className="scene-effects" />
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        <h2>{phase === "reading" ? gift?.name : phase === "ready" ? `Presente ${index + 1} de ${gifts.length}`
          : phase === "flipping" ? "Uma surpresa chegando…" : phase === "opening" || phase === "dealing" ? "Seu pacote está se abrindo…"
          : phase === "discarding" ? "Guardando seu presente…" : "Puxe a faixa. Abra a surpresa."}</h2>
        <p>{phase === "reading" ? "Acione a carta para continuar." : isPack ? "Arraste a faixa superior para a direita e solte para rasgar." : "Cada carta tem um presente esperando por você."}</p>
      </div>
      <div className="accessible-controls">
        <button ref={mainButton} type="button" className="sr-only-focusable" disabled={busy} onClick={act}>
          {busy ? "Só um instante…" : buttonLabel}
        </button>
        <p className="sr-only">{opened.length} de {gifts.length} presentes revelados</p>
      </div>
    </section>
  );
}
