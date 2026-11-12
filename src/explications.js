/**
 * Idées et explications des niveaux. Pur : sans DOM.
 *
 * Chaque entrée est attachée à une solution de référence épinglée (`ref`, au format des refs du moteur) :
 * la certification la garde toujours parmi les refs du niveau, l'indice la suit tant qu'elle reste
 * atteignable, et le « Pourquoi ? » la rejoue.
 *
 *   ref        solution épinglée
 *   pts        points nommés tirés de cette solution ({x: [i, j], k} ou {x: [i, j], pick}, i = index du tracé)
 *   idee       {texte, faits} : le principe, sans désigner de point ni d'outil (indice 1 sur 4, gratuit)
 *   pourquoi   étapes affichées après la réussite : {texte, faits, formes}
 *              formes : {seg: ['A','B'], couleur}, {angle: ['A','O','B'], couleur}, {droit: ['A','O','B']},
 *                       {poly: ['A','B','C'], couleur}, {point: 'A', couleur} — couleurs : red, blue, yellow
 *
 * Règle : chaque idée et chaque étape déclare les faits sur lesquels elle s'appuie (src/faits.js) ; un test
 * les vérifie sur la figure du niveau et sur des figures déformées. Une idée fausse ne passe pas.
 */

const c = (a, b) => ({ t: 'circle', a, b });
const l = (a, b) => ({ t: 'line', a, b });
const m = (a, b) => ({ t: 'med', a, b });
const x = (i, j, k) => ({ x: [i, j], k });

