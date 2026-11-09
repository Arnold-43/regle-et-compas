/**
 * Niveaux décrits par une fiche de données. Pur : aucune dépendance au DOM.
 *
 * Une fiche :
 *   id         identifiant stable (clé de la progression enregistrée : ne jamais le changer)
 *   chapitre   id du chapitre (src/chapters.js)
 *   figure     nom d'une figure de départ (FIGURES ci-dessous)
 *   objectif   entrée du catalogue et rôles : {id, args} (src/catalog.js)
 *   outils     'line', 'circle', 'med'
 *   extra      marge de coups au-delà du minimum (3 par défaut)
 *   defi       vrai pour le défi optionnel du chapitre
 *   apres      prérequis : ids des niveaux à jouer avant (l'ordre du chapitre les respecte)
 *
 * Tout le reste est déduit :
 *   - par, refs (solutions minimales, au moins une par variante d'objectif), cadrage, lettres et score
 *     viennent du certificat (src/certificats.js, écrit par `npm run certify`) ;
 *   - titre, consigne, objectif en pointillés et célébration viennent de src/presentation.js.
 * L'ordre de jeu d'un chapitre est calculé d'après les scores (src/chapters.js, dents de scie), défi en dernier.
 */
import { rot } from './engine.js';
import { cible } from './catalog.js';
import { presentation, ghostDe } from './presentation.js';

const c = (O, R) => ({ id: 'c', t: 'circle', a: O, b: R });
const s = (a, b, id = 's') => ({ id, t: 'seg', a, b });
const l = (a, b, id = 'l') => ({ id, t: 'line', a, b });

/** Figures de départ : positions génériques (ni horizontales, ni symétriques). */
export const FIGURES = {
  // cercles (centre O visible, R sur le cercle)
  'cercle-point': { pts: { O: [-30, 20], R: [10, -15], P: [95, 40] }, given: [c('O', 'R')] },
  'cercle-point-b': { pts: { O: [22, -8], R: [-14, -44], P: [-88, 62] }, given: [c('O', 'R')] },
  'cercle-seul': { pts: { O: [-8, 12], R: [38, -22] }, given: [c('O', 'R')] },
  'cercle-seul-b': { pts: { O: [10, -5], R: [-31, -37] }, given: [c('O', 'R')] },
  'cercle-seul-c': { pts: { O: [-6, -4], R: [41, 19] }, given: [c('O', 'R')] },
  // cercle de centre O, et deux points R et S dessus
  'cercle-arc': { pts: { O: [4, 6], R: [-38, -22], S: rot([-38, -22], [4, 6], 104) }, given: [c('O', 'R')] },
  // cercle dont le centre est effacé, deux points dessus
  'cercle-cache': { pts: { O: [6, 8], R: [-40, 30], S: rot([-40, 30], [6, 8], 137) }, hidden: ['O'], given: [c('O', 'R')] },
  'cercle-cache-b': { pts: { O: [-4, -6], R: [38, 28], S: rot([38, 28], [-4, -6], -118) }, hidden: ['O'], given: [c('O', 'R')] },
  // segments
  'segment': { pts: { A: [-52, 28], B: [48, 36] }, given: [s('A', 'B')] },
  'segment-b': { pts: { A: [-46, -8], B: [56, -30] }, given: [s('A', 'B')] },
  'segment-point': { pts: { A: [-50, 30], B: [52, 18], P: [-14, -34] }, given: [s('A', 'B')] },
  // droite et point extérieur
  'droite-point': { pts: { A: [-60, 35], B: [55, 20], P: [-10, -60] }, given: [l('A', 'B')] },
  'droite-point-b': { pts: { A: [-66, -22], B: [62, 6], P: [22, -78] }, given: [l('A', 'B')] },
  // angle de sommet O
  'angle': { pts: { O: [-70, 50], A: [50, 20], B: [0, -70] }, given: [l('O', 'A', 'la'), l('O', 'B', 'lb')] },
  'angle-b': { pts: { O: [64, 58], A: [-62, 36], B: [18, -72] }, given: [l('O', 'A', 'la'), l('O', 'B', 'lb')] },
  // triangles
  'triangle': { pts: { A: [-60, 40], B: [70, 25], C: [-5, -55] }, given: [s('B', 'C', 'a'), s('C', 'A', 'b'), s('A', 'B', 'c')] },
  'triangle-b': { pts: { A: [-72, 28], B: [58, 46], C: [32, -52] }, given: [s('B', 'C', 'a'), s('C', 'A', 'b'), s('A', 'B', 'c')] },
  'triangle-c': { pts: { A: [-82, 26], B: [72, 38], C: [-22, -18] }, given: [s('B', 'C', 'a'), s('C', 'A', 'b'), s('A', 'B', 'c')] },
};

