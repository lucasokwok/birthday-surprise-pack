import { ExtrudeGeometry, Shape, ShapeGeometry } from "three";
import { CARD_LAYOUT } from "../data/cardLayout.ts";

export function createCardGeometry() {
  const { width, ratio, depth, cornerRatio } = CARD_LAYOUT;
  const height = width * ratio;
  const x = width / 2;
  const y = height / 2;
  const radius = width * cornerRatio;
  const shape = new Shape();
  shape.moveTo(-x + radius, -y);
  shape.lineTo(x - radius, -y);
  shape.absarc(x - radius, -y + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(x, y - radius);
  shape.absarc(x - radius, y - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(-x + radius, y);
  shape.absarc(-x + radius, y - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(-x, -y + radius);
  shape.absarc(-x + radius, -y + radius, radius, Math.PI, Math.PI * 1.5, false);
  shape.closePath();

  const body = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1, curveSegments: 8 });
  body.translate(0, 0, -depth / 2);
  const face = new ShapeGeometry(shape, 8);
  const position = face.getAttribute("position");
  const uv = face.getAttribute("uv");
  // ShapeGeometry usa coordenadas locais como UVs; preservar o verso completo entre 0 e 1.
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) + x) / width, (position.getY(i) + y) / height);
  }
  return { body, face };
}
