// Vérification exhaustive (lente) : `npm run test:complet`. Lancée en CI dans un job séparé
// (déclenchement manuel, et PR qui touchent aux niveaux). Recalcule tout ce que les certificats affirment.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../../src/levels.js';
import { CERTIFICATS } from '../../src/certificats.js';
import { explore, cadre } from '../../tools/explore.js';
import { minMoves } from '../../tools/solver.js';

for (const lv of LEVELS) {
  test(`${lv.id} : minimum ${lv.par}, solutions et cadre`, () => {
    const c = CERTIFICATS[lv.id], cibleN = { target: (G) => lv.target(G) };
    const rt = explore(lv, [cibleN], { n: lv.par, outils: lv.tools, boite: null }).resultats[0];
    assert.equal(rt.min, lv.par, 'minimum théorique');
    assert.equal(rt.solutions.size, c.nbSolutions, 'nombre de solutions minimales');
    const rc = explore(lv, [cibleN], { n: lv.par, outils: lv.tools, boite: cadre(lv.view) }).resultats[0];
    assert.equal(rc.min, lv.par, 'étoile jouable dans le cadre');
  });
}

// Oracle indépendant (solveur naïf, sans élagage) sur les niveaux courts.
for (const lv of LEVELS.filter((l) => l.par <= 3)) {
  test(`${lv.id} : le solveur naïf confirme le minimum`, () => {
    const r = minMoves(lv, lv.par);
    assert.ok(r && r.depth === lv.par);
    if (lv.par > 1) assert.equal(minMoves(lv, lv.par - 1), null);
  });
}
