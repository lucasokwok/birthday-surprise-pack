import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import {
  ACESFilmicToneMapping, CanvasTexture, Group, SRGBColorSpace,
  PerspectiveCamera, TextureLoader, MeshStandardMaterial, type Material,
} from "three";
import modelUrl from "../../models/booster_pack_tcg_pack.glb?url";
import { prepareBooster } from "../three/boosterGeometry";
import { cardPose, packPose, type BoosterMotion } from "../three/boosterMotion";
import { createCardGeometry } from "../three/cardGeometry";
import { CARD_LAYOUT } from "../data/cardLayout";
import { packConfig } from "../data/pack";
import { CARD_PALETTE } from "../data/cardPalette";
import { CARD_BACK_IMAGE } from "../data/cardBack";
import { PackOpeningLight } from "./PackOpeningLight";
import { PackGroundLight } from "./PackGroundLight";

const labelUrl = `${import.meta.env.BASE_URL}${packConfig.labelTexture}`;

export interface BoosterSceneProps {
  motion: RefObject<BoosterMotion>;
  count: number;
  reducedMotion: boolean;
  onReady: () => void;
  onError: () => void;
  connect: (invalidate: (() => void) | null) => void;
}

type BoundaryProps = { children: ReactNode; fallback: ReactNode; onError: () => void };
class AssetBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function ModelFailure({ onError, retry }: { onError: () => void; retry: () => void }) {
  useEffect(onError, [onError]);
  return <div className="model-failure" role="alert">
    <p>Não foi possível carregar o pacote 3D.</p>
    <button type="button" className="text-button" onClick={retry}>Tentar novamente</button>
  </div>;
}

