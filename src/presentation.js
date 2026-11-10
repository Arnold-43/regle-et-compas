/**
 * Présentation des figures du catalogue : titre, consigne, objectif en pointillés (ghost) et
 * célébration façon Oliver Byrne (celebrate). Pur : renvoie des descriptions de formes que game.js dessine.
 *
 * Formes : {line: géom, stroke}, {seg: [P, Q], stroke}, {poly: [...], fill}, {wedge: [O, u, w], fill, r},
 *          {right: [P, u, w]}, {dot: P, fill}, {ticks: [P, u]}, {label: [P, texte], dir, off}.
 * Dans le ghost, {dot: P} est un point cible (cercle pointillé).
 */
import { add, sub, mul, dot, unit, perp, cross, dist } from './engine.js';
import { centreCirconscrit, centreInscrit } from './catalog.js';

const seg = (fig, a, b) => fig.given.some((g) => g.t === 'seg' && ((g.a === a && g.b === b) || (g.a === b && g.b === a)));
const droite = (fig, d) => (seg(fig, d[0], d[1]) ? `le segment [${d[0]}${d[1]}]` : `la droite (${d[0]}${d[1]})`);
const aDroite = (fig, d) => (seg(fig, d[0], d[1]) ? `au segment [${d[0]}${d[1]}]` : `à la droite (${d[0]}${d[1]})`);
const deSeg = (fig, s) => (seg(fig, s[0], s[1]) ? `du segment [${s[0]}${s[1]}]` : `de [${s[0]}${s[1]}]`);
const paire = (fig, s) => (seg(fig, s[0], s[1]) ? `le segment [${s[0]}${s[1]}]` : `[${s[0]}${s[1]}]`);
const tri = (t) => t.join('');

/** Pied de la perpendiculaire à (AB) depuis P. */
const pied = (P, A, B) => { const u = unit(sub(B, A)); return add(A, mul(u, dot(sub(P, A), u))); };
/** Demi-droite portée par g qui fait un angle aigu avec u. */
const rayon = (g, u) => (dot(g.d, u) > 0 ? g.d : mul(g.d, -1));
/** Marque d'angle droit en F entre la droite de direction u et la perpendiculaire, côté du point Q. */
const angleDroit = (F, u, Q) => {
  let w = perp(u);
  if (Q && dot(sub(Q, F), w) < 0) w = mul(w, -1);
  return { right: [F, u, w] };
};

