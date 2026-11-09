// Garde-fou des niveaux : `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build, verify, hint, solvedIn, refToSpecs, geomOf, isDuplicate } from '../src/engine.js';
import { LEVELS } from '../src/levels.js';
import { CERTIFICATS } from '../src/certificats.js';
import { empreinte } from '../tools/certify.js';

const isSolved = (level, specs) => {
  const b = build(level, level.pts, specs);
  return b.ok && solvedIn(level, level.pts, b) >= 0 && verify(level, specs).ok;
};

function followHints(level, specs) {
  for (let guard = 0; guard < 12 && !isSolved(level, specs); guard++) {
    const h = hint(level, specs);
    if (!h || h.kind !== 'step') break;
    specs.push({ t: h.step.t, a: h.step.a, b: h.step.b });
  }
  return specs;
}

test('les identifiants de niveaux sont uniques', () => {
  const ids = LEVELS.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
});

for (const level of LEVELS) {
  test(`${level.id} ${level.title}`, async (t) => {
    await t.test('chaque solution de référence résout le niveau', () => {
      level.refs.forEach((ref, i) => {
        const specs = refToSpecs(level, ref);
        assert.ok(specs, `référence ${i + 1} : impossible à rejouer`);
        assert.ok(isSolved(level, specs), `référence ${i + 1} : ne résout pas le niveau`);
      });
    });

    await t.test(`certificat à jour (minimum ${level.par})`, () => {
      // Le minimum exact est recalculé par `npm run certify` et revérifié en entier par `npm run test:complet`.
      const c = CERTIFICATS[level.id];
      assert.ok(c, 'pas de certificat : lancer `npm run certify`');
      assert.ok(!c.rejet, `niveau rejeté : ${c.rejet}`);
      assert.equal(c.empreinte, empreinte(level), 'définition modifiée depuis la certification : lancer `npm run certify`');
      assert.equal(c.par, level.par);
      assert.equal(c.minCadre, c.par, 'étoile hors du cadre jouable');
      assert.ok(level.par >= 2 || level.id.startsWith('I.'), 'niveau en un seul coup');
    });

    await t.test('les indices mènent à la solution, au minimum', () => {
      const specs = followHints(level, []);
      assert.ok(isSolved(level, specs));
      assert.equal(specs.length, level.par);
    });

    await t.test('après un détour, les indices ramènent à la solution', () => {
      const b0 = build(level, level.pts, []);
      const ids = b0.points.map((p) => p.id);
      const a = ids[ids.length - 1], b = ids[0];
      const g = geomOf('circle', b0.byId.get(a).p, b0.byId.get(b).p);
      if (isDuplicate(b0, g)) return;
      const specs = followHints(level, [{ t: 'circle', a, b }]);
      assert.ok(isSolved(level, specs));
      assert.ok(specs.length <= level.par + level.extra);
    });
  });
}

test('une figure juste par coïncidence est refusée', () => {
  const base = LEVELS.find((l) => l.id === 'I.12');
  // P à la verticale de A, droite horizontale : la droite PA tombe juste « par hasard »
  const trap = { ...base, pts: { A: [-60, 35], B: [55, 35], P: [-60, -60] } };
  const lucky = [{ t: 'line', a: 'P', b: 'A' }];
  assert.ok(solvedIn(trap, trap.pts, build(trap, trap.pts, lucky)) >= 0);
  assert.equal(verify(trap, lucky).ok, false);
});

test('redessiner un objet donné est un doublon', () => {
  const lv = LEVELS.find((l) => l.id === 'I.11');
  const b = build(lv, lv.pts, []);
  assert.ok(isDuplicate(b, geomOf('line', lv.pts.P, lv.pts.A)));
});

test("l'indice signale une impasse quand les coups manquent", () => {
  const lv = LEVELS[0];
  const junk = [{ t: 'line', a: 'A', b: 'B' }, { t: 'circle', a: 'A', b: 'B' }, { t: 'circle', a: 'B', b: 'A' }];
  const extra = build(lv, lv.pts, junk).points.filter((p) => !p.given);
  const specs = junk.concat([
    { t: 'line', a: extra[0].id, b: extra[1].id },
    { t: 'circle', a: extra[0].id, b: 'A' },
    { t: 'circle', a: extra[1].id, b: 'A' },
  ]);
  const h = hint(lv, specs);
  assert.ok(h && (h.kind === 'stuck' || h.remaining <= 1));
});
