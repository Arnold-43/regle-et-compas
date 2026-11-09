/**
 * Garde-fous de contenu des chapitres faits de fiches (chapitres 3 et suivants). Utilisés par
 * `npm run certify` (rapport) et par `npm test` (aucune violation tolérée).
 *
 *  1. jamais deux fois la même cible du catalogue à la suite dans un chapitre ;
 *  2. une même cible ne revient dans un chapitre que si l'autre version apporte autre chose :
 *     d'autres outils, ou un score supérieur d'au moins 1,5 ; et au plus 2 fois ;
 *  3. chaque point de départ visible sert à l'objectif ou à une solution minimale
 *     (vérifié à la certification : une fiche avec un point décoratif est rejetée) ;
 *  4. le défi est le niveau le plus dur de son chapitre (score strictement le plus haut) ;
 *  5. aucun niveau avant ses prérequis (fiche.apres).
 */
import { CHAPITRES, niveauxDe, ORDRE } from '../src/chapters.js';
import { LEVELS } from '../src/levels.js';
import { FICHES } from '../src/fiches.js';
import { CERTIFICATS } from '../src/certificats.js';

export const ECART_SCORE = 1.5;

export function violations() {
  const out = [];
  const fiche = (id) => FICHES.find((f) => f.id === id);
  const niv = (id) => LEVELS.find((l) => l.id === id);
  const score = (id) => CERTIFICATS[id].score;
  const memesOutils = (a, b) => [...niv(a).tools].sort().join() === [...niv(b).tools].sort().join();
  for (const ch of CHAPITRES) {
    const ids = niveauxDe(ch);
    if (!ids.every(fiche)) continue; // chapitres écrits à la main : hors de ces règles
    const cible = (id) => niv(id).objectif.id;
    ids.forEach((id, i) => {
      if (i && cible(id) === cible(ids[i - 1])) out.push(`${ch.titre} : « ${cible(id)} » deux fois de suite (${ids[i - 1]}, ${id})`);
    });
    const parCible = {};
    for (const id of ids) (parCible[cible(id)] = parCible[cible(id)] || []).push(id);
    for (const [c, xs] of Object.entries(parCible)) {
      if (xs.length > 2) out.push(`${ch.titre} : « ${c} » ${xs.length} fois`);
      for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
        const [a, b] = [xs[i], xs[j]];
        if (memesOutils(a, b) && Math.abs(score(a) - score(b)) < ECART_SCORE) {
          out.push(`${ch.titre} : ${a} et ${b} sont la même cible, mêmes outils, scores ${score(a)} et ${score(b)} (écart < ${ECART_SCORE})`);
        }
      }
    }
    if (ch.defi) {
      const plusDur = ch.niveaux.filter((id) => score(id) >= score(ch.defi));
      if (plusDur.length) out.push(`${ch.titre} : le défi ${ch.defi} (${score(ch.defi)}) n'est pas le plus dur (${plusDur.map((id) => `${id} ${score(id)}`).join(', ')})`);
    }
    for (const id of ids) for (const p of fiche(id).apres || []) {
      if (!ORDRE.includes(p)) out.push(`${id} : prérequis inconnu ou rejeté ${p}`);
      else if (ORDRE.indexOf(p) > ORDRE.indexOf(id)) out.push(`${id} arrive avant son prérequis ${p}`);
    }
  }
  for (const f of FICHES) {
    const c = CERTIFICATS[f.id];
    if (c && c.rejet && /point décoratif/.test(c.rejet)) out.push(`${f.id} : ${c.rejet}`);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const v = violations();
  console.log(v.length ? v.join('\n') : 'Garde-fous : aucune violation.');
  process.exitCode = v.length ? 1 : 0;
}
