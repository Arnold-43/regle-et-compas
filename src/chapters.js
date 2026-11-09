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
 * rejetées à la certification ; un chapitre sans niveau n'est pas affiché. Leur ordre (voir ordonner) :
 * d'abord les prérequis déclarés (fiche.apres), puis les scores certifiés en dents de scie, en évitant
 * deux fois la même cible à la suite ; le défi reste en dernier.
 *
 * Mises à jour sans perte : un chapitre déjà ouvert sur un téléphone ne se referme jamais quand la
 * liste de ses niveaux change. Il reste ouvert si le chapitre précédent est fini selon sa liste
 * actuelle OU selon une liste publiée auparavant (REQUIS_PUBLIES), ou si un niveau de ce chapitre ou
 * d'un chapitre suivant est déjà réussi.
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
/**
 * Ordre d'un chapitre : on part des dents de scie, puis on place à chaque rang le premier niveau dont
 * les prérequis (dans ce chapitre) sont déjà placés, en évitant si possible une cible déjà vue dans
 * les 3 niveaux précédents (sinon dans le précédent seulement) : les variantes d'un même exercice
 * sont espacées.
 */
export function ordonner(ids, { score, apres = () => [], cible = (id) => id }) {
  const voulu = dentsDeScie(ids, score), out = [];
  while (out.length < ids.length) {
    const libres = voulu.filter((id) => !out.includes(id) && apres(id).every((p) => !ids.includes(p) || out.includes(p)));
    if (!libres.length) throw new Error(`prérequis circulaires entre ${voulu.filter((id) => !out.includes(id)).join(', ')}`);
    const recentes = (n) => out.slice(-n).map(cible);
    out.push(libres.find((id) => !recentes(3).includes(cible(id))) || libres.find((id) => !recentes(1).includes(cible(id))) || libres[0]);
  }
  return out;
}

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
  const requis = fs.filter((f) => !f.defi);
  const niveaux = ordonner(requis.map((f) => f.id), {
    score: (id) => CERTIFICATS[id].score,
    apres: (id) => requis.find((f) => f.id === id).apres || [],
    cible: (id) => requis.find((f) => f.id === id).objectif.id,
  });
  return { ...ch, niveaux, ...(defi ? { defi: defi.id } : {}) };
}).filter((ch) => ch.niveaux.length);

export const CHAPITRES = ECRITS.concat(PAR_FICHES);

/** Niveaux requis de chaque chapitre dans les versions déjà publiées (ne jamais retirer une ligne). */
export const REQUIS_PUBLIES = {
  '0.3.0': {
    cercle: ['cercle-carre-inscrit', 'cercle-equilateral-b', 'cercle-triangle-inscrit', 'cercle-hexagone', 'cercle-equilateral', 'cercle-hexagone-b', 'cercle-mediatrice-b', 'cercle-mediatrice', 'cercle-triangle-inscrit-b', 'cercle-centre', 'cercle-carre'],
    'sans-mediatrice': ['sm-perpendiculaire', 'sm-perpendiculaire-b', 'sm-milieu', 'sm-mediatrice', 'sm-angle-60', 'sm-perpendiculaire-en', 'sm-angle-30', 'sm-parallele', 'sm-parallele-b', 'sm-bissectrice', 'sm-bissectrice-b'],
    centres: ['ct-centre-circonscrit', 'ct-tangente-en', 'ct-bissectrice', 'ct-cercle-circonscrit', 'ct-cercle-circonscrit-b', 'ct-centre-circonscrit-b', 'ct-tangente-en-b', 'ct-tangente', 'ct-tangente-b'],
    carres: ['cp-report-b', 'cp-partage-4', 'cp-perpendiculaire', 'cp-perpendiculaire-b', 'cp-carre', 'cp-parallelogramme', 'cp-report', 'cp-parallelogramme-b', 'cp-carre-b', 'cp-partage-3'],
  },
};

/** Tous les niveaux d'un chapitre, défi compris, dans l'ordre d'affichage. */
export const niveauxDe = (ch) => (ch.defi ? ch.niveaux.concat([ch.defi]) : ch.niveaux.slice());
/** Ordre global des niveaux (celui de l'écran des niveaux et du bouton « Niveau suivant »). */
export const ORDRE = CHAPITRES.flatMap(niveauxDe);

export const chapitreDe = (id) => CHAPITRES.find((ch) => niveauxDe(ch).includes(id)) || null;
export const estResolu = (prog, id) => !!(prog.done && prog.done[id] && prog.done[id].solved);
export const estDefi = (id) => CHAPITRES.some((ch) => ch.defi === id);
export const chapitreFini = (prog, ch) => ch.niveaux.every((id) => estResolu(prog, id));

/** Niveaux actuels et niveaux publiés auparavant d'un chapitre (un niveau retiré reste une preuve d'ouverture). */
const idsConnus = (ch) => niveauxDe(ch).concat(...Object.values(REQUIS_PUBLIES).map((v) => v[ch.id] || []));
/** Le chapitre a été fini selon une liste de niveaux requis publiée auparavant. */
const finiAvant = (prog, ch) => Object.values(REQUIS_PUBLIES).some((v) => v[ch.id] && v[ch.id].every((id) => estResolu(prog, id)));

export function chapitreOuvert(prog, ch) {
  const k = CHAPITRES.indexOf(ch);
  if (k === 0) return true;
  if (k < 0) return false;
  const prec = CHAPITRES[k - 1];
  if (chapitreFini(prog, prec) || finiAvant(prog, prec)) return true;
  // un niveau réussi ici ou plus loin prouve que le chapitre a déjà été ouvert
  return CHAPITRES.slice(k).some((c) => idsConnus(c).some((id) => estResolu(prog, id)));
}

export function niveauOuvert(prog, id) {
  const ch = chapitreDe(id);
  if (!ch || !chapitreOuvert(prog, ch)) return false;
  if (estResolu(prog, id)) return true;
  if (id === ch.defi) return chapitreFini(prog, ch) || finiAvant(prog, ch);
  const k = ch.niveaux.indexOf(id);
  // ouvert si le niveau requis précédent est réussi, ou si un niveau plus loin dans le chapitre l'est déjà
  return k === 0 || estResolu(prog, ch.niveaux[k - 1]) || ch.niveaux.slice(k + 1).some((x) => estResolu(prog, x));
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