const P = {
  'triangle-equilateral': {
    titre: () => 'Triangle équilatéral',
    consigne: (b, fig) => `Construis un triangle équilatéral sur ${paire(fig, b.s)}.`,
    sommets: (G, b, alt, alts) => [G[b.s[0]], G[b.s[1]], interLL(alts[alt][0], alts[alt][1])],
    celebrer: (G, b, alt, alts) => {
      const [A, B] = [G[b.s[0]], G[b.s[1]]];
      const apex = interLL(alts[alt][0], alts[alt][1]);
      return [{ poly: [A, B, apex], fill: 'yellow' }, { seg: [A, apex], stroke: 'red' }, { seg: [B, apex], stroke: 'blue' }, { seg: [A, B], stroke: 'ink' }];
    },
  },
  'perpendiculaire-en-un-point': {
    titre: () => 'Perpendiculaire en un point',
    consigne: (b, fig) => `Trace la perpendiculaire ${aDroite(fig, b.d)} qui passe par ${b.P}.`,
    celebrer: (G, b, alt, alts) => {
      const g = alts[0][0], u = unit(sub(G[b.d[1]], G[b.d[0]]));
      return [{ line: g, stroke: 'blue' }, angleDroit(G[b.P], u, add(G[b.P], g.d))];
    },
  },
  'perpendiculaire-depuis-un-point': {
    titre: () => 'Perpendiculaire depuis un point',
    consigne: (b, fig) => `Abaisse la perpendiculaire ${aDroite(fig, b.d)} depuis ${b.P}.`,
    celebrer: (G, b, alt, alts) => {
      const g = alts[0][0], F = pied(G[b.P], G[b.d[0]], G[b.d[1]]), u = unit(sub(G[b.d[1]], G[b.d[0]]));
      return [{ line: g, stroke: 'blue' }, { seg: [G[b.P], F], stroke: 'red' }, angleDroit(F, u, G[b.P])];
    },
  },
  parallele: {
    titre: () => 'Parallèle',
    consigne: (b, fig) => `Trace la parallèle ${aDroite(fig, b.d)} qui passe par ${b.P}.`,
    celebrer: (G, b, alt, alts) => {
      const u = unit(sub(G[b.d[1]], G[b.d[0]]));
      return [{ line: alts[0][0], stroke: 'blue' }, { ticks: [G[b.P], u] }, { ticks: [mul(add(G[b.d[0]], G[b.d[1]]), 0.5), u] }];
    },
  },
  mediatrice: {
    titre: () => 'Médiatrice',
    consigne: (b, fig) => `Trace la médiatrice ${deSeg(fig, b.s)} : la droite qui le coupe en son milieu, à angle droit.`,
    celebrer: (G, b, alt, alts) => {
      const [A, B] = [G[b.s[0]], G[b.s[1]]], M = mul(add(A, B), 0.5), u = unit(sub(B, A));
      return [{ line: alts[0][0], stroke: 'blue' }, { seg: [A, M], stroke: 'red' }, { seg: [M, B], stroke: 'red' }, { right: [M, u, perp(u)] }, { dot: M, fill: 'red' }];
    },
  },
  milieu: {
    titre: () => 'Milieu',
    consigne: (b, fig) => `Construis le milieu ${deSeg(fig, b.s)}.`,
    celebrer: (G, b) => {
      const [A, B] = [G[b.s[0]], G[b.s[1]]], M = mul(add(A, B), 0.5);
      return [{ seg: [A, M], stroke: 'red' }, { seg: [M, B], stroke: 'blue' }, { dot: M, fill: 'yellow' }];
    },
  },
  bissectrice: {
    titre: () => 'Bissectrice',
    consigne: (b) => `Partage l'angle ${b.a.A}${b.a.O}${b.a.B} en deux angles égaux.`,
    celebrer: (G, b, alt, alts) => {
      const O = G[b.a.O], ua = unit(sub(G[b.a.A], O)), ub = unit(sub(G[b.a.B], O)), w = add(ua, ub);
      return [{ wedge: [O, ua, w], fill: 'red', r: 60 }, { wedge: [O, w, ub], fill: 'blue', r: 60 }, { line: alts[0][0], stroke: 'blue' }];
    },
  },
  tangente: {
    titre: () => 'Tangente depuis un point',
    consigne: (b) => `Trace une tangente au cercle qui passe par ${b.P}.`,
    celebrer: (G, b, alt, alts) => tangentes(G, b, [alts[alt][0]]),
  },
  'deux-tangentes': {
    titre: () => 'Les deux tangentes',
    consigne: (b) => `Trace les deux tangentes au cercle qui passent par ${b.P}.`,
    celebrer: (G, b, alt, alts) => tangentes(G, b, alts[0]),
  },
  'tangente-en-un-point': {
    titre: () => 'Tangente en un point',
    consigne: (b) => `Trace la tangente au cercle au point ${b.c.R}.`,
    celebrer: (G, b, alt, alts) => {
      const O = G[b.c.O], R = G[b.c.R];
      return [{ line: alts[0][0], stroke: 'blue' }, { seg: [O, R], stroke: 'red' }, angleDroit(R, alts[0][0].d, O), { dot: O, fill: 'red' }];
    },
  },
  centre: {
    titre: () => 'Centre du cercle',
    consigne: () => 'Le centre du cercle est effacé. Retrouve-le.',
    celebrer: (G, b) => [{ seg: [G[b.c.O], G[b.c.R]], stroke: 'red' }, { dot: G[b.c.O], fill: 'red' }],
  },
  'centre-circonscrit': {
    titre: () => 'Centre du cercle circonscrit',
    consigne: (b) => `Construis le point à égale distance de ${b.t[0]}, ${b.t[1]} et ${b.t[2]}.`,
    celebrer: (G, b) => {
      const [A, B, C] = b.t.map((k) => G[k]), O = centreCirconscrit(A, B, C);
      return [{ line: { k: 'circle', c: O, r: dist(O, A) }, stroke: 'blue' }, { seg: [O, A], stroke: 'red' }, { seg: [O, B], stroke: 'red' }, { seg: [O, C], stroke: 'red' }, { dot: O, fill: 'yellow' }];
    },
  },
  'cercle-circonscrit': {
    titre: () => 'Cercle circonscrit',
    consigne: (b) => `Trace le cercle qui passe par ${b.t[0]}, ${b.t[1]} et ${b.t[2]}.`,
    celebrer: (G, b, alt, alts) => {
      const [A, B, C] = b.t.map((k) => G[k]);
      return [{ poly: [A, B, C], fill: 'yellow' }, { line: alts[0][0], stroke: 'blue' }, { dot: alts[0][0].c, fill: 'red' }];
    },
  },
  'centre-inscrit': {
    titre: () => 'Centre du cercle inscrit',
    consigne: (b) => `Construis le point à égale distance des trois côtés du triangle ${tri(b.t)}.`,
    celebrer: (G, b) => {
      const [A, B, C] = b.t.map((k) => G[k]), I = centreInscrit(A, B, C);
      const r = Math.abs(cross(unit(sub(B, A)), sub(I, A)));
      return [{ poly: [A, B, C], fill: 'yellow' }, { line: { k: 'circle', c: I, r }, stroke: 'blue' }, { dot: I, fill: 'red' }];
    },
  },
  'cercle-inscrit': {
    titre: () => 'Cercle inscrit',
    consigne: (b) => `Trace le cercle qui touche les trois côtés du triangle ${tri(b.t)}.`,
    celebrer: (G, b, alt, alts) => [{ line: alts[0][0], stroke: 'blue' }, { dot: alts[0][0].c, fill: 'red' }],
  },
  carre: {
    titre: () => 'Carré',
    consigne: (b) => `Construis les deux autres sommets d'un carré de côté [${b.s[0]}${b.s[1]}].`,
    sommets: (G, b, alt, alts) => [G[b.s[0]], G[b.s[1]], alts[alt][0].p, alts[alt][1].p],
    celebrer: (G, b, alt, alts) => polygone([G[b.s[0]], G[b.s[1]], alts[alt][0].p, alts[alt][1].p]),
  },
  hexagone: {
    titre: () => 'Hexagone régulier',
    consigne: (b) => `Place les cinq autres sommets de l'hexagone régulier inscrit dans le cercle, en partant de ${b.c.R}.`,
    sommets: (G, b, alt, alts) => [G[b.c.R], ...alts[0].map((e) => e.p)],
    celebrer: (G, b, alt, alts) => polygone([G[b.c.R], ...alts[0].map((e) => e.p)]),
  },
  'triangle-inscrit': {
    titre: () => 'Triangle inscrit',
    consigne: (b) => `Place les deux autres sommets du triangle équilatéral inscrit dans le cercle, en partant de ${b.c.R}.`,
    sommets: (G, b, alt, alts) => [G[b.c.R], ...alts[0].map((e) => e.p)],
    celebrer: (G, b, alt, alts) => polygone([G[b.c.R], ...alts[0].map((e) => e.p)]),
  },
  'carre-inscrit': {
    titre: () => 'Carré inscrit',
    consigne: (b) => `Place les trois autres sommets du carré inscrit dans le cercle, en partant de ${b.c.R}.`,
    sommets: (G, b, alt, alts) => [G[b.c.R], ...alts[0].map((e) => e.p)],
    celebrer: (G, b, alt, alts) => polygone([G[b.c.R], ...alts[0].map((e) => e.p)]),
  },
  'partage-en-3': {
    titre: () => 'Partage en trois',
    consigne: (b, fig) => `Partage ${paire(fig, b.s)} en trois parts égales.`,
    celebrer: (G, b, alt, alts) => parts(G[b.s[0]], G[b.s[1]], alts[0].map((e) => e.p)),
  },
  'partage-en-4': {
    titre: () => 'Partage en quatre',
    consigne: (b, fig) => `Partage ${paire(fig, b.s)} en quatre parts égales.`,
    celebrer: (G, b, alt, alts) => parts(G[b.s[0]], G[b.s[1]], alts[0].map((e) => e.p)),
  },
  parallelogramme: {
    titre: () => 'Parallélogramme',
    consigne: (b) => `Place le point D pour que ${b.t.join('')}D soit un parallélogramme.`,
    sommets: (G, b, alt, alts) => [...b.t.map((k) => G[k]), alts[0][0].p],
    celebrer: (G, b, alt, alts) => polygone([...b.t.map((k) => G[k]), alts[0][0].p]),
  },
  'milieu-arc': {
    titre: () => "Milieu d'un arc",
    consigne: (b) => `Place le milieu du petit arc ${b.c.R}${b.S} du cercle.`,
    celebrer: (G, b, alt, alts) => {
      const O = G[b.c.O], M = alts[0][0].p;
      return [{ seg: [O, G[b.c.R]], stroke: 'red' }, { seg: [O, G[b.S]], stroke: 'blue' }, { seg: [O, M], stroke: 'ink' }, { dot: M, fill: 'yellow' }];
    },
  },
  symetrique: {
    titre: () => 'Symétrique',
    consigne: (b, fig) => `Construis le symétrique de ${b.P} par rapport ${aDroite(fig, b.d)}.`,
    celebrer: (G, b, alt, alts) => {
      const P = G[b.P], Q = alts[0][0].p, F = mul(add(P, Q), 0.5), u = unit(sub(G[b.d[1]], G[b.d[0]]));
      return [{ seg: [P, F], stroke: 'red' }, { seg: [F, Q], stroke: 'blue' }, angleDroit(F, u, P), { dot: Q, fill: 'yellow' }];
    },
  },
  'centre-gravite': {
    titre: () => 'Centre de gravité',
    consigne: (b) => `Construis le point où se coupent les trois médianes du triangle ${tri(b.t)}.`,
    celebrer: (G, b, alt, alts) => {
      const [A, B, C] = b.t.map((k) => G[k]), g = alts[0][0].p, m = (P, Q) => mul(add(P, Q), 0.5);
      return [{ poly: [A, B, C], fill: 'yellow' }, { seg: [A, m(B, C)], stroke: 'red' }, { seg: [B, m(C, A)], stroke: 'blue' }, { seg: [C, m(A, B)], stroke: 'red' }, { dot: g, fill: 'ink' }];
    },
  },
  orthocentre: {
    titre: () => 'Orthocentre',
    consigne: (b) => `Construis le point où se coupent les trois hauteurs du triangle ${tri(b.t)}.`,
    celebrer: (G, b, alt, alts) => {
      const [A, B, C] = b.t.map((k) => G[k]), H = alts[0][0].p;
      const h = (P, Q, R) => { const F = pied(P, Q, R); return [{ seg: [P, F], stroke: 'blue' }, angleDroit(F, unit(sub(R, Q)), P)]; };
      return [{ poly: [A, B, C], fill: 'yellow' }, ...h(A, B, C), ...h(B, C, A), ...h(C, A, B), { dot: H, fill: 'red' }];
    },
  },
  rectangle: {
    titre: () => 'Rectangle',
    consigne: (b) => `Construis les deux autres sommets du rectangle de côté [${b.d[0]}${b.d[1]}] dont le côté opposé passe par ${b.P}.`,
    sommets: (G, b, alt, alts) => [G[b.d[0]], G[b.d[1]], alts[0][0].p, alts[0][1].p],
    celebrer: (G, b, alt, alts) => polygone([G[b.d[0]], G[b.d[1]], alts[0][0].p, alts[0][1].p]),
  },
  losange: {
    titre: () => 'Losange',
    consigne: (b) => `Construis le losange de côté [${b.a.O}${b.a.A}] dont un autre côté part de ${b.a.O} vers ${b.a.B}.`,
    sommets: (G, b, alt, alts) => [G[b.a.O], G[b.a.A], alts[0][1].p, alts[0][0].p],
    celebrer: (G, b, alt, alts) => polygone([G[b.a.O], G[b.a.A], alts[0][1].p, alts[0][0].p]),
  },
  report: {
    titre: () => 'Report de longueur',
    consigne: (b) => `Place le point C sur la droite (${b.s[0]}${b.s[1]}), au-delà de ${b.s[1]}, tel que ${b.s[1]}C = ${b.s[0]}${b.s[1]}.`,
    celebrer: (G, b, alt, alts) => [{ seg: [G[b.s[0]], G[b.s[1]]], stroke: 'red' }, { seg: [G[b.s[1]], alts[0][0].p], stroke: 'blue' }, { dot: alts[0][0].p, fill: 'yellow' }],
  },
};
for (const deg of [60, 30, 45, 15, 75]) {
  P[`angle-${deg}`] = {
    titre: () => `Angle de ${deg}°`,
    consigne: (b, fig) => `Trace une droite qui passe par ${b.P} et fait un angle de ${deg}° avec ${droite(fig, b.d)}.`,
    celebrer: (G, b, alt, alts) => {
      const g = alts[alt][0], A = G[b.P];
      let u = unit(sub(G[b.d[1]], G[b.d[0]]));
      const w0 = rayon(g, u);
      if (dot(w0, u) < 0) u = mul(u, -1);
      const w = rayon(g, u);
      return [
        { wedge: [A, u, w], fill: 'yellow', r: 78 }, { line: g, stroke: 'blue' },
        { label: [A, `${deg}°`], dir: unit(add(u, w)), off: 96 },
      ];
    },
  };
}

