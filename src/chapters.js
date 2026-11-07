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
 * La progression est celle de game.js : {done: {idNiveau: {solved, star, best}}}.
 */
export const CHAPITRES = [
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
