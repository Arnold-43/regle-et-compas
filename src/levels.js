/**
 * Les niveaux, regroupés en chapitres dans src/chapters.js (l'ordre de ce tableau est indifférent).
 *
 * Format d'un niveau :
 *   id             identifiant stable (sert de clé à la progression enregistrée : ne jamais le changer)
 *   prop           numéro de proposition d'Euclide (optionnel ; sinon l'en-tête affiche le chapitre)
 *   title, goal    textes affichés (français)
 *   tools          outils disponibles : 'line', 'circle', 'med'
 *   par            minimum de coups (vérifié par le solveur dans les tests)
 *   extra          marge de coups au-delà du minimum
 *   unlocks        outil débloqué à la première réussite (optionnel)
 *   pts            points de départ {A:[x,y]}, repère écran (y vers le bas)
 *   given          objets donnés [{id, t:'seg'|'line', a, b}]
 *   view           cadrage initial [xmin, ymin, xmax, ymax]
 *   lab            direction des étiquettes de points {A:[dx,dy]}
 *   objectif       figure à construire, prise dans le catalogue (src/catalog.js) : {id, args}
 *   target(G)      variantes d'objectif acceptées : [[géométries]] — cible(this.objectif, G)
 *   ghost(G)       objectif affiché en pointillés
 *   celebrate(G,i) formes affichées à la réussite (variante i)
 *   decor(G)       formes de décor (optionnel)
 *   refs           solutions de référence (servent aux indices et aux tests)
 *
 * Règle : tout niveau ajouté doit passer `npm test` (références valides, minimum exact,
 * aucune solution plus courte, les indices mènent à la solution).
 */
import { add, sub, mul, dot, unit, perp, cross, rot } from './engine.js';
import { cible, sommetsEquilateral, perpendiculaire, bissectrice, parallele } from './catalog.js';

