/**
 * Occupation de l'écran par la figure de départ, au cadrage initial, sur un téléphone de référence
 * (canevas de 356 × 592 px, celui d'un écran de 390 × 844) : la vue est ajustée au canevas comme dans
 * game.js (fitView), puis occupation = max(largeur figure / largeur canevas, hauteur figure / hauteur canevas).
 * La figure = points visibles et cercles donnés en entier. Cible : au moins 60 %.
 */
export const CANEVAS = [356, 592];
import { dist } from '../src/engine.js';

export function boiteFigure(lv) {
  const P = [];
  for (const id of Object.keys(lv.pts)) if (!(lv.hidden || []).includes(id)) P.push(lv.pts[id]);
  for (const g of lv.given) if (g.t === 'circle') {
    const C = lv.pts[g.a], r = dist(C, lv.pts[g.b]);
    P.push([C[0] - r, C[1] - r], [C[0] + r, C[1] + r]);
  }
  return [Math.min(...P.map((p) => p[0])), Math.min(...P.map((p) => p[1])), Math.max(...P.map((p) => p[0])), Math.max(...P.map((p) => p[1]))];
}
export function occupation(lv, view = lv.view) {
  const f = boiteFigure(lv), [W, H] = CANEVAS, pad = 8;
  const s = Math.min((W - 2 * pad) / (view[2] - view[0]), (H - 2 * pad) / (view[3] - view[1]));
  return Math.max(((f[2] - f[0]) * s) / W, ((f[3] - f[1]) * s) / H);
}
export const mediane = (xs) => { const s = xs.slice().sort((a, b) => a - b); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
