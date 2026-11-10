import {
  Box3, BufferGeometry, Float32BufferAttribute,
  Matrix4, Mesh, Vector3, type Material, type Object3D,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type Vertex = Record<string, number[]>;

/** The same continuous seam is used by both halves; UVs and normals are interpolated. */
export function seamHeight(x: number, cutY: number) {
  return cutY + Math.sin(x * 47) * 0.012 + Math.sin(x * 103) * 0.007;
}

export function splitGeometry(source: BufferGeometry, cutY: number, irregular = true) {
  const names = Object.keys(source.attributes);
  const output: Record<string, number[]>[] = [{}, {}];
  for (const data of output) for (const name of names) data[name] = [];
  const count = source.index?.count ?? source.getAttribute("position").count;
  const read = (index: number): Vertex => Object.fromEntries(names.map((name) => {
    const attribute = source.getAttribute(name);
    return [name, Array.from({ length: attribute.itemSize }, (_, component) => attribute.getComponent(index, component))];
  }));
  const distance = (vertex: Vertex) => vertex.position[1]
    - (irregular ? seamHeight(vertex.position[0], cutY) : cutY);
  const intersection = (a: Vertex, b: Vertex): Vertex => {
    const factor = distance(a) / (distance(a) - distance(b));
    return Object.fromEntries(names.map((name) => [name,
      a[name].map((value, i) => value + (b[name][i] - value) * factor),
    ]));
  };

  for (let i = 0; i < count; i += 3) {
    const triangle = [0, 1, 2].map((offset) => read(source.index ? source.index.getX(i + offset) : i + offset));
    for (let half = 0; half < 2; half++) {
      const polygon: Vertex[] = [];
      for (let edge = 0; edge < 3; edge++) {
        const a = triangle[edge];
        const b = triangle[(edge + 1) % 3];
        const insideA = half === 0 ? distance(a) <= 0 : distance(a) >= 0;
        const insideB = half === 0 ? distance(b) <= 0 : distance(b) >= 0;
        if (insideA) polygon.push(a);
        if (insideA !== insideB) polygon.push(intersection(a, b));
      }
      for (let vertex = 1; vertex < polygon.length - 1; vertex++) {
        for (const point of [polygon[0], polygon[vertex], polygon[vertex + 1]]) {
          for (const name of names) output[half][name].push(...point[name]);
        }
      }
    }
  }

  return output.map((attributes) => {
    const geometry = new BufferGeometry();
    for (const name of names) {
      geometry.setAttribute(name, new Float32BufferAttribute(attributes[name], source.getAttribute(name).itemSize));
    }
    geometry.normalizeNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }) as [BufferGeometry, BufferGeometry];
}

export interface BoosterPart {
  name: string;
  role: "wrapper" | "label";
  body: BufferGeometry;
  cap: BufferGeometry;
  material: Material;
}

/** Bake node transforms, keeping authored materials and every geometry attribute. */
export function prepareBooster(scene: Object3D) {
  scene.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(scene);
  const center = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  const scale = 4.2 / size.y;
  const normalization = new Matrix4().makeScale(scale, scale, scale)
    .multiply(new Matrix4().makeTranslation(-center.x, -center.y, -center.z));
  const cutY = 1.68;
  const meshes: { name: string; role: BoosterPart["role"]; geometry: BufferGeometry; material: Material }[] = [];
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    // This GLB has one material per mesh. Do not silently flatten a future multi-material asset.
    if (Array.isArray(object.material)) throw new Error("Modelo com múltiplos materiais por malha não suportado.");
    const geometry = object.geometry.clone().applyMatrix4(new Matrix4().multiplyMatrices(normalization, object.matrixWorld));
    geometry.computeBoundingBox();
    // Authored label in booster_pack_tcg_pack.glb; it must move with the body, never bend independently.
    meshes.push({ name: object.name, role: object.name === "Object_6" ? "label" : "wrapper", geometry, material: object.material });
  });
  if (!meshes.length) throw new Error("O modelo não contém malhas renderizáveis.");
  const labelTop = Math.max(...meshes.filter(({ role }) => role === "label").map(({ geometry }) => geometry.boundingBox!.max.y));
  const bendStartY = Math.max(cutY - 0.24, labelTop + 0.06);
  if (bendStartY >= cutY) {
    for (const { geometry } of meshes) geometry.dispose();
    throw new Error("O rótulo sobrepõe a região de abertura do modelo.");
  }
  const parts: BoosterPart[] = meshes.map(({ name, role, geometry, material }) => {
    let [body, cap] = splitGeometry(geometry, cutY);
    geometry.dispose();
    if (role === "wrapper") {
      // Insert a straight vertex boundary before bending. Without it, the coarse foil
      // triangles interpolate the rim's displacement across the densely tessellated label.
      const sections = splitGeometry(body, bendStartY, false);
      const segmented = mergeGeometries(sections)!;
      body.dispose();
      for (const section of sections) section.dispose();
      segmented.computeBoundingBox();
      segmented.computeBoundingSphere();
      body = segmented;
    }
    return { name, role, body, cap, material };
  });
  return { parts, cutY, bendStartY, width: size.x * scale, height: 4.2 };
}
