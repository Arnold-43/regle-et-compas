/**
 * Chapitres : une seule idée par chapitre (voir docs/chapitres.md). Pur : aucune dépendance au DOM.
 *
 * Un chapitre :
 *   id, numero, titre   identifiant stable, numéro affiché, titre
 *   idee                l'idée du chapitre, en une phrase (affichée au joueur)
 *   niveaux             ids des niveaux requis, dans l'ordre
 *   defi                id d'un niveau optionnel, placé en dernier (facultatif)
 *
 * Règles d'ouverture :
 *   - le premier chapitre est toujours ouvert ;
 *   - un chapitre s'ouvre quand tous les niveaux requis du précédent sont réussis (le défi n'est jamais requis) ;
 *   - dans un chapitre, un niveau requis s'ouvre quand le niveau requis qui le précède est réussi ;
 *   - le défi s'ouvre quand tous les niveaux requis de son chapitre sont réussis.
 *
 * Les chapitres 3 et suivants prennent leurs niveaux dans les fiches (src/fiches.js), sans les fiches
 * rejetées à la certification ; un chapitre sans niveau n'est pas affiché. Leur ordre suit les scores
 * certifiés, en dents de scie (voir dentsDeScie) ; le défi reste en dernier.
 * sansMediatrice : le chapitre se joue à la règle et au compas seuls (message dédié sur le bouton).
 *
 * La progression est celle de game.js : {done: {idNiveau: {solved, star, best}}}.
 */
import { FICHES } from './fiches.js';
import { ficheAcceptee } from './levels.js';
import { CERTIFICATS } from './certificats.js';

/**
 * Ordre de jeu « en dents de scie » : du plus facile au plus dur d'après le score, avec une respiration —
 * le deuxième niveau le plus facile est déplacé aux deux tiers du chapitre (à partir de 4 niveaux).
 */
export function dentsDeScie(ids, score) {
  const tri = ids.slice().sort((a, b) => score(a) - score(b) || (a < b ? -1 : 1));
  if (tri.length < 4) return tri;
  const [resp] = tri.splice(1, 1);
  tri.splice(Math.round((2 * (tri.length + 1)) / 3) - 1, 0, resp);
  return tri;
}

const ECRITS = [
  {
    id: 'bases', numero: 1, titre: 'Les bases',
    idee: "Les premières propositions d'Euclide, outil par outil.",
    niveaux: ['I.1', 'I.10', 'I.11', 'I.12', 'I.9', 'I.31'],
  },
  {
    id: 'angles', numero: 2, titre: 'Les angles',
    idee: 'Le triangle équilatéral donne 60° ; couper un angle en deux donne les autres.',
    niveaux: ['angle-60', 'angle-30', 'angle-45'],
    defi: 'angle-15',
  },
];

const PAR_FICHES = [
  { id: 'cercle', numero: 3, titre: 'Le cercle donné', idee: 'Un cercle déjà tracé fait gagner des coups.' },
  { id: 'sans-mediatrice', numero: 4, titre: 'Sans médiatrice', idee: 'Retrouver les constructions avec la règle et le compas seuls.', sansMediatrice: true },
  { id: 'centres', numero: 5, titre: 'Centres et tangentes', idee: 'Les droites remarquables deviennent des outils.' },
  { id: 'carres', numero: 6, titre: 'Carrés et partages', idee: 'Reporter des longueurs pour bâtir et partager.' },
].map((ch) => {
  const fs = FICHES.filter((f) => f.chapitre === ch.id && ficheAcceptee(f));
  const defi = fs.find((f) => f.defi);
  const niveaux = dentsDeScie(fs.filter((f) => !f.defi).map((f) => f.id), (id) => CERTIFICATS[id].score);
  return { ...ch, niveaux, ...(defi ? { defi: defi.id } : {}) };
}).filter((ch) => ch.niveaux.length);

export const CHAPITRES = ECRITS.concat(PAR_FICHES);

/** Tous les niveaux d'un chapitre, défi compris, dans l'ordre d'affichage. */
export const niveauxDe = (ch) => (ch.defi ? ch.niveaux.concat([ch.defi]) : ch.niveaux.slice());
/** Ordre global des niveaux (celui de l'écran des niveaux et du bouton « Niveau suivant »). */
export const ORDRE = CHAPITRES.flatMap(niveauxDe);

export const chapitreDe = (id) => CHAPITRES.find((ch) => niveauxDe(ch).includes(id)) || null;
export const estResolu = (prog, id) => !!(prog.done && prog.done[id] && prog.done[id].solved);
export const estDefi = (id) => CHAPITRES.some((ch) => ch.defi === id);
export const chapitreFini = (prog, ch) => ch.niveaux.every((id) => estResolu(prog, id));

export function chapitreOuvert(prog, ch) {
  const k = CHAPITRES.indexOf(ch);
  return k === 0 || (k > 0 && chapitreFini(prog, CHAPITRES[k - 1]));
}

export function niveauOuvert(prog, id) {
  const ch = chapitreDe(id);
  if (!ch || !chapitreOuvert(prog, ch)) return false;
  if (id === ch.defi) return chapitreFini(prog, ch);
  const k = ch.niveaux.indexOf(id);
  return k === 0 || estResolu(prog, ch.niveaux[k - 1]);
}

/** Niveau à ouvrir au démarrage : le premier niveau requis ouvert et pas encore réussi, sinon le premier. */
export function premierAJouer(prog) {
  for (const id of ORDRE) if (!estDefi(id) && niveauOuvert(prog, id) && !estResolu(prog, id)) return id;
  return ORDRE[0];
}

/** Place d'un niveau dans son chapitre : {chapitre, rang (à partir de 1), total (défi compris)}. */
export function position(id) {
  const ch = chapitreDe(id);
  if (!ch) return null;
  const tous = niveauxDe(ch);
  return { chapitre: ch, rang: tous.indexOf(id) + 1, total: tous.length };
}
