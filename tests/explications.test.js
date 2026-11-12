// Idées et explications : chaque fait est vérifié numériquement. `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels.js';
import { EXPLICATIONS } from '../src/explications.js';
import { figureExplication, verifieFait } from '../src/faits.js';
import { problemes, tousLesFaits, figuresDeControle } from '../tools/idees.js';
import { scaleOf } from '../src/engine.js';

for (const lv of LEVELS) {
  const ex = EXPLICATIONS[lv.id];
  if (!ex) continue;
  test(`${lv.id} : idée et explication justes`, () => {
    assert.deepEqual(problemes(lv, ex), []);
  });
}

test('une idée fausse ne passe pas : chaque fait faussé est détecté', () => {
  let n = 0;
  for (const lv of LEVELS) {
    const ex = EXPLICATIONS[lv.id];
    if (!ex) continue;
    const G = figuresDeControle(lv, ex.ref)[0], fig = figureExplication(lv, G, ex), e = scaleOf(G);
    for (const { f } of tousLesFaits(ex)) {
      const [type] = Object.keys(f), v = f[type];
      let faux = null;
      if (type === 'angle') faux = { angle: [...v.slice(0, 3), v[3] + 3] };
      else if (type === 'angleLignes') faux = { angleLignes: [v[0], v[1], v[2] === 90 ? 87 : v[2] + 3] };
      else if (type === 'egal') faux = { egal: [...v, [v[0][0], v[0][0] === v[1][1] ? v[1][0] : v[1][1]]] };
      if (!faux) continue;
      const r = verifieFait(faux, fig, e);
      if (faux.egal && r.ok) continue; // segment ajouté par hasard de même longueur : pas une erreur
      assert.equal(r.ok, false, `${lv.id} : « ${JSON.stringify(faux)} » devrait être faux`);
      n++;
    }
  }
  assert.ok(n >= 40, `trop peu de faits faussés testés (${n})`);
});

test('chaque niveau a une idée', () => {
  const sans = LEVELS.filter((l) => !(EXPLICATIONS[l.id] && EXPLICATIONS[l.id].idee)).map((l) => l.id);
  assert.deepEqual(sans, []);
});

test('une idée ne nomme que des points visibles du niveau, et pas d’outil', () => {
  for (const lv of LEVELS) {
    const ex = EXPLICATIONS[lv.id];
    if (!ex || !ex.idee) continue;
    const visibles = Object.keys(lv.pts).filter((k) => !(lv.hidden || []).includes(k));
    for (const [mot] of lv.goal.replace(/[A-Z][’']/g, '').matchAll(/(?<!\p{L})[A-Z]+(?!\p{L})/gu)) visibles.push(...mot); // points nommés par la consigne
    const texte = ex.idee.texte.replace(/[A-Z][’']/g, ''); // C’est, L’…, D’abord
    for (const [mot] of texte.matchAll(/(?<!\p{L})[A-Z]+(?!\p{L})/gu)) {
      for (const lettre of mot) assert.ok(visibles.includes(lettre), `${lv.id} : l’idée nomme ${lettre}, qui n’est pas un point visible`);
    }
    assert.ok(!/\b(Droite|Cercle|Médiatrice)\b/.test(ex.idee.texte), `${lv.id} : l’idée désigne un outil`);
    assert.ok(ex.idee.texte.split(/[.!?]\s/).length <= 3, `${lv.id} : idée trop longue`);
  }
});

test('le « Pourquoi ? » a de 2 à 4 étapes, chacune avec des faits', () => {
  for (const [id, ex] of Object.entries(EXPLICATIONS)) {
    if (!ex.pourquoi) continue;
    assert.ok(ex.pourquoi.length >= 2 && ex.pourquoi.length <= 4, id);
    for (const e of ex.pourquoi) assert.ok(e.faits.length && e.formes.length, id);
  }
});
