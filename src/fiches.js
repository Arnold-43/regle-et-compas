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
 *
 * Tout le reste est déduit :
 *   - par, refs (solutions minimales, au moins une par variante d'objectif), cadrage, lettres et score
 *     viennent du certificat (src/certificats.js, écrit par `npm run certify`) ;
 *   - titre, consigne, objectif en pointillés et célébration viennent de src/presentation.js.
 * L'ordre des fiches d'un chapitre est l'ordre de jeu (défi en dernier).
 */
import { rot } from './engine.js';
import { cible } from './catalog.js';
import { presentation, ghostDe } from './presentation.js';

const c = (O, R) => ({ id: 'c', t: 'circle', a: O, b: R });
const s = (a, b, id = 's') => ({ id, t: 'seg', a, b });
const l = (a, b, id = 'l') => ({ id, t: 'line', a, b });

/** Figures de départ : positions génériques (ni horizontales, ni symétriques). */
export const FIGURES = {
  // cercle de centre O passant par R, et un point P extérieur
  'cercle-point': { pts: { O: [-30, 20], R: [10, -15], P: [95, 40] }, given: [c('O', 'R')] },
};

/** Fiches, dans l'ordre de jeu de chaque chapitre. */
export const FICHES = [
  // Chapitre 3 — Le cercle donné
  { id: 'cercle-mediatrice', chapitre: 'cercle', figure: 'cercle-point', objectif: { id: 'mediatrice', args: { s: ['O', 'R'] } }, outils: ['line', 'circle'] },
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
    ghost(G) { return ghostDe(this.target(G), cert ? cert.ghostAlt || 0 : 0); },
    celebrate(G, alt) { return pr.celebrer(G, b, alt, this.target(G)); },
  };
}
