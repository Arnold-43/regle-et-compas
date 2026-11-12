/**
 * Faits géométriques des idées et des explications (src/explications.js). Pur : sans DOM.
 *
 * Une explication nomme des points à partir de sa solution de référence épinglée (format des refs du
 * moteur : 'A' pour un point donné, {x: [i, j], k} ou {x: [i, j], pick} pour une intersection), puis
 * déclare des faits. Les droites se désignent par l'index de l'étape (0 = premier tracé), par l'id d'un
 * objet donné ('l', 's', 'la'…), ou par deux points ['A', 'B'].
 *
 * Faits :
 *   {egal: [['A','B'], ['A','C'], …]}   ces segments ont la même longueur
 *   {angle: ['A','O','B', 60]}           l'angle AOB vaut 60° (entre 0 et 180°)
 *   {droit: ['A','O','B']}               l'angle AOB est droit
 *   {alignes: ['A','B','C', …]}          ces points sont sur une même droite
 *   {milieu: ['M','A','B']}              M est le milieu de [AB]
 *   {surCercle: ['P','O','R']}           P est sur le cercle de centre O passant par R
 *   {surLigne: ['P', ligne]}             P est sur cette droite
 *   {anglesEgaux: [['A','O','B'], ['C','P','D']]}   ces angles sont égaux
 *   {angleLignes: [ligne, ligne, 30]}    ces deux droites font un angle de 30° (entre 0 et 90°)
 *   {parallele: [ligne, ligne]}          ces deux droites sont parallèles
 */
import { evalRef, resoudrePoint, geomOf, dist, sub, dot, cross, unit } from './engine.js';

/** Points nommés et droites d'une explication pour les points de départ G (null si la solution ne se rejoue pas). */
export function figureExplication(level, G, ex) {
  const etapes = evalRef(level, G, ex.ref);
  if (!etapes) return null;
  const stepG = etapes.map((e) => e.g);
  const P = { ...G };
  for (const [nom, r] of Object.entries(ex.pts || {})) {
    const p = resoudrePoint(level, G, stepG, r);
    if (!p) return null;
    P[nom] = p;
  }
  const ligne = (l) => {
    if (typeof l === 'number') return stepG[l];
    if (Array.isArray(l)) return geomOf('line', P[l[0]], P[l[1]]);
    const go = level.given.find((g) => g.id === l);
    return go ? geomOf('line', G[go.a], G[go.b]) : null;
  };
  return { P, stepG, ligne };
}

const angleDeg = (A, O, B) => {
  const u = unit(sub(A, O)), v = unit(sub(B, O));
  return (Math.acos(Math.max(-1, Math.min(1, dot(u, v)))) * 180) / Math.PI;
};

/**
 * Le fait f est-il vrai dans la figure fig ? `echelle` sert de tolérance relative (taille de la figure).
 * Renvoie {ok, detail}.
 */
export function verifieFait(f, fig, echelle = 100) {
  const tol = 1e-6 * echelle, tolA = 1e-6;
  const { P, ligne } = fig;
  const pt = (n) => { if (!P[n]) throw new Error(`point inconnu : ${n}`); return P[n]; };
  const [type] = Object.keys(f), v = f[type];
  switch (type) {
    case 'egal': {
      const ls = v.map(([a, b]) => dist(pt(a), pt(b)));
      return { ok: ls.every((l) => Math.abs(l - ls[0]) < tol), detail: ls.map((l) => l.toFixed(3)).join(' = ') };
    }
    case 'angle': {
      const a = angleDeg(pt(v[0]), pt(v[1]), pt(v[2]));
      return { ok: Math.abs(a - v[3]) < 1e-6 * 180, detail: `${a.toFixed(4)}°` };
    }
    case 'droit': {
      const a = angleDeg(pt(v[0]), pt(v[1]), pt(v[2]));
      return { ok: Math.abs(a - 90) < 1e-6 * 180, detail: `${a.toFixed(4)}°` };
    }
    case 'alignes': {
      const [A, B] = [pt(v[0]), pt(v[1])], u = unit(sub(B, A));
      const ecarts = v.slice(2).map((n) => Math.abs(cross(u, sub(pt(n), A))));
      return { ok: ecarts.every((e) => e < tol), detail: ecarts.map((e) => e.toExponential(1)).join(', ') };
    }
    case 'milieu': {
      const [M, A, B] = v.map(pt);
      const e = dist(M, [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]);
      return { ok: e < tol, detail: e.toExponential(1) };
    }
    case 'surCercle': {
      const [Q, O, R] = v.map(pt);
      const e = Math.abs(dist(O, Q) - dist(O, R));
      return { ok: e < tol, detail: e.toExponential(1) };
    }
    case 'surLigne': {
      const g = ligne(v[1]), Q = pt(v[0]);
      const e = Math.abs(cross(g.d, sub(Q, g.o)));
      return { ok: e < tol, detail: e.toExponential(1) };
    }
    case 'anglesEgaux': {
      const as = v.map(([a, o, b]) => angleDeg(pt(a), pt(o), pt(b)));
      return { ok: as.every((x) => Math.abs(x - as[0]) < 1e-6 * 180), detail: as.map((x) => `${x.toFixed(4)}°`).join(' = ') };
    }
    case 'angleLignes': {
      const g = ligne(v[0]), h = ligne(v[1]);
      let a = (Math.acos(Math.min(1, Math.abs(dot(g.d, h.d)))) * 180) / Math.PI;
      return { ok: Math.abs(a - v[2]) < 1e-6 * 180, detail: `${a.toFixed(4)}°` };
    }
    case 'parallele': {
      const g = ligne(v[0]), h = ligne(v[1]);
      const e = Math.abs(cross(g.d, h.d));
      return { ok: e < tolA, detail: e.toExponential(1) };
    }
    default: throw new Error(`fait inconnu : ${type}`);
  }
}

/** Phrase lisible d'un fait (pour docs/idees.md et les messages de test). */
export function lireFait(f) {
  const [type] = Object.keys(f), v = f[type];
  const seg = ([a, b]) => `${a}${b}`;
  const lig = (l) => (typeof l === 'number' ? `tracé ${l + 1}` : Array.isArray(l) ? `(${l.join('')})` : `droite ${l}`);
  switch (type) {
    case 'egal': return v.map(seg).join(' = ');
    case 'angle': return `angle ${v[0]}${v[1]}${v[2]} = ${v[3]}°`;
    case 'droit': return `angle ${v[0]}${v[1]}${v[2]} droit`;
    case 'alignes': return `${v.join(', ')} alignés`;
    case 'milieu': return `${v[0]} milieu de [${v[1]}${v[2]}]`;
    case 'surCercle': return `${v[0]} sur le cercle de centre ${v[1]} passant par ${v[2]}`;
    case 'surLigne': return `${v[0]} sur ${lig(v[1])}`;
    case 'anglesEgaux': return v.map(([a, o, b]) => `angle ${a}${o}${b}`).join(' = ');
    case 'angleLignes': return `${lig(v[0])} et ${lig(v[1])} font ${v[2]}°`;
    case 'parallele': return `${lig(v[0])} parallèle à ${lig(v[1])}`;
    default: return JSON.stringify(f);
  }
}
