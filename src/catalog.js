/**
 * Catalogue des figures remarquables qu'un niveau peut demander de construire.
 * Pur : aucune dépendance au DOM (sert au jeu, aux tests, aux mesures et au générateur).
 *
 * Une entrée :
 *   id       identifiant stable ('mediatrice', 'angle-60'…)
 *   nom      nom en français
 *   args     rôles attendus dans la figure de départ et leur type :
 *              'point'    id d'un point visible                       'P'
 *              'paire'    deux points visibles                        ['A', 'B']
 *              'droite'   droite ou segment donné, par ses deux points ['A', 'B']
 *              'angle'    deux droites données de sommet commun       {O, A, B}
 *              'cercle'   cercle donné : centre O, passant par R      {O, R}
 *              'triangle' trois points reliés par des objets donnés   ['A', 'B', 'C']
 *   cond     (optionnel) cond(G, b, fig) : l'association b a-t-elle un sens ? (ex. P hors de la droite)
 *   cible    cible(G, b) → variantes acceptées [[géométries]] (format de level.target)
 *   libelle  libelle(b) → description courte de l'instance, pour les humains
 *
 * Les géométries cibles : droites et cercles au format du moteur, points {k:'point', p}.
 */
import { add, sub, mul, dist, unit, perp, rot, cross, lineThrough as L, bisector, EPS } from './engine.js';

const pt = (p) => ({ k: 'point', p });
const mid = (a, b) => mul(add(a, b), 0.5);
const surDroite = (P, A, B) => Math.abs(cross(unit(sub(B, A)), sub(P, A))) < 1e-6;

// ---------- géométrie des cibles (positions → géométrie) ----------
/** Perpendiculaire à (AB) passant par P (que P soit sur la droite ou non). */
export const perpendiculaire = (P, A, B) => L(P, add(P, perp(unit(sub(B, A)))));
/** Parallèle à (AB) passant par P. */
export const parallele = (P, A, B) => L(P, add(P, sub(B, A)));
/** Bissectrice intérieure de l'angle AOB. */
export const bissectrice = (O, A, B) => L(O, add(O, add(unit(sub(A, O)), unit(sub(B, O)))));
/** Les deux sommets possibles d'un triangle équilatéral sur [AB], du plus haut au plus bas (écran). */
export const sommetsEquilateral = (A, B) => [rot(B, A, 60), rot(B, A, -60)].sort((p, q) => p[1] - q[1]);
/** Les deux droites par P qui font l'angle deg avec (AB). */
export const droitesAngle = (P, A, B, deg) => {
  const u = unit(sub(B, A));
  return [L(P, add(P, rot(u, [0, 0], deg))), L(P, add(P, rot(u, [0, 0], -deg)))];
};
/** Points de contact des tangentes au cercle (O, |OR|) issues de P (P extérieur). */
export const contactsTangentes = (O, R, P) => {
  const r = dist(O, R), d = dist(O, P);
  if (d <= r + EPS) return [];
  const a = (Math.acos(r / d) * 180) / Math.PI;
  const T = add(O, mul(unit(sub(P, O)), r));
  return [rot(T, O, a), rot(T, O, -a)];
};
export const centreCirconscrit = (A, B, C) => {
  const d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]));
  const n = (P) => P[0] * P[0] + P[1] * P[1];
  return [
    (n(A) * (B[1] - C[1]) + n(B) * (C[1] - A[1]) + n(C) * (A[1] - B[1])) / d,
    (n(A) * (C[0] - B[0]) + n(B) * (A[0] - C[0]) + n(C) * (B[0] - A[0])) / d,
  ];
};
export const centreInscrit = (A, B, C) => {
  const a = dist(B, C), b = dist(C, A), c = dist(A, B), s = a + b + c;
  return [(a * A[0] + b * B[0] + c * C[0]) / s, (a * A[1] + b * B[1] + c * C[1]) / s];
};
export const rayonInscrit = (A, B, C) => {
  const I = centreInscrit(A, B, C);
  return Math.abs(cross(unit(sub(B, A)), sub(I, A)));
};
/** Les deux autres sommets du carré construit sur [AB], d'un côté (sens = 1) ou de l'autre (sens = -1). */
export const sommetsCarre = (A, B, sens) => {
  const v = mul(perp(sub(B, A)), sens);
  return [add(B, v), add(A, v)];
};
/** Les cinq autres sommets de l'hexagone régulier inscrit dans le cercle (O, R), dont R est un sommet. */
export const sommetsHexagone = (O, R) => [1, 2, 3, 4, 5].map((k) => rot(R, O, 60 * k));
/** Les points qui partagent [AB] en n parts égales. */
export const partage = (A, B, n) => Array.from({ length: n - 1 }, (_, i) => add(A, mul(sub(B, A), (i + 1) / n)));