export const LEVELS = [
  {
    id: 'I.1', prop: 1, title: 'Triangle équilatéral',
    goal: 'Construis un triangle équilatéral sur le segment AB.',
    tools: ['line', 'circle'], par: 4, extra: 3,
    pts: { A: [-50, 30], B: [50, 30] },
    given: [{ id: 's', t: 'seg', a: 'A', b: 'B' }],
    view: [-115, -95, 115, 145],
    lab: { A: [-1, 0.7], B: [1, 0.7] },
    objectif: { id: 'triangle-equilateral', args: { s: ['A', 'B'] } },
    apexes(G) { return sommetsEquilateral(G.A, G.B); },
    target(G) { return cible(this.objectif, G); },
    ghost(G) { const C = this.apexes(G)[0]; return [{ seg: [G.A, C] }, { seg: [G.B, C] }]; },
    celebrate(G, alt) {
      const C = this.apexes(G)[alt];
      return [
        { poly: [G.A, G.B, C], fill: 'yellow' },
        { seg: [G.A, C], stroke: 'red' }, { seg: [G.B, C], stroke: 'blue' },
      ];
    },
    refs: ['top', 'bottom'].map((pk) => [
      { t: 'circle', a: 'A', b: 'B' }, { t: 'circle', a: 'B', b: 'A' },
      { t: 'line', a: 'A', b: { x: [0, 1], pick: pk } }, { t: 'line', a: 'B', b: { x: [0, 1], pick: pk } },
    ]),
  },
  {
    id: 'I.10', prop: 10, title: 'Médiatrice',
    goal: 'Trace la médiatrice de AB : la droite qui coupe le segment en son milieu, à angle droit.',
    tools: ['line', 'circle'], par: 3, extra: 3, unlocks: 'med',
    pts: { A: [-50, 15], B: [50, -15] },
    given: [{ id: 's', t: 'seg', a: 'A', b: 'B' }],
    view: [-115, -115, 115, 115],
    lab: { A: [-1, 0.5], B: [1, -0.5] },
    objectif: { id: 'mediatrice', args: { s: ['A', 'B'] } },
    target(G) { return cible(this.objectif, G); },
    ghost(G) { return [{ line: this.target(G)[0][0] }]; },
    celebrate(G) {
      const M = mul(add(G.A, G.B), 0.5), u = unit(sub(G.B, G.A));
      return [{ line: this.target(G)[0][0], stroke: 'blue' }, { right: [M, u, perp(u)] }, { dot: M, fill: 'red' }];
    },
    refs: [[
      { t: 'circle', a: 'A', b: 'B' }, { t: 'circle', a: 'B', b: 'A' },
      { t: 'line', a: { x: [0, 1], pick: 'top' }, b: { x: [0, 1], pick: 'bottom' } },
    ]],
  },
  {
    id: 'I.11', prop: 11, title: 'Perpendiculaire en un point',
    goal: 'Élève la perpendiculaire à la droite au point P.',
    tools: ['line', 'circle', 'med'], par: 2, extra: 3,
    pts: { A: [-80, 15], P: [10, 0] },
    given: [{ id: 'l', t: 'line', a: 'A', b: 'P' }],
    view: [-112, -118, 132, 118],
    lab: { A: [-0.2, 1], P: [0.7, 1] },
    objectif: { id: 'perpendiculaire-en-un-point', args: { d: ['A', 'P'], P: 'P' } },
    perpAt(G) { return perpendiculaire(G.P, G.A, G.P); },
    target(G) { return cible(this.objectif, G); },
    ghost(G) { return [{ line: this.perpAt(G) }]; },
    celebrate(G) {
      const u = unit(sub(G.P, G.A));
      return [{ line: this.perpAt(G), stroke: 'blue' }, { right: [G.P, u, mul(perp(u), -1)] }];
    },
    refs: [
      [{ t: 'circle', a: 'P', b: 'A' }, { t: 'med', a: 'A', b: { x: ['l', 0], not: 'A' } }],
      [
        { t: 'circle', a: 'P', b: 'A' },
        { t: 'circle', a: 'A', b: { x: ['l', 0], not: 'A' } },
        { t: 'circle', a: { x: ['l', 0], not: 'A' }, b: 'A' },
        { t: 'line', a: { x: [1, 2], pick: 'top' }, b: { x: [1, 2], pick: 'bottom' } },
      ],
    ],
  },
  {
    id: 'I.12', prop: 12, title: 'Perpendiculaire depuis un point',
    goal: 'Abaisse la perpendiculaire à la droite depuis le point P.',
    tools: ['line', 'circle', 'med'], par: 2, extra: 3,
    pts: { A: [-60, 35], B: [55, 20], P: [-10, -60] },
    given: [{ id: 'l', t: 'line', a: 'A', b: 'B' }],
    view: [-120, -112, 120, 142],
    lab: { A: [-0.3, 1], B: [0.3, 1], P: [-1, -0.5] },
    objectif: { id: 'perpendiculaire-depuis-un-point', args: { d: ['A', 'B'], P: 'P' } },
    perpFrom(G) { return perpendiculaire(G.P, G.A, G.B); },
    target(G) { return cible(this.objectif, G); },
    ghost(G) { return [{ line: this.perpFrom(G) }]; },
    celebrate(G) {
      const u = unit(sub(G.B, G.A));
      const F = add(G.A, mul(u, dot(sub(G.P, G.A), u)));
      return [{ line: this.perpFrom(G), stroke: 'blue' }, { seg: [G.P, F], stroke: 'red' }, { right: [F, u, mul(perp(u), -1)] }];
    },
    refs: [
      [{ t: 'circle', a: 'P', b: 'A' }, { t: 'med', a: 'A', b: { x: ['l', 0], not: 'A' } }],
      [{ t: 'circle', a: 'P', b: 'B' }, { t: 'med', a: 'B', b: { x: ['l', 0], not: 'B' } }],
      [{ t: 'circle', a: 'A', b: 'P' }, { t: 'circle', a: 'B', b: 'P' }, { t: 'line', a: 'P', b: { x: [0, 1], not: 'P' } }],
    ],
  },
  {
    id: 'I.9', prop: 9, title: 'Bissectrice',
    goal: "Partage l'angle AOB en deux angles égaux.",
    tools: ['line', 'circle', 'med'], par: 2, extra: 3,
    pts: { O: [-70, 50], A: [50, 20], B: [0, -70] },
    given: [{ id: 'la', t: 'line', a: 'O', b: 'A' }, { id: 'lb', t: 'line', a: 'O', b: 'B' }],
    view: [-105, -100, 115, 135],
    lab: { O: [-1, 0.6], A: [0.5, 1], B: [1, -0.3] },
    objectif: { id: 'bissectrice', args: { a: { O: 'O', A: 'A', B: 'B' } } },
    bis(G) { return bissectrice(G.O, G.A, G.B); },
    target(G) { return cible(this.objectif, G); },
    ghost(G) { return [{ line: this.bis(G) }]; },
    decor(G) { return [{ wedge: [G.O, sub(G.A, G.O), sub(G.B, G.O)], fill: 'yellow', r: 46 }]; },
    celebrate(G) {
      const w = add(unit(sub(G.A, G.O)), unit(sub(G.B, G.O)));
      return [
        { wedge: [G.O, sub(G.A, G.O), w], fill: 'red', r: 58 },
        { wedge: [G.O, w, sub(G.B, G.O)], fill: 'blue', r: 58 },
        { line: this.bis(G), stroke: 'blue' },
      ];
    },
    refs: [
      [{ t: 'circle', a: 'O', b: 'A' }, { t: 'med', a: 'A', b: { x: ['lb', 0], near: 'B' } }],
      [{ t: 'circle', a: 'O', b: 'B' }, { t: 'med', a: 'B', b: { x: ['la', 0], near: 'A' } }],
      [
        { t: 'circle', a: 'O', b: 'A' },
        { t: 'circle', a: 'A', b: { x: ['lb', 0], near: 'B' } },
        { t: 'circle', a: { x: ['lb', 0], near: 'B' }, b: 'A' },
        { t: 'line', a: 'O', b: { x: [1, 2], far: 'O' } },
      ],
    ],
  },
  {
    id: 'I.31', prop: 31, title: 'Parallèle',
    goal: 'Trace la parallèle à la droite qui passe par P.',
    tools: ['line', 'circle', 'med'], par: 3, extra: 3,
    pts: { A: [-60, 40], B: [70, 22], P: [-5, -50] },
    given: [{ id: 'l', t: 'line', a: 'A', b: 'B' }],
    view: [-122, -118, 122, 128],
    lab: { A: [-0.3, 1], B: [0.3, 1], P: [-1, -0.5] },
    objectif: { id: 'parallele', args: { d: ['A', 'B'], P: 'P' } },
    par3(G) { return parallele(G.P, G.A, G.B); },
    target(G) { return cible(this.objectif, G); },
    ghost(G) { return [{ line: this.par3(G) }]; },
    celebrate(G) {
      const u = unit(sub(G.B, G.A));
      return [
        { line: this.par3(G), stroke: 'blue' },
        { ticks: [G.P, u] }, { ticks: [mul(add(G.A, G.B), 0.5), u] },
      ];
    },
    refs: [
      [
        { t: 'circle', a: 'P', b: 'A' },
        { t: 'med', a: 'A', b: { x: ['l', 0], not: 'A' } },
        { t: 'med', a: { x: [0, 1], pick: 'top' }, b: { x: [0, 1], pick: 'bottom' } },
      ],
      [
        { t: 'circle', a: 'A', b: 'P' },
        { t: 'circle', a: 'P', b: 'A' },
        { t: 'circle', a: { x: ['l', 0], near: 'B' }, b: 'A' },
        { t: 'line', a: 'P', b: { x: [1, 2], not: 'A' } },
      ],
    ],
  },
  ...angles(),
];

