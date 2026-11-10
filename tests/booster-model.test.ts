import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BufferGeometry, Euler, Float32BufferAttribute, Matrix3, Vector3, Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { prepareBooster, splitGeometry } from "../src/three/boosterGeometry.ts";
import { cardPose, createBoosterMotion, packLight, packPointerTilt, packPose } from "../src/three/boosterMotion.ts";

const bytes = await readFile(new URL("../models/booster_pack_tcg_pack.glb", import.meta.url));
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");

function area(geometry: BufferGeometry) {
  const positions = geometry.getAttribute("position");
  let total = 0;
  for (let i = 0; i < positions.count; i += 3) {
    const a = new Vector3().fromBufferAttribute(positions, i);
    const b = new Vector3().fromBufferAttribute(positions, i + 1);
    const c = new Vector3().fromBufferAttribute(positions, i + 2);
    total += b.sub(a).cross(c.sub(a)).length() / 2;
  }
  return total;
}

test("o GLB fornecido tem duas malhas, dois materiais e não contém texturas ou animações", () => {
  const json = gltf.parser.json;
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  assert.equal(json.meshes.length, 2);
  assert.equal(json.materials.length, 2);
  assert.equal(json.images?.length ?? 0, 0);
  assert.equal(json.textures?.length ?? 0, 0);
  assert.equal(gltf.animations.length, 0);
  assert.equal(json.asset.extras.author, "Hasan Ajami (https://sketchfab.com/hasan.ajami2002)");
});

test("a preparação separa a faixa da embalagem sem alterar materiais ou a geometria de origem", () => {
  const originals: { mesh: Mesh; positions: number[]; material: unknown }[] = [];
  gltf.scene.traverse((object) => {
    if (object instanceof Mesh) originals.push({ mesh: object, positions: Array.from(object.geometry.getAttribute("position").array), material: object.material });
  });
  const model = prepareBooster(gltf.scene);
  assert.equal(model.parts.length, 2);
  assert.equal(model.height, 4.2);
  assert.ok(model.width > 2 && model.width < 3);
  assert.ok(model.parts[0].cap.getAttribute("position").count > 0);
  assert.ok(model.parts[0].body.getAttribute("position").count > 0);
  // The second authored mesh is the decorative front detail, entirely below the seam.
  assert.equal(model.parts[1].cap.getAttribute("position").count, 0);
  for (let i = 0; i < model.parts.length; i++) {
    assert.equal(model.parts[i].material, originals[i].material);
    assert.deepEqual(Array.from(originals[i].mesh.geometry.getAttribute("position").array), originals[i].positions);
    for (const geometry of [model.parts[i].body, model.parts[i].cap]) {
      for (const name of ["position", "normal", "uv"]) {
        assert.ok(geometry.getAttribute(name));
        assert.ok(Array.from(geometry.getAttribute(name).array).every(Number.isFinite));
      }
      geometry.dispose();
    }
  }
  const metallic = gltf.parser.json.materials[0].pbrMetallicRoughness;
  assert.equal(metallic.metallicFactor, 0.9);
  assert.equal(metallic.roughnessFactor, 0.187);
});

test("o corte conserva a área e interpola UVs corretamente nos novos vértices", () => {
  const source = new BufferGeometry();
  source.setAttribute("position", new Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 0, 1, 0], 3));
  source.setAttribute("normal", new Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  source.setAttribute("uv", new Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  for (const irregular of [true, false]) {
    const [body, cap] = splitGeometry(source, 0, irregular);
    assert.ok(Math.abs(area(body) + area(cap) - area(source)) < 1e-6);
    for (const geometry of [body, cap]) {
      const position = geometry.getAttribute("position");
      const uv = geometry.getAttribute("uv");
      for (let i = 0; i < position.count; i++) {
        assert.ok(Math.abs(uv.getX(i) - (position.getX(i) + 1) / 2) < 1e-6);
        assert.ok(Math.abs(uv.getY(i) - (position.getY(i) + 1) / 2) < 1e-6);
      }
      geometry.dispose();
    }
  }
  source.dispose();
});

test("a dobra da embalagem fica acima do rótulo sem triângulos atravessando a região protegida", () => {
  const model = prepareBooster(gltf.scene);
  const label = model.parts.find(({ role }) => role === "label")!;
  const wrapper = model.parts.find(({ role }) => role === "wrapper")!;
  assert.equal(label.name, "Object_6");
  assert.ok(model.bendStartY - label.body.boundingBox!.max.y >= 0.059);
  assert.ok(model.bendStartY < model.cutY);
  const position = wrapper.body.getAttribute("position");
  let lower = 0;
  let upper = 0;
  for (let i = 0; i < position.count; i += 3) {
    const heights = [position.getY(i), position.getY(i + 1), position.getY(i + 2)];
    if (Math.min(...heights) < model.bendStartY - 1e-6) {
      assert.ok(Math.max(...heights) <= model.bendStartY + 1e-6,
        "Um triângulo da embalagem levaria a deformação da borda para a área do rótulo.");
      lower++;
    } else upper++;
  }
  assert.ok(lower > 0 && upper > 0);
  for (const part of model.parts) { part.body.dispose(); part.cap.dispose(); }
});