// ---------- conditions ----------
const surD = (G, b) => surDroite(G[b.P], G[b.d[0]], G[b.d[1]]);
const horsD = (G, b) => !surD(G, b);
const horsCercle = (G, b) => dist(G[b.c.O], G[b.P]) > dist(G[b.c.O], G[b.c.R]) + 1e-6;
const nomD = (d) => `(${d[0]}${d[1]})`;
const nomS = (s) => `[${s[0]}${s[1]}]`;

const angleEntree = (deg) => ({
  id: `angle-${deg}`,
  nom: `Droite à ${deg}°`,
  args: { d: 'droite', P: 'point' },
  cible: (G, b) => droitesAngle(G[b.P], G[b.d[0]], G[b.d[1]], deg).map((l) => [l]),
  libelle: (b) => `droite par ${b.P} à ${deg}° de ${nomD(b.d)}`,
});

export const CATALOGUE = [
  {
    id: 'triangle-equilateral',
    nom: 'Triangle équilatéral',
    args: { s: 'paire' },
    cible: (G, b) => {
      const [A, B] = [G[b.s[0]], G[b.s[1]]];
      return sommetsEquilateral(A, B).map((C) => [L(A, C), L(B, C)]);
    },
    libelle: (b) => `triangle équilatéral sur ${nomS(b.s)}`,
  },
  {
    id: 'perpendiculaire-en-un-point',
    nom: 'Perpendiculaire en un point',
    args: { d: 'droite', P: 'point' },
    cond: surD,
    cible: (G, b) => [[perpendiculaire(G[b.P], G[b.d[0]], G[b.d[1]])]],
    libelle: (b) => `perpendiculaire à ${nomD(b.d)} en ${b.P}`,
  },
  {
    id: 'perpendiculaire-depuis-un-point',
    nom: 'Perpendiculaire depuis un point',
    args: { d: 'droite', P: 'point' },
    cond: horsD,
    cible: (G, b) => [[perpendiculaire(G[b.P], G[b.d[0]], G[b.d[1]])]],
    libelle: (b) => `perpendiculaire à ${nomD(b.d)} depuis ${b.P}`,
  },
  {
    id: 'parallele',
    nom: 'Parallèle',
    args: { d: 'droite', P: 'point' },
    cond: horsD,
    cible: (G, b) => [[parallele(G[b.P], G[b.d[0]], G[b.d[1]])]],
    libelle: (b) => `parallèle à ${nomD(b.d)} par ${b.P}`,
  },
  {
    id: 'mediatrice',
    nom: 'Médiatrice',
    args: { s: 'paire' },
    cible: (G, b) => [[bisector(G[b.s[0]], G[b.s[1]])]],
    libelle: (b) => `médiatrice de ${nomS(b.s)}`,
  },
  {
    id: 'milieu',
    nom: 'Milieu',
    args: { s: 'paire' },
    cible: (G, b) => [[pt(mid(G[b.s[0]], G[b.s[1]]))]],
    libelle: (b) => `milieu de ${nomS(b.s)}`,
  },
  {
    id: 'bissectrice',
    nom: 'Bissectrice',
    args: { a: 'angle' },
    cible: (G, b) => [[bissectrice(G[b.a.O], G[b.a.A], G[b.a.B])]],
    libelle: (b) => `bissectrice de l'angle ${b.a.A}${b.a.O}${b.a.B}`,
  },
  angleEntree(60),
  angleEntree(30),
  angleEntree(45),
  angleEntree(15),
  {
    id: 'tangente',
    nom: 'Une tangente depuis un point',
    args: { c: 'cercle', P: 'point' },
    cond: horsCercle,
    cible: (G, b) => contactsTangentes(G[b.c.O], G[b.c.R], G[b.P]).map((T) => [L(G[b.P], T)]),
    libelle: (b) => `une tangente au cercle de centre ${b.c.O} depuis ${b.P}`,
  },
  {
    id: 'deux-tangentes',
    nom: 'Les deux tangentes depuis un point',
    args: { c: 'cercle', P: 'point' },
    cond: horsCercle,
    cible: (G, b) => [contactsTangentes(G[b.c.O], G[b.c.R], G[b.P]).map((T) => L(G[b.P], T))],
    libelle: (b) => `les deux tangentes au cercle de centre ${b.c.O} depuis ${b.P}`,
  },
  {
    id: 'centre',
    nom: "Centre d'un cercle",
    args: { c: 'cercle' },
    cond: (G, b, fig) => (fig.hidden || []).includes(b.c.O), // centre visible : rien à construire
    cible: (G, b) => [[pt(G[b.c.O])]],
    libelle: () => 'centre du cercle',
  },
  {
    id: 'centre-circonscrit',
    nom: 'Centre du cercle circonscrit',
    args: { t: 'triangle' },
    cible: (G, b) => [[pt(centreCirconscrit(...b.t.map((k) => G[k])))]],
    libelle: (b) => `centre du cercle circonscrit à ${b.t.join('')}`,
  },
  {
    id: 'cercle-circonscrit',
    nom: 'Cercle circonscrit',
    args: { t: 'triangle' },
    cible: (G, b) => {
      const [A, B, C] = b.t.map((k) => G[k]), O = centreCirconscrit(A, B, C);
      return [[{ k: 'circle', c: O, r: dist(O, A) }]];
    },
    libelle: (b) => `cercle circonscrit à ${b.t.join('')}`,
  },
  {
    id: 'centre-inscrit',
    nom: 'Centre du cercle inscrit',
    args: { t: 'triangle' },
    cible: (G, b) => [[pt(centreInscrit(...b.t.map((k) => G[k])))]],
    libelle: (b) => `centre du cercle inscrit dans ${b.t.join('')}`,
  },
  {
    id: 'cercle-inscrit',
    nom: 'Cercle inscrit',
    args: { t: 'triangle' },
    cible: (G, b) => {
      const [A, B, C] = b.t.map((k) => G[k]);
      return [[{ k: 'circle', c: centreInscrit(A, B, C), r: rayonInscrit(A, B, C) }]];
    },
    libelle: (b) => `cercle inscrit dans ${b.t.join('')}`,
  },
  {
    id: 'carre',
    nom: 'Carré sur un segment',
    args: { s: 'paire' },
    cible: (G, b) => [1, -1].map((sens) => sommetsCarre(G[b.s[0]], G[b.s[1]], sens).map(pt)),
    libelle: (b) => `carré sur ${nomS(b.s)} (sommets)`,
  },
  {
    id: 'hexagone',
    nom: 'Hexagone régulier inscrit',
    args: { c: 'cercle' },
    cible: (G, b) => [sommetsHexagone(G[b.c.O], G[b.c.R]).map(pt)],
    libelle: (b) => `hexagone inscrit, sommet ${b.c.R} (sommets)`,
  },
  {
    id: 'partage-en-3',
    nom: 'Partage en trois',
    args: { s: 'paire' },
    cible: (G, b) => [partage(G[b.s[0]], G[b.s[1]], 3).map(pt)],
    libelle: (b) => `partage de ${nomS(b.s)} en 3`,
  },
];

export const ENTREE = Object.fromEntries(CATALOGUE.map((e) => [e.id, e]));

/** Variantes d'objectif d'un objectif {id, args} pour les points G. */
export function cible(objectif, G) {
  const e = ENTREE[objectif.id];
  if (!e) throw new Error(`figure inconnue du catalogue : ${objectif.id}`);
  return e.cible(G, objectif.args);
}
