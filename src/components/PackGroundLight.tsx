import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, ShaderMaterial, type Mesh } from "three";
import { packGroundLight, type BoosterMotion } from "../three/boosterMotion";

/** Elipse luminosa em perspectiva, sem precisar desenhar um chão sobre o fundo preto. */
export function PackGroundLight({ motion, width, height, reducedMotion }: {
  motion: RefObject<BoosterMotion>; width: number; height: number; reducedMotion: boolean;
}) {
  const plane = useRef<Mesh>(null);
  const material = useMemo(() => new ShaderMaterial({
    uniforms: { strength: { value: 0 } },
    vertexShader: `
      varying vec2 lightUv;
      void main() {
        lightUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 lightUv;
      uniform float strength;
      void main() {
        vec2 center = (lightUv - 0.5) * 2.0;
        float radius = length(center);
        float edge = 1.0 - smoothstep(0.0, 1.0, radius);
        float core = exp(-dot(center, center) * 8.0);
        vec3 tint = mix(vec3(1.0, 0.24, 0.58), vec3(1.0, 0.92, 0.96), core);
        gl_FragColor = vec4(tint, edge * (0.3 + core * 0.7) * strength);
        #include <colorspace_fragment>
      }
    `,
    transparent: true, blending: AdditiveBlending,
    depthWrite: false, depthTest: true, toneMapped: false,
  }), []);

  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    const light = packGroundLight(motion.current, reducedMotion);
    material.uniforms.strength.value = light.strength;
    if (plane.current) {
      plane.current.visible = light.strength > 0.001;
      plane.current.position.x = light.x;
      plane.current.scale.set(width * 1.65 * light.widthScale, width * 0.2, 1);
    }
  });

  return <mesh ref={plane} material={material} position={[0, -height / 2 - 0.28, -0.35]}>
    <planeGeometry args={[1, 1]} />
  </mesh>;
}