function interLL(g, h) {
  const den = cross(g.d, h.d);
  const t = cross(sub(h.o, g.o), h.d) / den;
  return add(g.o, mul(g.d, t));
}
function tangentes(G, b, lignes) {
  const O = G[b.c.O], Pp = G[b.P], out = [];
  for (const g of lignes) {
    const T = pied(O, g.o, add(g.o, g.d));
    out.push({ line: g, stroke: 'blue' }, { seg: [O, T], stroke: 'red' }, angleDroit(T, g.d, O));
  }
  out.push({ dot: O, fill: 'red' }, { dot: Pp, fill: 'yellow' });
  return out;
}
/** Sommets d'un polygone convexe, rangés autour de leur centre de gravité. */
function ordonne(sommets) {
  const c = mul(sommets.reduce(add, [0, 0]), 1 / sommets.length);
  return sommets.slice().sort((p, q) => Math.atan2(p[1] - c[1], p[0] - c[0]) - Math.atan2(q[1] - c[1], q[0] - c[0]));
}
function polygone(sommets) {
  const s = ordonne(sommets);
  const out = [{ poly: s, fill: 'yellow' }];
  s.forEach((p, i) => out.push({ seg: [p, s[(i + 1) % s.length]], stroke: i % 2 ? 'blue' : 'red' }));
  for (const p of sommets) out.push({ dot: p, fill: 'ink' });
  return out;
}
function parts(A, B, pts) {
  const s = [A, ...pts.slice().sort((p, q) => dist(A, p) - dist(A, q)), B], out = [];
  for (let i = 0; i + 1 < s.length; i++) out.push({ seg: [s[i], s[i + 1]], stroke: i % 2 ? 'blue' : 'red' });
  for (const p of pts) out.push({ dot: p, fill: 'yellow' });
  return out;
}

/** Présentation d'une entrée du catalogue (erreur si elle manque : chaque entrée doit en avoir une). */
export function presentation(id) {
  const p = P[id];
  if (!p) throw new Error(`présentation manquante pour ${id}`);
  return p;
}

/** Objectif en pointillés : la variante choisie (droites et cercles en trait, points en cercles). */
export function ghostDe(alts, alt = 0, pr = null, G = null, b = null) {
  // Polygone : les côtés en segments (comme au niveau I.1), et les sommets à construire en cercles pointillés.
  if (pr && pr.sommets) {
    const sommets = ordonne(pr.sommets(G, b, alt, alts));
    const out = sommets.map((p, i) => ({ seg: [p, sommets[(i + 1) % sommets.length]] }));
    for (const el of alts[alt]) if (el.k === 'point') out.push({ dot: el.p });
    return out;
  }
  return alts[alt].map((el) => (el.k === 'point' ? { dot: el.p } : { line: el }));
}
