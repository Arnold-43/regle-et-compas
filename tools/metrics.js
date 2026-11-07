/**
 * Mesures de difficulté d'un niveau (outil de développement, tourne sous Node).
 *
 *   node tools/metrics.js          → tableau des mesures des niveaux du jeu
 *
 * Définitions (toutes exactes, calculées par exploration exhaustive, voir tools/explore.js) :
 *   min          minimum de coups, appuis pris dans le cadre jouable (zoom arrière maximal).
 *   minTheorique minimum sans cadre : c'est le `par` d'un niveau. S'il diffère de min,
 *                l'étoile n'est pas jouable sur téléphone.
 *   nbSolutions  nombre d'ensembles d'objets distincts de min coups qui résolvent le niveau
 *                (l'ordre des coups n'est pas compté).
 *   bonsCoups    à chaque étape k (0 … min-1), on considère les « bons états » : ensembles
 *                d'objets de k coups inclus dans au moins une solution minimale. Depuis chacun,
 *                part de bons coups = coups qui gardent l'ensemble tracé inclus dans une solution
 *                minimale / tous les coups possibles (distincts, dans le cadre).
 *                partEtape[k] = moyenne de cette part sur les bons états de l'étape k.
 *                  premier = partEtape[0], moyenne = moyenne des partEtape, goulot = min des partEtape.
 *   aux          points auxiliaires d'une solution : points construits (non donnés) servant d'appui
 *                à un tracé, qui ne sont ni un point cible ni sur une droite ou un cercle cible.
 *                auxMin / auxMax sur l'ensemble des solutions minimales.
 *   score        provisoire, voir POIDS ci-dessous.
 */
import { build, solvedIn, onLine, onCircle, near } from '../src/engine.js';
import { explore, racine, coups, etend, signature, cadre } from './explore.js';

/**
 * Score de difficulté provisoire (à recaler sur des données de jeu réelles) :
 *   score = coups·min + aux·auxMin + goulot·(−log2 goulot) − solutions·log2(nbSolutions)
 *  - chaque coup du minimum compte pour 1 ;
 *  - un point auxiliaire est une idée à trouver ;
 *  - le goulot en bits : une étape où un coup sur 2 est bon coûte 1, un sur 8 coûte 3 ;
 *  - chaque doublement du nombre de solutions minimales rend le niveau un peu plus facile.
 */
export const POIDS = { coups: 1, aux: 0.75, goulot: 1, solutions: 0.5 };

export function score(m) {
  if (!Number.isFinite(m.min) || m.min === 0) return null;
  return POIDS.coups * m.min + POIDS.aux * m.auxMin + POIDS.goulot * -Math.log2(m.goulot)
    - POIDS.solutions * Math.log2(m.nbSolutions);
}

const surCible = (p, alt) => alt.some((el) =>
  el.k === 'point' ? near(el.p, p) : el.k === 'line' ? onLine(el, p) : onCircle(el, p));

/** Points auxiliaires d'une solution (specs) pour le niveau lv. */
export function auxiliaires(lv, specs) {
  const b = build(lv, lv.pts, specs);
  const alt = lv.target(lv.pts)[solvedIn(lv, lv.pts, b)];
  const aux = new Set();
  for (const s of specs) for (const id of [s.a, s.b]) {
    const q = b.byId.get(id);
    if (!q.given && !surCible(q.p, alt)) aux.add(id);
  }
  return aux.size;
}

/** Part de bons coups à chaque étape, à partir des solutions minimales connues. */
export function bonsCoups(fig, solutions, min, outils, boite) {
  const ensembles = [...solutions.keys()].map((sig) => new Set(sig.split('|')));
  const inclus = (cles) => ensembles.some((E) => cles.every((k) => E.has(k)));
  let etage = [racine(fig)];
  const partEtape = [];
  for (let k = 0; k < min; k++) {
    let somme = 0;
    const suivant = new Map();
    for (const st of etage) {
      const cs = coups(st, outils, boite);
      let bons = 0;
      for (const c of cs) {
        if (!inclus(st.cles.concat([c.cle]))) continue;
        bons++;
        const e = etend(st, c.spec, c.g, c.cle);
        suivant.set(signature(e), e);
      }
      somme += cs.length ? bons / cs.length : 0;
    }
    partEtape.push(somme / etage.length);
    etage = [...suivant.values()];
  }
  return {
    partEtape,
    premier: partEtape[0],
    moyenne: partEtape.reduce((a, b) => a + b, 0) / partEtape.length,
    goulot: Math.min(...partEtape),
  };
}

/**
 * Mesures complètes à partir des résultats d'exploration (cadrée et sans cadre) d'une cible.
 * @param fig   figure {pts, given, hidden?}
 * @param cible {target(G)}
 * @param rc    résultat cadré {min, solutions}
 * @param rt    résultat sans cadre {min, solutions} (pour minTheorique)
 */
export function mesuresDe(fig, cible, rc, rt, outils, boite) {
  const m = { min: rc.min, minTheorique: rt ? rt.min : rc.min, nbSolutions: rc.solutions.size };
  if (Number.isFinite(rc.min) && rc.min > 0) {
    const lv = { ...fig, target: cible.target };
    Object.assign(m, bonsCoups(fig, rc.solutions, rc.min, outils, boite));
    const aux = [...rc.solutions.values()].map((s) => auxiliaires(lv, s));
    m.auxMin = Math.min(...aux);
    m.auxMax = Math.max(...aux);
    m.exemple = [...rc.solutions.values()].sort((a, b) => auxiliaires(lv, a) - auxiliaires(lv, b))[0];
  }
  m.cadreDiffere = m.min !== m.minTheorique;
  m.score = score(m);
  return m;
}

/** Mesures d'un niveau du jeu (cible = level.target, outils = level.tools, cadre = level.view). */
export function mesureNiveau(level, n = Math.max(level.par, 1)) {
  const cibleN = { target: (G) => level.target(G) };
  const boite = cadre(level.view);
  const rc = explore(level, [cibleN], { n, outils: level.tools, boite });
  const rt = explore(level, [cibleN], { n, outils: level.tools, boite: null });
  return mesuresDe(level, cibleN, rc.resultats[0], rt.resultats[0], level.tools, boite);
}

const pc = (x) => (x === undefined ? '—' : `${Math.round(x * 100)} %`);
export const fmt = (x, d = 2) => (x === null || x === undefined ? '—' : Number.isFinite(x) ? x.toFixed(d).replace(/\.?0+$/, '') : '>N');
export { pc };

// ---------- ligne de commande ----------
if (import.meta.url === `file://${process.argv[1]}`) {
  const { LEVELS } = await import('../src/levels.js');
  console.log('Niveau  par  min  sol  1er coup  moyenne  goulot  aux    score');
  for (const lv of LEVELS) {
    const t0 = Date.now();
    const m = mesureNiveau(lv);
    console.log(
      `${lv.id.padEnd(6)}  ${String(lv.par).padStart(3)}  ${fmt(m.min).padStart(3)}  ${String(m.nbSolutions).padStart(3)}` +
      `  ${pc(m.premier).padStart(8)}  ${pc(m.moyenne).padStart(7)}  ${pc(m.goulot).padStart(6)}` +
      `  ${`${m.auxMin}–${m.auxMax}`.padEnd(5)}  ${fmt(m.score).padStart(5)}` +
      `${m.cadreDiffere ? '  ⚠ minimum hors cadre ' + m.minTheorique : ''}  (${Date.now() - t0} ms)`,
    );
  }
}