/**
 * Chapitre 2 — Les angles. Figure : un segment AB ; objectif : une droite par A qui fait l'angle voulu
 * avec le segment (les deux côtés du segment sont acceptés). À la réussite, l'angle est coloré façon Byrne
 * et sa valeur s'affiche ; pour 45° et 15°, l'angle qu'on a coupé en deux apparaît en rouge clair.
 */
function angles() {
  const pk = ['top', 'bottom'];
  const autre = { top: 'bottom', bottom: 'top' };
  const base = (deg, o) => ({
    id: `angle-${deg}`, title: `Angle de ${deg}°`,
    goal: `Trace une droite qui passe par A et fait un angle de ${deg}° avec le segment AB.`,
    tools: ['line', 'circle', 'med'], extra: 3,
    given: [{ id: 's', t: 'seg', a: 'A', b: 'B' }],
    view: [-110, -120, 120, 125],
    lab: { A: [-1, 0.6], B: [1, 0.6] },
    objectif: { id: `angle-${deg}`, args: { d: ['A', 'B'], P: 'A' } },
    target(G) { return cible(this.objectif, G); },
    /** Demi-droite issue de A, portée par la droite g, qui fait l'angle aigu avec [AB). */
    rayon(G, g) { const u = unit(sub(G.B, G.A)); return dot(g.d, u) > 0 ? g.d : mul(g.d, -1); },
    /** Variante dont l'angle s'ouvre vers le haut de l'écran (affichée en pointillés). */
    haut(G) {
      const ys = this.target(G).map((alt) => this.rayon(G, alt[0])[1]);
      return ys[0] <= ys[1] ? 0 : 1;
    },
    ghost(G) { return [{ line: this.target(G)[this.haut(G)][0] }]; },
    celebrate(G, alt) {
      const g = this.target(G)[alt][0], u = unit(sub(G.B, G.A)), w = this.rayon(G, g);
      const sens = Math.sign(cross(u, w)) || 1;
      const out = [];
      if (o.moitie) out.push({ wedge: [G.A, u, rot(u, [0, 0], sens * o.moitie)], fill: 'red', r: 96 });
      out.push({ wedge: [G.A, u, w], fill: 'yellow', r: 78 });
      out.push({ line: g, stroke: 'blue' });
      out.push({ seg: [G.A, G.B], stroke: 'red' });
      out.push({ label: [G.A, `${deg}°`], dir: unit(add(u, w)), off: o.moitie ? 112 : 96 });
      return out;
    },
    ...o,
  });
  return [
    base(60, {
      par: 3, pts: { A: [-55, 40], B: [50, 26] },
      refs: pk.map((p) => [
        { t: 'circle', a: 'A', b: 'B' }, { t: 'circle', a: 'B', b: 'A' },
        { t: 'line', a: 'A', b: { x: [0, 1], pick: p } },
      ]),
    }),
    base(30, {
      par: 3, pts: { A: [-52, 34], B: [54, 47] },
      refs: pk.map((p) => [
        { t: 'circle', a: 'A', b: 'B' }, { t: 'med', a: 'A', b: 'B' },
        { t: 'med', a: 'B', b: { x: [0, 1], pick: p } },
      ]),
    }),
    base(45, {
      par: 3, moitie: 90, pts: { A: [-58, 44], B: [47, 30] },
      refs: pk.map((p) => [
        { t: 'med', a: 'A', b: 'B' }, { t: 'circle', a: { x: ['s', 0] }, b: 'A' },
        { t: 'line', a: 'A', b: { x: [0, 1], pick: p } },
      ]),
    }),
    base(15, {
      par: 4, moitie: 30, defi: true, pts: { A: [-53, 33], B: [52, 45] },
      refs: pk.map((p) => [
        { t: 'circle', a: 'A', b: 'B' }, { t: 'med', a: 'A', b: 'B' },
        { t: 'circle', a: { x: [0, 1], pick: p }, b: 'A' },
        { t: 'line', a: 'A', b: { x: [1, 2], pick: autre[p] } },
      ]),
    }),
  ];
}