export const EXPLICATIONS = {
  // ---------- Chapitre 1 — Les bases ----------
  'I.1': {
    ref: [c('A', 'B'), c('B', 'A'), l('A', { x: [0, 1], pick: 'top' }), l('B', { x: [0, 1], pick: 'top' })],
    pts: { C: { x: [0, 1], pick: 'top' } },
    idee: {
      texte: 'Les trois côtés doivent être égaux à AB. Un cercle de centre A passant par B contient tous les points à la distance AB de A.',
      faits: [{ egal: [['A', 'B'], ['A', 'C'], ['B', 'C']] }],
    },
    pourquoi: [
      { texte: 'C est sur le cercle de centre A qui passe par B : AC = AB.', faits: [{ egal: [['A', 'B'], ['A', 'C']] }],
        formes: [{ seg: ['A', 'B'], couleur: 'red' }, { seg: ['A', 'C'], couleur: 'red' }] },
      { texte: 'C est aussi sur le cercle de centre B qui passe par A : BC = BA.', faits: [{ egal: [['B', 'A'], ['B', 'C']] }],
        formes: [{ seg: ['A', 'B'], couleur: 'red' }, { seg: ['A', 'C'], couleur: 'red' }, { seg: ['B', 'C'], couleur: 'red' }] },
      { texte: 'Les trois côtés sont égaux : le triangle ABC est équilatéral.', faits: [{ egal: [['A', 'B'], ['B', 'C'], ['C', 'A']] }],
        formes: [{ poly: ['A', 'B', 'C'], couleur: 'yellow' }, { seg: ['A', 'B'], couleur: 'red' }, { seg: ['B', 'C'], couleur: 'red' }, { seg: ['C', 'A'], couleur: 'red' }] },
    ],
  },
  'I.10': {
    ref: [c('A', 'B'), c('B', 'A'), l({ x: [0, 1], pick: 'top' }, { x: [0, 1], pick: 'bottom' })],
    pts: { P: { x: [0, 1], pick: 'top' }, Q: { x: [0, 1], pick: 'bottom' }, M: x('s', 2, 0) },
    idee: {
      texte: 'Un point à la même distance de A et de B est sur la médiatrice. Cherche deux points comme ça.',
      faits: [{ egal: [['A', 'P'], ['B', 'P']] }, { egal: [['A', 'Q'], ['B', 'Q']] }],
    },
    pourquoi: [
      { texte: 'Les deux cercles ont le même rayon AB. P est sur les deux : PA = PB.', faits: [{ egal: [['P', 'A'], ['P', 'B']] }],
        formes: [{ seg: ['P', 'A'], couleur: 'red' }, { seg: ['P', 'B'], couleur: 'red' }] },
      { texte: 'De même, Q est à la même distance de A et de B : QA = QB.', faits: [{ egal: [['Q', 'A'], ['Q', 'B']] }],
        formes: [{ seg: ['P', 'A'], couleur: 'red' }, { seg: ['P', 'B'], couleur: 'red' }, { seg: ['Q', 'A'], couleur: 'blue' }, { seg: ['Q', 'B'], couleur: 'blue' }] },
      { texte: 'La droite (PQ) passe donc par le milieu de [AB] et le coupe à angle droit : c’est la médiatrice.', faits: [{ milieu: ['M', 'A', 'B'] }, { droit: ['P', 'M', 'A'] }],
        formes: [{ seg: ['A', 'M'], couleur: 'yellow' }, { seg: ['M', 'B'], couleur: 'yellow' }, { droit: ['P', 'M', 'B'] }, { point: 'M', couleur: 'red' }] },
    ],
  },
  'I.11': {
    ref: [c('P', 'A'), m('A', { x: ['l', 0], not: 'A' })],
    pts: { A2: { x: ['l', 0], not: 'A' } },
    idee: {
      texte: 'Si P est le milieu d’un segment posé sur la droite, la perpendiculaire en P est la médiatrice de ce segment.',
      faits: [{ milieu: ['P', 'A', 'A2'] }, { alignes: ['A', 'P', 'A2'] }],
    },
  },
  'I.12': {
    ref: [c('P', 'A'), m('A', { x: ['l', 0], not: 'A' })],
    pts: { A2: { x: ['l', 0], not: 'A' } },
    idee: {
      texte: 'Un cercle de centre P coupe la droite en deux points à la même distance de P. P est alors sur leur médiatrice.',
      faits: [{ egal: [['P', 'A'], ['P', 'A2']] }, { alignes: ['A', 'B', 'A2'] }, { surLigne: ['P', 1] }],
    },
  },
  'I.9': {
    ref: [c('O', 'A'), m('A', { x: ['lb', 0], near: 'B' })],
    pts: { A2: { x: ['lb', 0], near: 'B' }, Q: x(0, 1, 0) },
    idee: {
      texte: 'Pour couper un angle en deux, cherche deux points à la même distance du sommet, un sur chaque côté.',
      faits: [{ egal: [['O', 'A'], ['O', 'A2']] }, { alignes: ['O', 'B', 'A2'] }, { anglesEgaux: [['A', 'O', 'Q'], ['Q', 'O', 'A2']] }],
    },
  },
  'I.31': {
    ref: [c('P', 'A'), m('A', { x: ['l', 0], not: 'A' }), m({ x: [0, 1], pick: 'top' }, { x: [0, 1], pick: 'bottom' })],
    pts: { A2: { x: ['l', 0], not: 'A' }, F: x('l', 1, 0), U: { x: [0, 1], pick: 'top' }, V: { x: [0, 1], pick: 'bottom' }, W: x(0, 2, 0) },
    idee: {
      texte: 'Deux droites perpendiculaires à une même droite sont parallèles entre elles.',
      faits: [{ droit: ['A', 'F', 'P'] }, { droit: ['U', 'P', 'W'] }, { parallele: ['l', 2] }],
    },
    pourquoi: [
      { texte: 'Le cercle de centre P coupe la droite en A et A′, à la même distance de P.', faits: [{ egal: [['P', 'A'], ['P', 'A2']] }],
        formes: [{ seg: ['P', 'A'], couleur: 'red' }, { seg: ['P', 'A2'], couleur: 'red' }] },
      { texte: 'La médiatrice de [AA′] passe par P et tombe sur la droite à angle droit.', faits: [{ droit: ['A', 'F', 'P'] }, { surLigne: ['P', 1] }],
        formes: [{ seg: ['P', 'F'], couleur: 'blue' }, { droit: ['A', 'F', 'P'] }] },
      { texte: 'Le même cercle coupe cette perpendiculaire en U et V, à la même distance de P. Leur médiatrice est perpendiculaire à (UV) en P.', faits: [{ milieu: ['P', 'U', 'V'] }, { droit: ['U', 'P', 'W'] }],
        formes: [{ seg: ['P', 'U'], couleur: 'red' }, { seg: ['P', 'V'], couleur: 'red' }, { droit: ['U', 'P', 'W'] }] },
      { texte: 'Deux droites perpendiculaires à (UV) sont parallèles : la droite tracée ne coupe jamais la droite de départ.', faits: [{ parallele: ['l', 2] }],
        formes: [{ droit: ['A', 'F', 'P'] }, { droit: ['U', 'P', 'W'] }, { seg: ['F', 'P'], couleur: 'blue' }] },
    ],
  },

  // ---------- Chapitre 2 — Les angles ----------
  'angle-60': {
    ref: [c('A', 'B'), c('B', 'A'), l('A', { x: [0, 1], pick: 'top' })],
    pts: { C: { x: [0, 1], pick: 'top' } },
    idee: {
      texte: 'Dans un triangle équilatéral, chaque angle vaut 60°. Construis-en un sur [AB].',
      faits: [{ egal: [['A', 'B'], ['A', 'C'], ['B', 'C']] }, { angle: ['B', 'A', 'C', 60] }],
    },
  },
  'angle-30': {
    ref: [c('A', 'B'), m('A', 'B'), m('B', { x: [0, 1], pick: 'top' })],
    pts: { C: { x: [0, 1], pick: 'top' } },
    idee: {
      texte: '30°, c’est la moitié de 60°. Coupe en deux l’angle d’un triangle équilatéral.',
      faits: [{ egal: [['A', 'B'], ['A', 'C'], ['B', 'C']] }, { surLigne: ['A', 2] }, { angleLignes: [2, 's', 30] }],
    },
  },
  'angle-45': {
    ref: [m('A', 'B'), c({ x: ['s', 0] }, 'A'), l('A', { x: [0, 1], pick: 'top' })],
    pts: { M: { x: ['s', 0] }, X: { x: [0, 1], pick: 'top' } },
    idee: {
      texte: 'Un triangle rectangle avec deux côtés égaux a deux angles de 45°.',
      faits: [{ droit: ['A', 'M', 'X'] }, { egal: [['M', 'A'], ['M', 'X']] }, { angle: ['M', 'A', 'X', 45] }],
    },
  },
  'angle-15': {
    ref: [c('A', 'B'), m('A', 'B'), c({ x: [0, 1], pick: 'top' }, 'A'), l('A', { x: [1, 2], pick: 'bottom' })],
    pts: { C: { x: [0, 1], pick: 'top' }, D: { x: [1, 2], pick: 'bottom' } },
    idee: {
      texte: 'Un triangle isocèle avec 30° au sommet a deux angles de 75°. Retire les 60° d’un triangle équilatéral : il reste 15°.',
      faits: [{ egal: [['C', 'A'], ['C', 'D']] }, { angle: ['A', 'C', 'D', 30] }, { angle: ['C', 'A', 'D', 75] }, { angle: ['B', 'A', 'C', 60] }, { angleLignes: [3, 's', 15] }],
    },
  },

  // ---------- Chapitre 3 — Le cercle donné ----------
  'cercle-equilateral-b': {
    ref: [c('R', 'O'), l('O', x('c', 0, 1)), l('R', x('c', 0, 1))],
    pts: { X: x('c', 0, 1) },
    idee: {
      texte: 'Le cercle donné a pour rayon OR. Un point de ce cercle qui est aussi à la distance OR de R fait un triangle équilatéral avec O et R.',
      faits: [{ egal: [['O', 'R'], ['O', 'X'], ['R', 'X']] }],
    },
  },
  'cercle-hexagone': {
    ref: [l('O', 'R'), m('O', 'R'), m('O', x('c', 0, 0))],
    pts: { R2: x('c', 0, 0), V: x('c', 1, 0), V2: x('c', 1, 1), W: x('c', 2, 0) },
    idee: {
      texte: 'Le côté de l’hexagone est égal au rayon. Les deux sommets voisins de R sont à la même distance de O et de R.',
      faits: [{ egal: [['O', 'R'], ['O', 'V'], ['R', 'V']] }, { egal: [['O', 'R'], ['O', 'V2'], ['R', 'V2']] }],
    },
    pourquoi: [
      { texte: 'Un sommet V voisin de R vérifie VO = VR = OR : le triangle OVR est équilatéral.', faits: [{ egal: [['O', 'R'], ['O', 'V'], ['R', 'V']] }],
        formes: [{ poly: ['O', 'R', 'V'], couleur: 'yellow' }, { seg: ['O', 'R'], couleur: 'red' }, { seg: ['O', 'V'], couleur: 'red' }, { seg: ['R', 'V'], couleur: 'red' }] },
      { texte: 'Les points à la même distance de O et de R sont sur la médiatrice de [OR] : elle coupe le cercle en ces deux sommets.', faits: [{ egal: [['O', 'V'], ['R', 'V']] }, { egal: [['O', 'V2'], ['R', 'V2']] }],
        formes: [{ seg: ['O', 'V'], couleur: 'red' }, { seg: ['R', 'V'], couleur: 'red' }, { seg: ['O', 'V2'], couleur: 'blue' }, { seg: ['R', 'V2'], couleur: 'blue' }] },
      { texte: 'La droite (OR) donne R′, le sommet opposé à R. La médiatrice de [OR′] donne les deux derniers sommets, de la même façon.', faits: [{ alignes: ['R', 'O', 'R2'] }, { egal: [['O', 'R2'], ['O', 'W'], ['R2', 'W']] }],
        formes: [{ seg: ['R', 'R2'], couleur: 'blue' }, { poly: ['O', 'R2', 'W'], couleur: 'yellow' }, { seg: ['O', 'W'], couleur: 'red' }, { seg: ['R2', 'W'], couleur: 'red' }] },
    ],
  },
  'cercle-triangle-inscrit': {
    ref: [l('O', 'R'), m('O', x('c', 0, 0))],
    pts: { R2: x('c', 0, 0), T: x('c', 1, 0), U: x('c', 1, 1) },
    idee: {
      texte: 'Le triangle inscrit prend un sommet sur deux de l’hexagone. Les deux sommets qui manquent sont les voisins du point opposé à R.',
      faits: [{ alignes: ['R', 'O', 'R2'] }, { egal: [['O', 'R2'], ['O', 'T'], ['R2', 'T']] }, { angle: ['R', 'O', 'T', 120] }],
    },
    pourquoi: [
      { texte: 'La droite (OR) coupe le cercle en R′, le point opposé à R.', faits: [{ alignes: ['R', 'O', 'R2'] }],
        formes: [{ seg: ['R', 'R2'], couleur: 'blue' }, { point: 'R2', couleur: 'red' }] },
      { texte: 'La médiatrice de [OR′] coupe le cercle en T et U, à la distance OR′ de O et de R′ : les triangles OR′T et OR′U sont équilatéraux.', faits: [{ egal: [['O', 'R2'], ['O', 'T'], ['R2', 'T']] }, { egal: [['O', 'R2'], ['O', 'U'], ['R2', 'U']] }],
        formes: [{ poly: ['O', 'R2', 'T'], couleur: 'yellow' }, { poly: ['O', 'R2', 'U'], couleur: 'yellow' }, { angle: ['R2', 'O', 'T'], couleur: 'red' }, { angle: ['R2', 'O', 'U'], couleur: 'red' }] },
      { texte: 'De R′ à T, il y a 60° autour de O. De R à T, il y a donc 180° − 60° = 120°, et de même de R à U : RTU est équilatéral.', faits: [{ angle: ['R', 'O', 'T', 120] }, { angle: ['R', 'O', 'U', 120] }, { egal: [['R', 'T'], ['T', 'U'], ['U', 'R']] }],
        formes: [{ poly: ['R', 'T', 'U'], couleur: 'yellow' }, { angle: ['R', 'O', 'T'], couleur: 'blue' }, { angle: ['R', 'O', 'U'], couleur: 'blue' }, { seg: ['R', 'T'], couleur: 'red' }, { seg: ['T', 'U'], couleur: 'red' }, { seg: ['U', 'R'], couleur: 'red' }] },
    ],
  },
  'cercle-mediatrice-b': {
    ref: [c('R', 'O'), l(x('c', 0, 0), x('c', 0, 1))],
    pts: { X: x('c', 0, 0), Y: x('c', 0, 1) },
    idee: {
      texte: 'Le cercle donné et un cercle de même rayon centré en R se croisent en deux points à la même distance de O et de R.',
      faits: [{ egal: [['O', 'X'], ['R', 'X']] }, { egal: [['O', 'Y'], ['R', 'Y']] }],
    },
  },
  'cercle-carre-inscrit': {
    ref: [l('O', 'R'), m('R', x('c', 0, 0))],
    pts: { R2: x('c', 0, 0), V: x('c', 1, 0) },
    idee: {
      texte: 'Les diagonales d’un carré inscrit sont deux diamètres perpendiculaires.',
      faits: [{ alignes: ['R', 'O', 'R2'] }, { droit: ['R', 'O', 'V'] }, { surCercle: ['V', 'O', 'R'] }],
    },
  },
  'cercle-hexagone-b': {
    ref: [l('O', 'R'), c('R', 'O'), c(x('c', 0, 0), 'O')],
    pts: { R2: x('c', 0, 0), V: x('c', 1, 0), W: x('c', 2, 0) },
    idee: {
      texte: 'Le côté de l’hexagone est égal au rayon : un cercle de même rayon, centré sur un sommet, coupe le cercle donné aux deux sommets voisins.',
      faits: [{ egal: [['O', 'R'], ['R', 'V'], ['O', 'V']] }, { alignes: ['R', 'O', 'R2'] }, { egal: [['O', 'R'], ['R2', 'W'], ['O', 'W']] }],
    },
  },
  'cercle-triangle-inscrit-b': {
    ref: [l('O', 'R'), c(x('c', 0, 0), 'O')],
    pts: { R2: x('c', 0, 0), T: x('c', 1, 0) },
    idee: {
      texte: 'Les deux sommets qui manquent sont les voisins, sur l’hexagone, du point opposé à R : à la distance du rayon de ce point.',
      faits: [{ alignes: ['R', 'O', 'R2'] }, { egal: [['O', 'R'], ['R2', 'T'], ['O', 'T']] }, { angle: ['R', 'O', 'T', 120] }],
    },
  },
  'cercle-carre': {
    ref: [c('R', 'O'), m('O', x('c', 0, 0)), c(x('c', 0, 0), x(0, 1, 1))],
    pts: { E: x('c', 0, 0), F: x(0, 1, 1), C: x(0, 2, 1), D: x('c', 2, 0) },
    idee: {
      texte: 'Un angle droit, c’est 60° + 30°. Le triangle équilatéral sur [OR] donne 60°, et couper cet angle en deux donne 30°.',
      faits: [{ egal: [['O', 'R'], ['O', 'E'], ['R', 'E']] }, { angle: ['O', 'R', 'F', 30] }, { egal: [['E', 'F'], ['E', 'C'], ['E', 'D']] }, { angle: ['O', 'R', 'C', 90] }, { angle: ['R', 'O', 'D', 90] }],
    },
  },
  'cercle-centre': {
    ref: [m('R', 'S'), m('R', x('c', 0, 0))],
    idee: {
      texte: 'Le centre est à la même distance de tous les points du cercle : il est sur la médiatrice de chaque corde. Deux médiatrices suffisent.',
      faits: [{ surLigne: ['O', 0] }, { surLigne: ['O', 1] }],
    },
  },
  'cercle-milieu-arc': {
    ref: [c('R', 'O'), c('S', 'O'), l('O', x(0, 1, 1))],
    pts: { Z: x(0, 1, 1) },
    idee: {
      texte: 'Quatre longueurs égales au rayon font un losange. La diagonale d’un losange coupe son angle en deux, donc l’arc aussi.',
      faits: [{ egal: [['O', 'R'], ['R', 'Z'], ['Z', 'S'], ['S', 'O']] }, { anglesEgaux: [['R', 'O', 'Z'], ['Z', 'O', 'S']] }],
    },
  },
  'cercle-centre-b': {
    ref: [c('R', 'S'), c('S', 'R'), l(x('c', 0, 0), x(0, 1, 1)), c('S', x('c', 2, 1)), c(x('c', 2, 1), 'S')],
    pts: { W: x('c', 2, 1) },
    idee: {
      texte: 'Le centre fait un triangle équilatéral avec deux points du cercle séparés d’un sixième de tour, comme dans l’hexagone. Trouve d’abord un tel point, puis deux cercles retrouvent le centre.',
      faits: [{ surCercle: ['W', 'O', 'R'] }, { egal: [['O', 'S'], ['O', 'W'], ['S', 'W']] }],
    },
  },

  // ---------- Chapitre 4 — Sans médiatrice ----------
  'sm-symetrique': {
    ref: [c('A', 'P'), c('B', 'P')],
    pts: { P2: { x: [0, 1], not: 'P' } },
    idee: {
      texte: 'Le symétrique de P est à la même distance que P de chaque point de la droite. Prends deux points de la droite comme centres.',
      faits: [{ egal: [['A', 'P'], ['A', 'P2']] }, { egal: [['B', 'P'], ['B', 'P2']] }, { angleLignes: [['P', 'P2'], 'l', 90] }],
    },
  },
  'sm-perpendiculaire': {
    ref: [c('A', 'P'), c('B', 'P'), l('P', x(0, 1, 0))],
    pts: { P2: x(0, 1, 0) },
    idee: {
      texte: 'La droite qui joint P à son symétrique par rapport à (AB) est perpendiculaire à (AB).',
      faits: [{ egal: [['A', 'P'], ['A', 'P2']] }, { egal: [['B', 'P'], ['B', 'P2']] }, { angleLignes: [2, 'l', 90] }],
    },
  },
  'sm-mediatrice': {
    ref: [c('A', 'B'), c('B', 'A'), l(x(0, 1, 0), x(0, 1, 1))],
    pts: { X: x(0, 1, 0), Y: x(0, 1, 1) },
    idee: {
      texte: 'Reviens à l’idée de départ : il te faut deux points, chacun à la même distance de A et de B.',
      faits: [{ egal: [['A', 'X'], ['B', 'X']] }, { egal: [['A', 'Y'], ['B', 'Y']] }],
    },
  },
  'sm-milieu': {
    ref: [c('A', 'B'), c('B', 'A'), l(x(0, 1, 0), x(0, 1, 1))],
    pts: { X: x(0, 1, 0), Y: x(0, 1, 1), M: x('s', 2, 0) },
    idee: {
      texte: 'Le milieu de [AB] est là où la médiatrice coupe le segment.',
      faits: [{ egal: [['A', 'X'], ['B', 'X']] }, { egal: [['A', 'Y'], ['B', 'Y']] }, { milieu: ['M', 'A', 'B'] }],
    },
  },
  'sm-angle-60': {
    ref: [c('A', 'P'), c('B', 'P'), c(x(0, 1, 0), 'A'), l('P', x(0, 2, 1))],
    pts: { P2: x(0, 1, 0), W: x(0, 2, 1) },
    idee: {
      texte: 'Les angles de 60° viennent des triangles équilatéraux. Le symétrique de P en donne un avec le centre A.',
      faits: [{ egal: [['A', 'P2'], ['A', 'W'], ['P2', 'W']] }, { angle: ['P2', 'A', 'W', 60] }, { angleLignes: [3, 'l', 60] }],
    },
  },
  'sm-angle-30': {
    ref: [l('A', 'B'), c('B', 'A'), c(x(0, 1, 1), 'B'), l('A', x(1, 2, 0))],
    pts: { A2: x(0, 1, 1), Z: x(1, 2, 0) },
    idee: {
      texte: 'Un triangle isocèle avec 120° au sommet a deux angles de 30°. Et 120°, c’est 180° − 60°.',
      faits: [{ egal: [['B', 'A2'], ['B', 'Z'], ['A2', 'Z']] }, { egal: [['B', 'A'], ['B', 'Z']] }, { angle: ['A', 'B', 'Z', 120] }, { angle: ['B', 'A', 'Z', 30] }],
    },
  },
  'sm-thales': {
    ref: [c('A', 'C'), l('A', x('a', 0, 0)), l('C', x(0, 1, 0))],
    pts: { X: x('a', 0, 0), Y: x(0, 1, 0) },
    idee: {
      texte: 'Tout point d’un cercle voit un diamètre de ce cercle sous un angle droit.',
      faits: [{ alignes: ['X', 'A', 'Y'] }, { surCercle: ['C', 'A', 'X'] }, { surCercle: ['Y', 'A', 'X'] }, { droit: ['X', 'C', 'Y'] }],
    },
  },
  'sm-parallele': {
    ref: [c('B', 'C'), c('A', x('c', 0, 0)), l('C', x('c', 0, 0)), l('A', x(1, 2, 1))],
    pts: { X: x('c', 0, 0), Y: x(1, 2, 1) },
    idee: {
      texte: 'Deux triangles isocèles qui se touchent par un sommet ont des angles égaux. Des angles alternes égaux font des droites parallèles.',
      faits: [{ egal: [['B', 'X'], ['B', 'C']] }, { egal: [['A', 'X'], ['A', 'Y']] }, { alignes: ['C', 'X', 'Y'] }, { anglesEgaux: [['A', 'Y', 'X'], ['B', 'C', 'X']] }, { parallele: [3, 'a'] }],
    },
  },
  'sm-angle-75': {
    ref: [c('A', 'B'), c('B', 'A'), l('A', x(0, 1, 1)), l('B', x(0, 2, 0)), l('A', x(1, 3, 1))],
    pts: { C: x(0, 1, 1), D: x(0, 2, 0), E: x(1, 3, 1) },
    idee: {
      texte: 'Dans un triangle isocèle dont l’angle au sommet vaut 30°, les deux autres angles valent 75°. Il te faut donc d’abord un angle de 30°.',
      faits: [{ egal: [['B', 'A'], ['B', 'E']] }, { angle: ['A', 'B', 'E', 30] }, { angle: ['B', 'A', 'E', 75] }],
    },
    pourquoi: [
      { texte: 'ABC est équilatéral : l’angle en A vaut 60°.', faits: [{ egal: [['A', 'B'], ['A', 'C'], ['B', 'C']] }, { angle: ['B', 'A', 'C', 60] }],
        formes: [{ poly: ['A', 'B', 'C'], couleur: 'yellow' }, { angle: ['B', 'A', 'C'], couleur: 'red' }] },
      { texte: 'D est de l’autre côté de A sur le même cercle : AD = AB et l’angle BAD vaut 180° − 60° = 120°. Le triangle ABD est isocèle : ses deux autres angles valent 30°.', faits: [{ egal: [['A', 'B'], ['A', 'D']] }, { angle: ['B', 'A', 'D', 120] }, { angle: ['A', 'B', 'D', 30] }],
        formes: [{ seg: ['A', 'B'], couleur: 'red' }, { seg: ['A', 'D'], couleur: 'red' }, { angle: ['A', 'B', 'D'], couleur: 'blue' }, { angle: ['A', 'D', 'B'], couleur: 'blue' }] },
      { texte: 'E est sur le cercle de centre B : BE = BA. Le triangle ABE est isocèle avec 30° au sommet B : ses deux autres angles valent (180° − 30°) ÷ 2 = 75°.', faits: [{ egal: [['B', 'A'], ['B', 'E']] }, { angle: ['A', 'B', 'E', 30] }, { angle: ['B', 'A', 'E', 75] }, { angle: ['A', 'E', 'B', 75] }],
        formes: [{ seg: ['B', 'A'], couleur: 'blue' }, { seg: ['B', 'E'], couleur: 'blue' }, { angle: ['A', 'B', 'E'], couleur: 'red' }, { angle: ['B', 'A', 'E'], couleur: 'yellow' }, { angle: ['A', 'E', 'B'], couleur: 'yellow' }] },
    ],
  },
  'sm-bissectrice': {
    ref: [c('B', 'C'), c('C', 'B'), c(x('b', 1, 1), 'C'), l('C', x(0, 2, 1))],
    pts: { Z: x('b', 1, 1), W: x(0, 2, 1) },
    idee: {
      texte: 'Avec quatre côtés égaux, on obtient un losange. La diagonale d’un losange coupe son angle en deux.',
      faits: [{ egal: [['C', 'B'], ['B', 'W'], ['W', 'Z'], ['Z', 'C']] }, { alignes: ['C', 'Z', 'A'] }, { anglesEgaux: [['B', 'C', 'W'], ['W', 'C', 'A']] }],
    },
  },

  // ---------- Chapitre 5 — Centres et tangentes ----------
  'ct-centre-circonscrit': {
    ref: [m('A', 'B'), m('A', 'C')],
    pts: { K: x(0, 1, 0) },
    idee: {
      texte: 'Un point de la médiatrice de [AB] est à la même distance de A et de B. Sur deux médiatrices à la fois, il est à la même distance des trois sommets.',
      faits: [{ egal: [['K', 'A'], ['K', 'B'], ['K', 'C']] }],
    },
  },
  'ct-bissectrice': {
    ref: [c('C', 'A'), m('A', x('a', 0, 0))],
    pts: { X: x('a', 0, 0), Q: x(0, 1, 0) },
    idee: {
      texte: 'Prends deux points à la même distance du sommet, un sur chaque côté : leur médiatrice coupe l’angle en deux.',
      faits: [{ egal: [['C', 'A'], ['C', 'X']] }, { alignes: ['C', 'X', 'B'] }, { anglesEgaux: [['A', 'C', 'Q'], ['Q', 'C', 'X']] }],
    },
  },
  'ct-cercle-circonscrit': {
    ref: [m('A', 'B'), m('A', 'C'), c(x(0, 1, 0), 'A')],
    pts: { K: x(0, 1, 0) },
    idee: {
      texte: 'Le centre du cercle est à la même distance des trois sommets : il est sur les médiatrices des côtés.',
      faits: [{ egal: [['K', 'A'], ['K', 'B'], ['K', 'C']] }],
    },
  },
  'ct-centre-gravite': {
    ref: [m('A', 'B'), m('A', 'C'), l('B', x('b', 1, 0)), l('C', x('c', 0, 0))],
    pts: { Mb: x('b', 1, 0), Mc: x('c', 0, 0), G: x(2, 3, 0) },
    idee: {
      texte: 'Une médiane relie un sommet au milieu du côté opposé. La médiatrice d’un côté donne son milieu. Deux médianes suffisent.',
      faits: [{ milieu: ['Mb', 'A', 'C'] }, { milieu: ['Mc', 'A', 'B'] }, { alignes: ['B', 'Mb', 'G'] }, { alignes: ['C', 'Mc', 'G'] }],
    },
  },
  'ct-tangente-en': {
    ref: [c('R', 'O'), m('R', x('c', 0, 1)), m(x('c', 0, 1), x(0, 1, 1))],
    pts: { T: x(0, 2, 0) },
    idee: {
      texte: 'La tangente en R est la droite perpendiculaire au rayon [OR], au point R.',
      faits: [{ surLigne: ['R', 2] }, { droit: ['O', 'R', 'T'] }],
    },
  },
  'ct-tangente-en-b': {
    ref: [c('R', 'O'), l('O', x('c', 0, 0)), c(x('c', 0, 0), 'O'), l('R', x(1, 2, 1))],
    pts: { X: x('c', 0, 0), W: x(1, 2, 1) },
    idee: {
      texte: 'Un point d’un cercle voit un diamètre sous un angle droit. Cherche un cercle qui passe par R et dont un diamètre part de O.',
      faits: [{ alignes: ['O', 'X', 'W'] }, { egal: [['X', 'O'], ['X', 'R'], ['X', 'W']] }, { droit: ['O', 'R', 'W'] }],
    },
  },
  'ct-tangente': {
    ref: [l('O', 'P'), m('O', 'P'), c(x(0, 1, 0), 'O'), l('P', x('c', 2, 0))],
    pts: { M: x(0, 1, 0), T: x('c', 2, 0) },
    idee: {
      texte: 'Une tangente est perpendiculaire au rayon, au point où elle touche le cercle. Les points qui voient [OP] sous un angle droit sont sur le cercle de diamètre [OP].',
      faits: [{ milieu: ['M', 'O', 'P'] }, { surCercle: ['T', 'M', 'O'] }, { surCercle: ['T', 'O', 'R'] }, { droit: ['O', 'T', 'P'] }],
    },
  },
  'ct-orthocentre': {
    ref: [c('B', 'A'), c('C', 'A'), m('A', x('c', 1, 1)), l('A', x(0, 1, 0))],
    pts: { A2: x(0, 1, 0), H: x(2, 3, 0) },
    idee: {
      texte: 'Une hauteur part d’un sommet et tombe à angle droit sur le côté opposé. Deux hauteurs suffisent : la troisième passe aussi par leur croisement.',
      faits: [{ angleLignes: [3, 'a', 90] }, { angleLignes: [2, 'c', 90] }, { surLigne: ['C', 2] }, { angleLignes: [['B', 'H'], 'b', 90] }],
    },
  },
  'ct-centre-inscrit': {
    ref: [m('A', 'B'), c('C', 'B'), m('B', x('b', 1, 1)), c(x(0, 2, 0), 'A')],
    pts: { S: x(0, 2, 0), I: x(2, 3, 1) },
    idee: {
      texte: 'La bissectrice de l’angle C et la médiatrice de [AB] se coupent en un point à la même distance de A, de B et du centre du cercle inscrit.',
      faits: [{ egal: [['S', 'A'], ['S', 'B'], ['S', 'I']] }, { anglesEgaux: [['A', 'C', 'I'], ['I', 'C', 'B']] }, { anglesEgaux: [['C', 'A', 'I'], ['I', 'A', 'B']] }],
    },
  },
  'ct-deux-tangentes': {
    ref: [l('O', 'P'), m('O', 'P'), c(x(0, 1, 0), 'O'), l('P', x('c', 2, 0)), l('P', x('c', 2, 1))],
    pts: { M: x(0, 1, 0), T: x('c', 2, 0), U: x('c', 2, 1) },
    idee: {
      texte: 'Le cercle de diamètre [OP] coupe le cercle donné aux deux points de contact : là, l’angle entre le rayon et la droite issue de P est droit.',
      faits: [{ milieu: ['M', 'O', 'P'] }, { droit: ['O', 'T', 'P'] }, { droit: ['O', 'U', 'P'] }, { surCercle: ['T', 'O', 'R'] }, { surCercle: ['U', 'O', 'R'] }],
    },
  },

  // ---------- Chapitre 6 — Carrés et partages ----------
  'cp-report-b': {
    ref: [l('A', 'B'), c('B', 'A')],
    pts: { C: { x: [0, 1], not: 'A' } },
    idee: {
      texte: 'Le cercle de centre B passant par A contient tous les points à la distance BA de B. Prolonge d’abord le segment.',
      faits: [{ egal: [['B', 'A'], ['B', 'C']] }, { alignes: ['A', 'B', 'C'] }],
    },
  },
  'cp-partage-4': {
    ref: [m('A', 'B'), m('A', x('s', 0, 0)), m('B', x('s', 0, 0))],
    pts: { M: x('s', 0, 0), M1: x('s', 1, 0), M2: x('s', 2, 0) },
    idee: {
      texte: 'Partager en quatre, c’est partager en deux, puis encore en deux.',
      faits: [{ milieu: ['M', 'A', 'B'] }, { milieu: ['M1', 'A', 'M'] }, { milieu: ['M2', 'M', 'B'] }],
    },
  },
  'cp-perpendiculaire': {
    ref: [l('A', 'B'), c('A', 'B'), m('B', x(0, 1, 0))],
    pts: { B2: x(0, 1, 0) },
    idee: {
      texte: 'Si A est le milieu d’un segment de la droite (AB), la médiatrice de ce segment est perpendiculaire en A.',
      faits: [{ milieu: ['A', 'B', 'B2'] }, { surLigne: ['A', 2] }, { angleLignes: [2, 0, 90] }],
    },
  },
  'cp-carre': {
    ref: [c('A', 'B'), c('B', 'A'), m('A', x(0, 1, 0)), c(x(0, 1, 0), x(1, 2, 1))],
    pts: { E: x(0, 1, 0), F: x(1, 2, 1), C: x(1, 3, 1), D: x(0, 3, 0) },
    idee: {
      texte: 'Un angle droit, c’est 60° + 30°. Le triangle équilatéral sur [AB] donne 60°, et couper cet angle en deux donne 30°.',
      faits: [{ egal: [['A', 'B'], ['A', 'E'], ['B', 'E']] }, { angle: ['A', 'B', 'F', 30] }, { egal: [['E', 'F'], ['E', 'C'], ['E', 'D']] }, { angle: ['A', 'B', 'C', 90] }, { angle: ['B', 'A', 'D', 90] }, { egal: [['A', 'B'], ['B', 'C'], ['A', 'D']] }],
    },
  },
  'cp-parallelogramme': {
    ref: [m('A', 'C'), l('B', x('b', 0, 0)), c(x('b', 0, 0), 'B')],
    pts: { M: x('b', 0, 0), D: { x: [1, 2], not: 'B' } },
    idee: {
      texte: 'Les diagonales d’un parallélogramme se coupent en leur milieu. D est donc le symétrique de B par rapport au milieu de [AC].',
      faits: [{ milieu: ['M', 'A', 'C'] }, { milieu: ['M', 'B', 'D'] }],
    },
  },
  'cp-losange': {
    ref: [c('O', 'A'), c('A', 'O'), m('A', x('lb', 0, 1))],
    pts: { A2: x('lb', 0, 1), D: { x: [1, 2], not: 'O' } },
    idee: {
      texte: 'Un losange a quatre côtés égaux. Le dernier sommet est à la distance OA à la fois de A et du sommet posé sur (OB).',
      faits: [{ egal: [['O', 'A'], ['O', 'A2'], ['A', 'D'], ['A2', 'D']] }, { alignes: ['O', 'B', 'A2'] }],
    },
  },
  'cp-partage-3': {
    ref: [c('A', 'B'), m('A', 'B'), m('A', x(0, 1, 0)), m('A', x(1, 2, 0)), m('B', x(1, 2, 0))],
    pts: { E: x(0, 1, 0), G: x(1, 2, 0), P1: x('s', 3, 0), P2: x('s', 4, 0) },
    idee: {
      texte: 'Un triangle avec deux angles de 30° sur [AB] cache en son milieu un triangle équilatéral : les trois morceaux de [AB] sont égaux.',
      faits: [{ angle: ['G', 'A', 'B', 30] }, { angle: ['G', 'B', 'A', 30] }, { egal: [['P1', 'G'], ['P1', 'P2'], ['P2', 'G']] }, { egal: [['A', 'P1'], ['P1', 'P2'], ['P2', 'B']] }],
    },
  },
  'cp-carre-rc': {
    ref: [c('A', 'B'), c('B', 'A'), c(x(0, 1, 0), 'A'), l('B', x(0, 2, 0)), c(x(0, 1, 0), x(1, 3, 1))],
    pts: { E: x(0, 1, 0), X: x(0, 2, 0), Y: x(1, 3, 1), C: x(1, 4, 1), D: x(0, 4, 0) },
    idee: {
      texte: 'Un angle droit, c’est 60° + 30°. Un triangle isocèle avec 120° au sommet donne les 30° qui manquent.',
      faits: [{ egal: [['A', 'B'], ['A', 'X'], ['E', 'X'], ['E', 'A']] }, { angle: ['B', 'A', 'X', 120] }, { angle: ['A', 'B', 'Y', 30] }, { egal: [['E', 'Y'], ['E', 'C'], ['E', 'D']] }, { angle: ['A', 'B', 'C', 90] }, { angle: ['B', 'A', 'D', 90] }],
    },
  },
  'cp-partage-3-b': {
    ref: [c('A', 'O'), l('B', x('la', 0, 1)), c('B', x('la', 0, 1)), l('A', x(1, 2, 0)), c(x('lb', 3, 0), 'B')],
    pts: { X: x('la', 0, 1), Y: x(1, 2, 0), G: x('lb', 3, 0), P1: { x: ['lb', 4], not: 'B' } },
    idee: {
      texte: 'Dans un triangle, deux médianes se coupent aux deux tiers de chacune. Fabrique un triangle dont [OB] est une médiane.',
      faits: [{ milieu: ['A', 'O', 'X'] }, { milieu: ['B', 'X', 'Y'] }, { alignes: ['O', 'G', 'B'] }, { egal: [['O', 'P1'], ['P1', 'G'], ['G', 'B']] }],
    },
  },
};
