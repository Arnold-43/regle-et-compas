/**
 * Calculs de vue (purs, sans DOM) : utilisés par game.js, testés dans tests/vue.test.js.
 *
 * Une vue écran est {s, tx, ty} : un point du monde p s'affiche en (p.x·s + tx, p.y·s + ty).
 * Un cadrage est un rectangle du monde [x0, y0, x1, y1].
 */
export const ZOOM_MIN = 0.35; // zoom arrière maximal : 0,35 × l'échelle du cadrage initial
export const MARGE = 8; // marge du canevas, en pixels

/** Vue écran qui fait tenir le cadrage r dans un canevas W × H (comme fitView). */
export function vuePour(r, W, H, pad = MARGE) {
  const s = Math.min((W - pad * 2) / (r[2] - r[0]), (H - pad * 2) / (r[3] - r[1]));
  const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
  return { s, tx: W / 2 - cx * s, ty: H / 2 - cy * s };
}

/**
 * Cadrage qui englobe le cadrage initial et des points (avec une marge), sans dépasser le zoom arrière
 * maximal : si les points sont trop loin, on centre au mieux sur eux et on s'arrête à la taille maximale.
 * @param view    cadrage initial [x0, y0, x1, y1]
 * @param points  [[x, y], …] à montrer
 * @param zoomMin zoom arrière maximal (0,35)
 */
export function cadrageEnglobant(view, points, zoomMin = ZOOM_MIN) {
  let [x0, y0, x1, y1] = view;
  const w0 = x1 - x0, h0 = y1 - y0, m = 0.06 * Math.max(w0, h0);
  for (const p of points) {
    x0 = Math.min(x0, p[0] - m); y0 = Math.min(y0, p[1] - m);
    x1 = Math.max(x1, p[0] + m); y1 = Math.max(y1, p[1] + m);
  }
  // même rapport largeur/hauteur que le cadrage initial (l'écran ne change pas)
  const r = w0 / h0;
  let w = x1 - x0, h = y1 - y0;
  if (w / h > r) { const dh = w / r - h; y0 -= dh / 2; y1 += dh / 2; h = w / r; } else { const dw = h * r - w; x0 -= dw / 2; x1 += dw / 2; w = h * r; }
  const k = Math.min(1, w0 / zoomMin / w);
  if (k < 1) { // trop grand : on réduit autour du centre des points, sans perdre le cadrage initial s'il tient
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    w *= k; h *= k;
    return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
  }
  return [x0, y0, x1, y1];
}

/** Position écran d'un point du monde. */
export const versEcran = (v, p) => [p[0] * v.s + v.tx, p[1] * v.s + v.ty];

/** Le point p est-il visible dans le canevas W × H (à `bord` pixels près du bord) ? */
export function estVisible(v, p, W, H, bord = 6) {
  const [x, y] = versEcran(v, p);
  return x >= bord && x <= W - bord && y >= bord && y <= H - bord;
}

/**
 * Flèche de bord pour un point hors du canevas : position sur le bord (à `retrait` pixels à l'intérieur),
 * du côté du point, et angle (radians) vers lui. null si le point est visible.
 */
export function flecheBord(v, p, W, H, retrait = 14) {
  if (estVisible(v, p, W, H)) return null;
  const [x, y] = versEcran(v, p), cx = W / 2, cy = H / 2;
  const dx = x - cx, dy = y - cy;
  const k = Math.min((W / 2 - retrait) / Math.abs(dx || 1e-9), (H / 2 - retrait) / Math.abs(dy || 1e-9));
  return { x: cx + dx * k, y: cy + dy * k, angle: Math.atan2(dy, dx) };
}

/** Interpolation entre deux vues (t de 0 à 1), pour un recadrage en douceur. */
export function interpole(a, b, t) {
  const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return { s: a.s + (b.s - a.s) * e, tx: a.tx + (b.tx - a.tx) * e, ty: a.ty + (b.ty - a.ty) * e };
}
