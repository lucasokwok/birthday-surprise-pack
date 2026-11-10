import test from "node:test";
import assert from "node:assert/strict";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { CARD_LAYOUT } from "../src/data/cardLayout.ts";
import { createCardGeometry } from "../src/three/cardGeometry.ts";

test("corpo e verso 3D têm o mesmo contorno arredondado e mantêm as dimensões da carta", () => {
  const geometries = createCardGeometry();
  const material = new MeshBasicMaterial();
  const { width, ratio, depth } = CARD_LAYOUT;
  for (const geometry of [geometries.body, geometries.face]) {
    geometry.computeBoundingBox();
    const size = geometry.boundingBox!.getSize(new Vector3());
    assert.ok(Math.abs(size.x - width) < 1e-6);
    assert.ok(Math.abs(size.y - width * ratio) < 1e-6);
    assert.ok(Math.abs(size.z - (geometry === geometries.body ? depth : 0)) < 1e-6);
    const mesh = new Mesh(geometry, material);
    mesh.updateMatrixWorld(true);
    const ray = new Raycaster(new Vector3(0, 0, 1), new Vector3(0, 0, -1));
    assert.ok(ray.intersectObject(mesh).length > 0);
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      ray.ray.origin.set(x * (width / 2 - 0.001), y * (width * ratio / 2 - 0.001), 1);
      assert.equal(ray.intersectObject(mesh).length, 0, "O canto extremo retangular deve estar fora da geometria.");
    }
    geometry.dispose();
  }
  material.dispose();
});

test("o mapeamento do verso cobre a textura completa sem esticá-la sobre os cantos", () => {
  const { body, face } = createCardGeometry();
  const position = face.getAttribute("position");
  const uv = face.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) {
    assert.ok(uv.getX(i) >= -1e-6 && uv.getX(i) <= 1 + 1e-6);
    assert.ok(uv.getY(i) >= -1e-6 && uv.getY(i) <= 1 + 1e-6);
    assert.ok(Math.abs((uv.getX(i) - 0.5) * CARD_LAYOUT.width - position.getX(i)) < 1e-6);
    assert.ok(Math.abs((uv.getY(i) - 0.5) * CARD_LAYOUT.width * CARD_LAYOUT.ratio - position.getY(i)) < 1e-6);
  }
  body.dispose(); face.dispose();
});