function cardBackTexture(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 372;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível criar a imagem do verso.");
  const gradient = ctx.createLinearGradient(0, 0, 256, 372);
  gradient.addColorStop(0, CARD_PALETTE.base);
  gradient.addColorStop(1, CARD_PALETTE.raised);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 372);
  ctx.strokeStyle = CARD_PALETTE.blush;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(12, 12, 232, 348, 14); ctx.stroke();
  ctx.strokeStyle = `${CARD_PALETTE.blush}4d`;
  ctx.beginPath(); ctx.roundRect(22, 22, 212, 328, 10); ctx.stroke();
  const inset = 28;
  const scale = Math.min((canvas.width - inset * 2) / image.naturalWidth,
    (canvas.height - inset * 2) / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function SceneModel({ motion, count, reducedMotion, onReady, connect }: BoosterSceneProps) {
  // No Draco/Meshopt decoders or external textures are needed by this asset.
  const { scene } = useGLTF(modelUrl, false, false);
  const [labelSource, backSource] = useLoader(TextureLoader, [labelUrl, CARD_BACK_IMAGE]);
  const labelTexture = useMemo(() => {
    // A cópia pertence à sessão; a imagem de origem permanece no cache do loader.
    const texture = labelSource.clone();
    texture.colorSpace = SRGBColorSpace;
    // Os UVs deste rótulo crescem de baixo para cima: manter a orientação padrão do PNG.
    texture.flipY = true;
    texture.needsUpdate = true;
    return texture;
  }, [labelSource]);
  const model = useMemo(() => prepareBooster(scene), [scene]);
  const body = useRef<Group>(null);
  const cap = useRef<Group>(null);
  const packRoot = useRef<Group>(null);
  const cards = useRef<(Group | null)[]>([]);
  const { camera, size, invalidate } = useThree();
  const widthPixels = Math.min(size.width * 0.66, 248, size.height * 0.37);
  const pixelsPerUnit = widthPixels / CARD_LAYOUT.width;
  const uniforms = useMemo(() => ({ progress: { value: 0 }, opening: { value: 0 } }), []);
  const materials = useMemo(() => model.parts.map(({ material, role }) => {
    const make = (isCap: boolean): Material => {
      const copy = material.clone() as MeshStandardMaterial;
      // The label retains its authored shape through tearing and the shared body discard.
      if (role === "label") {
        copy.map = labelTexture;
        copy.transparent = true;
        copy.depthWrite = false;
        copy.alphaTest = 0.001;
        return copy;
      }
      // Preserve the GLB's PBR values, maps, color, side and UVs. Only vertex motion is added.
      copy.onBeforeCompile = (shader) => {
        shader.uniforms.boosterProgress = uniforms.progress;
        shader.uniforms.boosterOpening = uniforms.opening;
        shader.vertexShader = `uniform float boosterProgress;\nuniform float boosterOpening;\n` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
          #include <begin_vertex>
          float alongSeam = (position.x + ${model.width / 2}) / ${model.width};
          float released = 1.0 - smoothstep(boosterProgress - 0.04, boosterProgress + 0.04, alongSeam);
          released *= smoothstep(0.0, 0.08, boosterProgress);
          ${isCap ? `
            transformed.y += released * boosterProgress * 0.13;
            transformed.z += released * boosterProgress * 0.18;
            transformed.x -= released * boosterProgress * 0.03;
          ` : `
            float rim = smoothstep(${model.bendStartY}, ${model.cutY}, position.y);
            transformed.z += sign(position.z) * released * boosterOpening * rim * 0.19;
            transformed.y -= released * boosterProgress * rim * 0.025;
          `}
        `);
      };
      copy.customProgramCacheKey = () => `booster-tear-${isCap ? "cap" : "body"}`;
      return copy;
    };
    return { body: make(false), cap: make(true) };
  }), [model, uniforms, labelTexture]);
  const back = useMemo(() => cardBackTexture(backSource.image), [backSource]);
  const cardGeometry = useMemo(createCardGeometry, []);
  const cardMaterial = useMemo(() => new MeshStandardMaterial({
    color: CARD_PALETTE.base, roughness: 0.6,
  }), []);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    // At the handoff, the WebGL card exactly matches the existing DOM card's size.
    camera.position.set(0, 0, size.height / (2 * pixelsPerUnit * Math.tan(camera.fov * Math.PI / 360)));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.height, pixelsPerUnit, invalidate]);

  useEffect(() => {
    connect(invalidate);
    onReady();
    return () => connect(null);
  }, [connect, invalidate, onReady]);

  useEffect(() => () => {
    for (let i = 0; i < model.parts.length; i++) {
      model.parts[i].body.dispose(); model.parts[i].cap.dispose();
      materials[i].body.dispose(); materials[i].cap.dispose();
    }
    back.dispose();
    labelTexture.dispose();
    cardGeometry.body.dispose();
    cardGeometry.face.dispose();
    cardMaterial.dispose();
  }, [model, materials, back, cardGeometry, labelTexture, cardMaterial]);

  useFrame(() => {
    const value = motion.current;
    uniforms.progress.value = value.tear;
    uniforms.opening.value = Math.max(value.peel, value.tear * 0.3);
    if (packRoot.current) {
      const pose = packPose(value);
      packRoot.current.rotation.set(pose.rotationX, pose.rotationY, pose.rotationZ);
      packRoot.current.position.set(pose.x, pose.y, 0);
      packRoot.current.scale.setScalar(pose.scale);
    }
    if (body.current) {
      body.current.position.set(value.drop * 0.35, -value.drop * 6, -value.drop * 0.6);
      body.current.rotation.set(value.drop * 0.25, value.drop * 0.3, value.drop * 0.23);
    }
    if (cap.current) {
      cap.current.position.set(model.width / 2 + value.peel * 3, model.cutY + value.peel * 1.6, value.peel * 0.8);
      cap.current.rotation.set(-value.peel * 0.5, value.peel * 0.8, -value.peel * 0.85);
    }
    cards.current.forEach((card, index) => {
      if (!card) return;
      const pose = cardPose(index, count, value, pixelsPerUnit);
      card.position.set(pose.x, pose.y, pose.z);
      card.rotation.set(pose.rotationX, pose.rotationY, pose.rotationZ);
      card.scale.setScalar(pose.scale);
      card.visible = value.emerge > 0;
    });
  });

  return <>
    <ambientLight intensity={0.4} />
    <directionalLight position={[3, 4, 6]} intensity={3} />
    <directionalLight position={[-4, 1, 3]} intensity={1} />
    <Environment frames={1} resolution={128} background={false}>
      <Lightformer form="rect" intensity={3} position={[-3, 2, 5]} scale={[2, 7, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2} position={[3, 0, 3]} scale={[1.5, 6, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1} position={[0, 4, 1]} scale={[5, 2, 1]} target={[0, 0, 0]} />
    </Environment>
    <group ref={packRoot} dispose={null}>
      <group ref={body}>
        {model.parts.map((part, index) => part.body.getAttribute("position").count ? (
          <mesh key={part.name} geometry={part.body} material={materials[index].body} />
        ) : null)}
      </group>
      <group ref={cap} position={[model.width / 2, model.cutY, 0]}>
        <group position={[-model.width / 2, -model.cutY, 0]}>
          {model.parts.map((part, index) => part.cap.getAttribute("position").count ? (
            <mesh key={part.name} geometry={part.cap} material={materials[index].cap} />
          ) : null)}
        </group>
      </group>
    </group>
    <PackGroundLight motion={motion} width={model.width} height={model.height} reducedMotion={reducedMotion} />
    <PackOpeningLight motion={motion} width={model.width} cutY={model.cutY}
      count={count} pixelsPerUnit={pixelsPerUnit} reducedMotion={reducedMotion} />
    {Array.from({ length: count }, (_, index) => <group key={index} ref={(element) => { cards.current[index] = element; }} visible={false}>
      <mesh material={cardMaterial}>
        <primitive object={cardGeometry.body} attach="geometry" />
      </mesh>
      <mesh position={[0, 0, CARD_LAYOUT.depth / 2 + 0.002]}>
        <primitive object={cardGeometry.face} attach="geometry" />
        <meshBasicMaterial map={back} toneMapped={false} />
      </mesh>
    </group>)}
  </>;
}

export default function BoosterScene(props: BoosterSceneProps) {
  const [attempt, setAttempt] = useState(0);
  const retry = () => {
    useGLTF.clear(modelUrl);
    useLoader.clear(TextureLoader, [labelUrl, CARD_BACK_IMAGE]);
    setAttempt((value) => value + 1);
  };
  const failure = <ModelFailure onError={props.onError} retry={retry} />;
  return <div className="booster-canvas">
    <AssetBoundary key={attempt} fallback={failure} onError={props.onError}>
      <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ fov: 36, near: 0.1, far: 50, position: [0, 0, 9] }}
        gl={{ antialias: true, alpha: false, toneMapping: ACESFilmicToneMapping }} fallback={failure}
        onCreated={({ gl }) => { gl.setClearColor("#000000", 1); }}>
        <Suspense fallback={null}><SceneModel {...props} /></Suspense>
      </Canvas>
    </AssetBoundary>
  </div>;
}
