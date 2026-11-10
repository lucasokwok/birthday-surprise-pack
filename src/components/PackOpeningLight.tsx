import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending, Color, Euler, MeshBasicMaterial, ShaderMaterial,
  type Group, type Mesh, type PointLight,
} from "three";
import { CARD_LAYOUT } from "../data/cardLayout";
import { cardPose, packLight, packPose, type BoosterMotion } from "../three/boosterMotion";

function createEmission() {
  const beam = new ShaderMaterial({
    uniforms: { strength: { value: 0 }, backlight: { value: 0 } },
    vertexShader: `
      varying vec2 beamUv;
      uniform float backlight;
      void main() {
        beamUv = uv;
        vec3 expanded = position;
        // Preservar a largura da base e abrir o feixe em 60% até o topo.
        expanded.x *= mix(1.0 + 0.6 * uv.y, 1.0, backlight);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(expanded, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 beamUv;
      uniform float strength;
      uniform float backlight;
      void main() {
        // Faixa ampla desde a base, com suavização apenas nas extremidades.
        float edge = 1.0 - smoothstep(0.47, 0.5, abs(beamUv.x - 0.5));
        float fade = pow(clamp(1.0 - beamUv.y, 0.0, 1.0), 1.1);
        vec2 bounds = 1.0 - smoothstep(vec2(0.3), vec2(0.5), abs(beamUv - 0.5));
        float alpha = mix(edge * fade, bounds.x * bounds.y, backlight);
        vec3 lightColor = mix(vec3(7.0, 6.4, 6.8), vec3(4.0, 3.4, 3.8), backlight);
        gl_FragColor = vec4(lightColor, alpha * strength);
        #include <colorspace_fragment>
      }
    `,
    blending: AdditiveBlending, transparent: true,
    depthWrite: false, depthTest: true, toneMapped: false,
  });
  const edge = new MeshBasicMaterial({
    color: new Color(5, 4.6, 4.9), blending: AdditiveBlending,
    transparent: true, depthWrite: false, depthTest: true, toneMapped: false, opacity: 0,
  });
  const backlight = beam.clone();
  backlight.uniforms.backlight.value = 1;
  return { beam, edge, backlight };
}

export function PackOpeningLight({ motion, width, cutY, count, pixelsPerUnit, reducedMotion }: {
  motion: RefObject<BoosterMotion>; width: number; cutY: number;
  count: number; pixelsPerUnit: number; reducedMotion: boolean;
}) {
  const source = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const beam = useRef<Mesh>(null);
  const edge = useRef<Mesh>(null);
  const backlight = useRef<Mesh>(null);
  const emission = useMemo(createEmission, []);
  const orientation = useMemo(() => new Euler(), []);
  useEffect(() => () => {
    emission.beam.dispose(); emission.edge.dispose(); emission.backlight.dispose();
  }, [emission]);

  useFrame(() => {
    const value = packLight(motion.current, reducedMotion);
    const pack = packPose(motion.current);
    const span = width * value.progress;
    orientation.set(pack.rotationX, pack.rotationY, pack.rotationZ);
    if (source.current) {
      source.current.position.set((span - width) / 2, cutY + 0.005, 0.02)
        .applyEuler(orientation).multiplyScalar(pack.scale);
      source.current.position.y += pack.y;
      source.current.rotation.copy(orientation);
      source.current.scale.setScalar(pack.scale);
    }
    if (light.current) light.current.intensity = value.seamStrength * 22;
    if (beam.current) {
      beam.current.visible = value.seamStrength > 0.001;
      beam.current.position.y = value.height / 2;
      // A margem leva o suavizado para além do rasgo, mantendo suas pontas iluminadas.
      beam.current.scale.set(span + 0.12, value.height, 1);
    }
    if (edge.current) {
      edge.current.visible = value.seamStrength > 0.001;
      edge.current.scale.x = span;
    }
    if (backlight.current) {
      const card = cardPose(0, count, motion.current, pixelsPerUnit);
      backlight.current.visible = value.afterglow > 0.001;
      backlight.current.position.set(card.x, card.y, card.z - 0.1);
      backlight.current.rotation.set(card.rotationX, card.rotationY, card.rotationZ);
      backlight.current.scale.set(CARD_LAYOUT.width * 1.4 * card.scale,
        CARD_LAYOUT.width * CARD_LAYOUT.ratio * 1.4 * card.scale, 1);
    }
    emission.beam.uniforms.strength.value = value.seamStrength;
    emission.edge.opacity = value.seamStrength;
    emission.backlight.uniforms.strength.value = value.afterglow;
  });

  // O núcleo fica na costura; o brilho residual ocupa uma camada atrás do baralho.
  return <>
    <group ref={source}>
      <pointLight ref={light} position={[0, -0.04, 0]} color="#fff1f8" intensity={0} distance={3} decay={2} />
      <mesh ref={edge} material={emission.edge} position={[0, 0.025, 0]} visible={false}>
        <planeGeometry args={[1, 0.11]} />
      </mesh>
      <mesh ref={beam} material={emission.beam} visible={false}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
    <mesh ref={backlight} material={emission.backlight} visible={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  </>;
}
