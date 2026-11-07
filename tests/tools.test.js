// Garde-fou de l'outillage (exploration, mesures, générateur) : `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build, solvedIn, verify, rng } from '../src/engine.js';
import { NIVEAUX_ECRITS as LEVELS } from '../src/levels.js'; // échantillon fixe : les 10 niveaux écrits à la main
import { candidateMoves, signature as sigSolveur } from '../tools/solver.js';
import { racine, etend, coups, explore } from '../tools/explore.js';
import { mesureNiveau } from '../tools/metrics.js';

test('la construction incrémentale donne les mêmes points (ids et positions) que engine.build', () => {
  const rand = rng(3);
  for (const lv of LEVELS) {
    for (let essai = 0; essai < 5; essai++) {
      let st = racine(lv);
      for (let k = 0; k < 4; k++) {
        const cs = coups(st, lv.tools, null);
        const c = cs[Math.floor(rand() * cs.length)];
        st = etend(st, c.spec, c.g, c.cle);
        const b = build(lv, lv.pts, st.specs);
        assert.deepEqual(st.points.map((q) => [q.id, q.p]), b.points.map((q) => [q.id, q.p]));
      }
    }
  }
});

/** Solutions minimales par force brute : toutes les suites de coups, sans élagage. */
function forceBrute(lv) {
  const sols = new Set();
  const rec = (specs) => {
    const b = build(lv, lv.pts, specs);
    if (specs.length === lv.par) {
      if (solvedIn(lv, lv.pts, b) >= 0 && verify(lv, specs).ok) sols.add(sigSolveur(b));
      return;
    }
    for (const m of candidateMoves(b, lv.tools)) rec(specs.concat([{ t: m.t, a: m.a, b: m.b }]));
  };
  rec([]);
  return sols.size;
}

for (const lv of LEVELS) {
  test(`mesures de ${lv.id} : minimum et nombre de solutions exacts`, () => {
    const r = explore(lv, [{ target: (G) => lv.target(G) }], { n: lv.par, outils: lv.tools });
    assert.equal(r.resultats[0].min, lv.par);
    assert.equal(r.resultats[0].solutions.size, forceBrute(lv));
    const m = mesureNiveau(lv);
    assert.equal(m.minTheorique, lv.par);
    assert.ok(m.premier > 0 && m.premier <= 1 && m.goulot > 0 && m.goulot <= m.moyenne);
    assert.ok(Number.isFinite(m.score));
  });
}

test('I.10 : mesures connues (3 coups, 1 solution, 2 bons premiers coups sur 3, aucun point auxiliaire)', () => {
  const m = mesureNiveau(LEVELS.find((l) => l.id === 'I.10'));
  assert.equal(m.min, 3);
  assert.equal(m.nbSolutions, 1);
  assert.ok(Math.abs(m.premier - 2 / 3) < 1e-9);
  assert.equal(m.auxMin, 0);
});

test('générateur, test de fumée : segment seul en 2 coups', async () => {
  const { genere, resume } = await import('../tools/generate.js');
  const r = genere('segment', { n: 2 });
  const par = (id) => r.candidats.find((c) => c.cible === id);
  assert.equal(par('mediatrice').min, 1);
  assert.equal(par('milieu').min, 1); // la médiatrice coupe le segment donné en son milieu
  assert.ok(par('milieu').goulotLibre < 1); // créer un point cible n'est pas guidé
  assert.equal(par('triangle-equilateral').min, Infinity);
  assert.ok(resume(r).includes('médiatrice de [AB]'));
  JSON.stringify(r);
});

test('coups guidés : les deux côtés du triangle équilatéral (I.1) ne comptent pas dans le goulot libre', () => {
  const m = mesureNiveau(LEVELS.find((l) => l.id === 'I.1'));
  assert.deepEqual(m.partLibre.slice(2), [null, null]);
  assert.ok(m.goulotLibre > m.goulot);
});

test("budget de temps : l'exploration s'arrête sans rendre de résultat partiel", () => {
  const lv = LEVELS.find((l) => l.id === 'I.31');
  assert.throws(() => explore(lv, [{ target: (G) => lv.target(G) }], { n: 4, outils: lv.tools, limiteMs: 0 }), (e) => e.interrompu === true);
});

test('points cibles visés : le dernier coup du milieu ne se cherche que parmi les tracés qui passent par lui', async () => {
  const { genere } = await import('../tools/generate.js');
  const r = genere('segment', { n: 3, outils: ['line', 'circle'] });
  const m = r.candidats.find((c) => c.cible === 'milieu');
  assert.equal(m.min, 3);
  assert.ok(m.partLibre[2] > m.partEtape[2]); // dernier coup : la visée réduit le choix
});
