export interface BoosterMotion {
  tear: number;
  tension: number;
  peel: number;
  drop: number;
  emerge: number;
  settle: number;
  hoverX: number;
  hoverY: number;
  breath: number;
}

export function createBoosterMotion(): BoosterMotion {
  return { tear: 0, tension: 0, peel: 0, drop: 0, emerge: 0, settle: 0, hoverX: 0, hoverY: 0, breath: 0 };
}

export function packPointerTilt(clientX: number, clientY: number, width: number, height: number) {
  const normalizedX = Math.max(-1, Math.min(1, (clientX / Math.max(width, 1) - 0.5) * 2));
  const normalizedY = Math.max(-1, Math.min(1, (clientY / Math.max(height, 1) - 0.5) * 2));
  return { x: normalizedY * 0.06, y: -normalizedX * 0.2 };
}

export function packPose(motion: BoosterMotion) {
  return {
    rotationX: motion.hoverX,
    rotationY: motion.hoverY - motion.tension * 0.035,
    rotationZ: -motion.tension * 0.025,
    y: -motion.emerge * 0.35 + motion.breath * 0.045,
    scale: 1 + motion.breath * 0.008,
  };
}

/** Luz derivada do mesmo progresso do rasgo, sem timeline ou relógio independente. */
export function packLight(motion: BoosterMotion, reducedMotion = false) {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const smooth = (value: number) => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  const progress = clamp(motion.tear);
  const opening = smooth(motion.peel);
  const transition = smooth((motion.peel - 0.6) / 0.4);
  const gate = smooth(progress / 0.35) * (1 - smooth(motion.settle)) * (reducedMotion ? 0.2 : 1);
  const seamStrength = gate * (1 - transition);
  const afterglow = gate * transition * 0.18;
  return {
    progress,
    strength: seamStrength + afterglow,
    seamStrength,
    afterglow,
    height: reducedMotion ? 0.35 : 0.3 + opening * 0.75,
  };
}

// Numeric poses are shared by the renderer and regression tests.
export function cardPose(index: number, count: number, motion: BoosterMotion, pixelsPerUnit: number) {
  const progress = Math.min(1, Math.max(0, motion.emerge * (1 + (count - 1) * 0.08) - index * 0.08));
  const settle = motion.settle;
  return {
    x: ((index - (count - 1) / 2) * 0.08 * progress) * (1 - settle),
    y: (-0.35 + progress * 1.45) * (1 - settle) - index * 7 / pixelsPerUnit * settle,
    z: (-0.36 - index * 0.035) * (1 - settle) - index * 0.001 * settle,
    rotationX: -0.09 * progress * (1 - settle),
    rotationY: 0.12 * progress * (1 - settle),
    rotationZ: -index * Math.PI / 90,
    scale: 1 - Math.min(index, 12) * 0.015,
  };
}