/** Fiches, dans l'ordre de jeu de chaque chapitre (défi en dernier). */
export const FICHES = [
  // Chapitre 3 — Le cercle donné
  { id: 'cercle-mediatrice-b', chapitre: 'cercle', figure: 'cercle-seul-b', objectif: { id: 'mediatrice', args: { s: ['O', 'R'] } }, outils: ['line', 'circle'] },
  { id: 'cercle-equilateral-b', chapitre: 'cercle', figure: 'cercle-seul', objectif: { id: 'triangle-equilateral', args: { s: ['O', 'R'] } }, outils: ['line', 'circle'] },
  { id: 'cercle-hexagone', chapitre: 'cercle', figure: 'cercle-seul-c', objectif: { id: 'hexagone', args: { c: { O: 'O', R: 'R' } } }, outils: ['line', 'circle', 'med'], apres: ['cercle-equilateral-b'] },
  { id: 'cercle-triangle-inscrit', chapitre: 'cercle', figure: 'cercle-seul', objectif: { id: 'triangle-inscrit', args: { c: { O: 'O', R: 'R' } } }, outils: ['line', 'circle', 'med'], apres: ['cercle-hexagone'] },
  { id: 'cercle-carre-inscrit', chapitre: 'cercle', figure: 'cercle-seul-b', objectif: { id: 'carre-inscrit', args: { c: { O: 'O', R: 'R' } } }, outils: ['line', 'circle', 'med'], apres: ['cercle-mediatrice-b'] },
  { id: 'cercle-hexagone-b', chapitre: 'cercle', figure: 'cercle-seul-b', objectif: { id: 'hexagone', args: { c: { O: 'O', R: 'R' } } }, outils: ['line', 'circle'], apres: ['cercle-hexagone'] },
  { id: 'cercle-milieu-arc', chapitre: 'cercle', figure: 'cercle-arc', objectif: { id: 'milieu-arc', args: { c: { O: 'O', R: 'R' }, S: 'S' } }, outils: ['line', 'circle', 'med'], apres: ['cercle-mediatrice-b'] },
  { id: 'cercle-centre', chapitre: 'cercle', figure: 'cercle-cache', objectif: { id: 'centre', args: { c: { O: 'O', R: 'R' } } }, outils: ['line', 'circle', 'med'], apres: ['cercle-mediatrice-b'] },
  { id: 'cercle-carre', chapitre: 'cercle', figure: 'cercle-seul-c', objectif: { id: 'carre', args: { s: ['O', 'R'] } }, outils: ['line', 'circle', 'med'], apres: ['cercle-carre-inscrit'] },
  { id: 'cercle-triangle-inscrit-b', chapitre: 'cercle', figure: 'cercle-seul-c', objectif: { id: 'triangle-inscrit', args: { c: { O: 'O', R: 'R' } } }, outils: ['line', 'circle'], apres: ['cercle-triangle-inscrit'] },
  { id: 'cercle-centre-b', chapitre: 'cercle', figure: 'cercle-cache-b', objectif: { id: 'centre', args: { c: { O: 'O', R: 'R' } } }, outils: ['line', 'circle'], defi: true },
  // Chapitre 4 — Sans médiatrice (règle et compas seuls)
  { id: 'sm-symetrique', chapitre: 'sans-mediatrice', figure: 'droite-point', objectif: { id: 'symetrique', args: { d: ['A', 'B'], P: 'P' } }, outils: ['line', 'circle'] },
  { id: 'sm-perpendiculaire', chapitre: 'sans-mediatrice', figure: 'droite-point', objectif: { id: 'perpendiculaire-depuis-un-point', args: { d: ['A', 'B'], P: 'P' } }, outils: ['line', 'circle'], apres: ['sm-symetrique'] },
  { id: 'sm-mediatrice', chapitre: 'sans-mediatrice', figure: 'segment-b', objectif: { id: 'mediatrice', args: { s: ['A', 'B'] } }, outils: ['line', 'circle'] },
  { id: 'sm-milieu', chapitre: 'sans-mediatrice', figure: 'segment', objectif: { id: 'milieu', args: { s: ['A', 'B'] } }, outils: ['line', 'circle'], apres: ['sm-mediatrice'] },
  { id: 'sm-angle-60', chapitre: 'sans-mediatrice', figure: 'droite-point', objectif: { id: 'angle-60', args: { d: ['A', 'B'], P: 'P' } }, outils: ['line', 'circle'] },
  { id: 'sm-angle-30', chapitre: 'sans-mediatrice', figure: 'segment-b', objectif: { id: 'angle-30', args: { d: ['A', 'B'], P: 'A' } }, outils: ['line', 'circle'] },
  { id: 'sm-thales', chapitre: 'sans-mediatrice', figure: 'triangle', objectif: { id: 'perpendiculaire-en-un-point', args: { d: ['B', 'C'], P: 'C' } }, outils: ['line', 'circle'], apres: ['sm-perpendiculaire'] },
  { id: 'sm-parallele', chapitre: 'sans-mediatrice', figure: 'triangle-b', objectif: { id: 'parallele', args: { d: ['B', 'C'], P: 'A' } }, outils: ['line', 'circle'], apres: ['sm-perpendiculaire'] },
  { id: 'sm-angle-75', chapitre: 'sans-mediatrice', figure: 'segment', objectif: { id: 'angle-75', args: { d: ['A', 'B'], P: 'A' } }, outils: ['line', 'circle'], apres: ['sm-angle-30'] },
  { id: 'sm-bissectrice', chapitre: 'sans-mediatrice', figure: 'triangle', objectif: { id: 'bissectrice', args: { a: { O: 'C', A: 'A', B: 'B' } } }, outils: ['line', 'circle'], apres: ['sm-mediatrice'], defi: true },
  // Chapitre 5 — Centres et tangentes
  { id: 'ct-centre-circonscrit', chapitre: 'centres', figure: 'triangle', objectif: { id: 'centre-circonscrit', args: { t: ['A', 'B', 'C'] } }, outils: ['line', 'circle', 'med'] },
  { id: 'ct-tangente-en', chapitre: 'centres', figure: 'cercle-seul', objectif: { id: 'tangente-en-un-point', args: { c: { O: 'O', R: 'R' } } }, outils: ['line', 'circle', 'med'] },
  { id: 'ct-bissectrice', chapitre: 'centres', figure: 'triangle-c', objectif: { id: 'bissectrice', args: { a: { O: 'C', A: 'A', B: 'B' } } }, outils: ['line', 'circle', 'med'] },
  { id: 'ct-centre-gravite', chapitre: 'centres', figure: 'triangle-b', objectif: { id: 'centre-gravite', args: { t: ['A', 'B', 'C'] } }, outils: ['line', 'circle', 'med'] },
  { id: 'ct-cercle-circonscrit', chapitre: 'centres', figure: 'triangle-b', objectif: { id: 'cercle-circonscrit', args: { t: ['A', 'B', 'C'] } }, outils: ['line', 'circle', 'med'], apres: ['ct-centre-circonscrit'] },
  { id: 'ct-orthocentre', chapitre: 'centres', figure: 'triangle-c', objectif: { id: 'orthocentre', args: { t: ['A', 'B', 'C'] } }, outils: ['line', 'circle', 'med'] },
  { id: 'ct-tangente-en-b', chapitre: 'centres', figure: 'cercle-seul-c', objectif: { id: 'tangente-en-un-point', args: { c: { O: 'O', R: 'R' } } }, outils: ['line', 'circle'], apres: ['ct-tangente-en'] },
  { id: 'ct-tangente', chapitre: 'centres', figure: 'cercle-point', objectif: { id: 'tangente', args: { c: { O: 'O', R: 'R' }, P: 'P' } }, outils: ['line', 'circle', 'med'], apres: ['ct-tangente-en'] },
  { id: 'ct-centre-inscrit', chapitre: 'centres', figure: 'triangle', objectif: { id: 'centre-inscrit', args: { t: ['A', 'B', 'C'] } }, outils: ['line', 'circle', 'med'], apres: ['ct-bissectrice'] },
  { id: 'ct-deux-tangentes', chapitre: 'centres', figure: 'cercle-point-b', objectif: { id: 'deux-tangentes', args: { c: { O: 'O', R: 'R' }, P: 'P' } }, outils: ['line', 'circle', 'med'], apres: ['ct-tangente'], defi: true },
  // Chapitre 6 — Carrés et partages
  { id: 'cp-report-b', chapitre: 'carres', figure: 'segment-b', objectif: { id: 'report', args: { s: ['A', 'B'] } }, outils: ['line', 'circle'] },
  { id: 'cp-partage-4', chapitre: 'carres', figure: 'segment-b', objectif: { id: 'partage-en-4', args: { s: ['A', 'B'] } }, outils: ['line', 'circle', 'med'] },
  { id: 'cp-perpendiculaire', chapitre: 'carres', figure: 'segment', objectif: { id: 'perpendiculaire-en-un-point', args: { d: ['A', 'B'], P: 'A' } }, outils: ['line', 'circle', 'med'] },
  { id: 'cp-carre', chapitre: 'carres', figure: 'segment', objectif: { id: 'carre', args: { s: ['A', 'B'] } }, outils: ['line', 'circle', 'med'], apres: ['cp-perpendiculaire'] },
  { id: 'cp-carre-rc', chapitre: 'carres', figure: 'segment-b', objectif: { id: 'carre', args: { s: ['A', 'B'] } }, outils: ['line', 'circle'], apres: ['cp-carre'] },
  { id: 'cp-parallelogramme', chapitre: 'carres', figure: 'triangle', objectif: { id: 'parallelogramme', args: { t: ['A', 'B', 'C'] } }, outils: ['line', 'circle', 'med'] },
  { id: 'cp-losange', chapitre: 'carres', figure: 'angle', objectif: { id: 'losange', args: { a: { O: 'O', A: 'A', B: 'B' } } }, outils: ['line', 'circle', 'med'], apres: ['cp-parallelogramme'] },
  { id: 'cp-partage-3', chapitre: 'carres', figure: 'segment', objectif: { id: 'partage-en-3', args: { s: ['A', 'B'] } }, outils: ['line', 'circle', 'med'], apres: ['cp-partage-4'] },
  { id: 'cp-partage-3-b', chapitre: 'carres', figure: 'angle', objectif: { id: 'partage-en-3', args: { s: ['O', 'B'] } }, outils: ['line', 'circle'], apres: ['cp-partage-3'], defi: true },
];

/** Construit le niveau d'une fiche. Sans certificat, le niveau n'a ni par, ni refs, ni cadrage (certification en cours). */
export function depuisFiche(f, cert) {
  const fig = FIGURES[f.figure];
  if (!fig) throw new Error(`${f.id} : figure inconnue ${f.figure}`);
  const pr = presentation(f.objectif.id), b = f.objectif.args;
  return {
    id: f.id, chapitre: f.chapitre, defi: !!f.defi,
    title: pr.titre(b), goal: pr.consigne(b, fig),
    tools: f.outils, extra: f.extra ?? 3,
    pts: fig.pts, given: fig.given, hidden: fig.hidden,
    objectif: f.objectif,
    par: cert ? cert.par : undefined,
    refs: cert ? cert.refs : [],
    view: cert ? cert.view : fig.view,
    lab: cert ? cert.lab : {},
    target(G) { return cible(this.objectif, G); },
    ghost(G) { return ghostDe(this.target(G), cert ? cert.ghostAlt || 0 : 0, pr, G, b); },
    celebrate(G, alt) { return pr.celebrer(G, b, alt, this.target(G)); },
  };
}
