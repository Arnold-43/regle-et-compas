/**
 * Générateur de candidats de niveaux (outil de développement, tourne sous Node).
 *
 *   node tools/generate.js <figure|toutes> [--n 4] [--outils line,circle,med]
 *
 * Depuis une figure de départ (tools/figures.js), explore toutes les constructions jusqu'à N coups
 * et liste chaque figure du catalogue (src/catalog.js) atteignable, avec ses mesures (tools/metrics.js).
 * Deux explorations : dans le cadre jouable (zoom arrière maximal du jeu) et sans cadre.
 * Les candidats dont les deux minimums diffèrent sont signalés : leur étoile serait injouable sur téléphone.
 * Sortie : tools/out/<figure>-n<N>.json (non versionné) + résumé trié par score dans le terminal.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { explore, cadre } from './explore.js';
import { mesuresDe, fmt, pc } from './metrics.js';
import { FIGURES, instances } from './figures.js';

const NOMS = { line: 'droite', circle: 'cercle', med: 'médiatrice' };
/** Description lisible d'une construction : « 1. cercle A→B  2. … », ∩2.3a = intersection des tracés 2 et 3. */
export function decrire(specs) {
  const nomObj = (id) => (id.startsWith('o') ? String(Number(id.slice(1)) + 1) : id);
  const nomPt = (id) => {
    const m = /^x:([^:]+):([^:]+):(\d)$/.exec(id);
    return m ? `∩${nomObj(m[1])}.${nomObj(m[2])}${'ab'[Number(m[3])]}` : id;
  };
  return specs.map((s, i) => `${i + 1}. ${NOMS[s.t]} ${nomPt(s.a)}${s.t === 'circle' ? '→' : ','}${nomPt(s.b)}`).join('  ');
}

/** Lance le générateur sur une figure ; renvoie {figure, n, outils, temps, candidats}. */
export function genere(nomFigure, { n = 4, outils } = {}) {
  const fig = FIGURES[nomFigure];
  if (!fig) throw new Error(`figure inconnue : ${nomFigure} (connues : ${Object.keys(FIGURES).join(', ')})`);
  outils = outils || fig.outils || ['line', 'circle', 'med'];
  const inst = instances(fig);
  const boite = cadre(fig.view);
  const ec = explore(fig, inst, { n, outils, boite });
  const et = explore(fig, inst, { n, outils, boite: null });
  const candidats = inst.map((c, i) => {
    const m = mesuresDe(fig, c, ec.resultats[i], et.resultats[i], outils, boite);
    return {
      cible: c.entree, nom: c.nom, libelle: c.libelle, args: c.args, ...m,
      solution: m.exemple ? decrire(m.exemple) : null,
    };
  });
  return {
    figure: nomFigure, nomFigure: fig.nom, n, outils,
    temps: { cadreMs: ec.ms, sansCadreMs: et.ms, etatsCadre: ec.etats, etatsSansCadre: et.etats },
    candidats,
  };
}

export function resume(r) {
  const lignes = [`\n${r.nomFigure} (${r.figure}) — N=${r.n}, outils ${r.outils.join(', ')}` +
    ` — ${r.temps.etatsCadre} états en ${(r.temps.cadreMs / 1000).toFixed(1)} s (cadre), ` +
    `${r.temps.etatsSansCadre} en ${(r.temps.sansCadreMs / 1000).toFixed(1)} s (sans cadre)`];
  const ok = r.candidats.filter((c) => c.score !== null).sort((a, b) => a.score - b.score);
  lignes.push('score  min  sol  1er   moy   goulot  aux  cible');
  for (const c of ok) {
    lignes.push(`${fmt(c.score).padStart(5)}  ${String(c.min).padStart(3)}  ${String(c.nbSolutions).padStart(3)}` +
      `  ${pc(c.premier).padStart(4)}  ${pc(c.moyenne).padStart(4)}  ${pc(c.goulot).padStart(6)}  ${`${c.auxMin}–${c.auxMax}`.padEnd(3)}  ${c.libelle}` +
      `${c.cadreDiffere ? `  ⚠ hors cadre : minimum théorique ${c.minTheorique}` : ''}`);
  }
  const hors = r.candidats.filter((c) => c.score === null);
  const deja = hors.filter((c) => c.min === 0), loin = hors.filter((c) => c.min !== 0);
  if (loin.length) {
    lignes.push(`Non atteintes en ${r.n} coups dans le cadre : ` + loin.map((c) =>
      c.libelle + (Number.isFinite(c.minTheorique) ? ` (sans cadre : ${c.minTheorique})` : '')).join(' ; '));
  }
  if (deja.length) lignes.push('Déjà présentes au départ : ' + deja.map((c) => c.libelle).join(' ; '));
  return lignes.join('\n');
}

// ---------- ligne de commande ----------
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : d; };
  const n = Number(opt('--n', 4));
  const outils = opt('--outils', null)?.split(',');
  const quoi = argv[0] || 'toutes';
  const noms = quoi === 'toutes' ? Object.keys(FIGURES) : [quoi];
  const dir = new URL('./out/', import.meta.url);
  mkdirSync(dir, { recursive: true });
  for (const nom of noms) {
    const r = genere(nom, { n, outils });
    const f = new URL(`${nom}-n${n}${outils ? '-' + outils.join('+') : ''}.json`, dir);
    writeFileSync(f, JSON.stringify(r, (k, v) => (v === Infinity ? null : v), 2));
    console.log(resume(r));
    console.log(`→ ${f.pathname}`);
  }
}