test("o movimento das cartas é escalonado e permanece atrás da embalagem antes de acomodar", () => {
  const motion = { ...createBoosterMotion(), emerge: 0.2 };
  const first = cardPose(0, 5, motion, 100);
  const last = cardPose(4, 5, motion, 100);
  assert.ok(first.y > last.y);
  assert.ok(first.z < -0.3);
  assert.ok(last.z < first.z);
});

test("a posição final 3D coincide com o baralho DOM para 1, 2 e 5 cartas", () => {
  for (const count of [1, 2, 5]) for (const pixelsPerUnit of [70, 100, 120]) {
    const motion = { ...createBoosterMotion(), emerge: 1, settle: 1 };
    for (let i = 0; i < count; i++) {
      const pose = cardPose(i, count, motion, pixelsPerUnit);
      assert.equal(Math.abs(pose.x), 0);
      assert.ok(Math.abs(pose.y * pixelsPerUnit + i * 7) < 1e-8);
      assert.ok(Math.abs(pose.rotationZ * 180 / Math.PI + i * 2) < 1e-8);
      assert.equal(pose.scale, 1 - i * 0.015);
    }
  }
});

test("uma nova sessão restaura todas as partes do movimento sem compartilhar progresso", () => {
  const first = createBoosterMotion();
  first.tear = 1; first.peel = 1; first.drop = 1; first.emerge = 1; first.settle = 1;
  const next = createBoosterMotion();
  assert.notEqual(first, next);
  assert.ok(Object.values(next).every((value) => value === 0));
});

test("o rótulo do modelo inicia orientado para a câmera", () => {
  gltf.scene.updateMatrixWorld(true);
  const label = gltf.scene.getObjectByName("Object_6") as Mesh;
  const normals = label.geometry.getAttribute("normal");
  const matrix = new Matrix3().getNormalMatrix(label.matrixWorld);
  const direction = new Vector3();
  for (let i = 0; i < normals.count; i++) direction.add(new Vector3().fromBufferAttribute(normals, i).applyNormalMatrix(matrix));
  const pose = packPose(createBoosterMotion());
  direction.normalize().applyEuler(new Euler(pose.rotationX, pose.rotationY, pose.rotationZ));
  assert.ok(direction.dot(new Vector3(0, 0, 1)) > 0.99);
});

test("a direção do pacote se opõe à posição horizontal do mouse sem exceder a amplitude", () => {
  const left = packPointerTilt(0, 300, 800, 600);
  const right = packPointerTilt(800, 300, 800, 600);
  const forward = new Vector3(0, 0, 1);
  assert.ok(forward.clone().applyEuler(new Euler(left.x, left.y, 0)).x > 0);
  assert.ok(forward.clone().applyEuler(new Euler(right.x, right.y, 0)).x < 0);
  assert.equal(Math.abs(packPointerTilt(400, 300, 800, 600).y), 0);
  assert.deepEqual(packPointerTilt(-800, 300, 800, 600), left);
  assert.deepEqual(packPointerTilt(1600, 300, 800, 600), right);
});

test("a respiração fica limitada e mantém o rótulo frontal durante o ciclo", () => {
  const motion = createBoosterMotion();
  for (const breath of [0, 0.25, 0.5, 0.75, 1]) {
    const pose = packPose({ ...motion, breath });
    assert.ok(pose.scale >= 1 && pose.scale <= 1.01);
    assert.ok(pose.y >= 0 && pose.y < 0.06);
    assert.equal(Math.abs(pose.rotationX) + Math.abs(pose.rotationY) + Math.abs(pose.rotationZ), 0);
  }
  const neutral = packPose(motion);
  assert.equal(neutral.y, 0);
  assert.equal(neutral.scale, 1);
});

test("o rasgo tem brilho forte e a abertura dá lugar a uma luz residual atrás das cartas", () => {
  const closed = createBoosterMotion();
  assert.equal(packLight(closed).strength, 0);
  let previous = 0;
  for (const tear of [0, 0.1, 0.25, 0.5, 0.75, 1]) {
    const light = packLight({ ...closed, tear });
    assert.ok(light.strength >= previous && light.strength <= 1);
    previous = light.strength;
  }
  const open = { ...closed, tear: 1, peel: 1 };
  assert.ok(packLight(open).strength > 0 && packLight(open).strength < previous);
  assert.equal(packLight(open).seamStrength, 0);
  assert.ok(packLight(open).afterglow > 0);
  assert.equal(packLight({ ...open, emerge: 1, drop: 1 }).afterglow, packLight(open).afterglow);
  assert.equal(packLight({ ...open, settle: 1 }).strength, 0);
  assert.equal(packLight({ ...open, tear: 0 }).strength, 0);
  assert.equal(packLight(createBoosterMotion()).strength, 0);
});

test("movimento reduzido diminui a intensidade e a extensão da luz", () => {
  const open = { ...createBoosterMotion(), tear: 1, peel: 1 };
  const regular = packLight(open);
  const reduced = packLight(open, true);
  assert.ok(reduced.strength > 0 && reduced.strength < regular.strength);
  assert.ok(reduced.height < regular.height);
  assert.equal(reduced.progress, regular.progress);
});
