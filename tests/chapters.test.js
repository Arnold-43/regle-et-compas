// Garde-fou des chapitres et de la progression : `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels.js';
import { CHAPITRES, ORDRE, chapitreDe, niveauOuvert, premierAJouer, position, estDefi } from '../src/chapters.js';

const prog = (...ids) => ({ done: Object.fromEntries(ids.map((id) => [id, { solved: true }])) });
const BASES = ['I.1', 'I.10', 'I.11', 'I.12', 'I.9', 'I.31'];

test('chaque niveau est dans exactement un chapitre, et chaque id de chapitre existe', () => {
  const ids = LEVELS.map((l) => l.id);
  assert.deepEqual([...ORDRE].sort(), [...ids].sort());
  assert.equal(new Set(ORDRE).size, ORDRE.length);
  assert.equal(new Set(CHAPITRES.map((c) => c.id)).size, CHAPITRES.length);
});

test('le drapeau defi des niveaux correspond aux chapitres', () => {
  for (const l of LEVELS) assert.equal(!!l.defi, estDefi(l.id), l.id);
});

test('un niveau sans proposition d’Euclide appartient à un chapitre autre que le premier', () => {
  for (const l of LEVELS) if (!l.prop) assert.notEqual(chapitreDe(l.id).numero, 1, l.id);
});

test('nouvelle partie : seul le premier niveau est ouvert', () => {
  const p = prog();
  assert.deepEqual(ORDRE.filter((id) => niveauOuvert(p, id)), ['I.1']);
  assert.equal(premierAJouer(p), 'I.1');
});

test('chapitre 1 à moitié : ouverture linéaire, comme en 0.1.x ; le chapitre 2 reste fermé', () => {
  const p = prog('I.1', 'I.10', 'I.11');
  assert.ok(niveauOuvert(p, 'I.12'));
  assert.ok(!niveauOuvert(p, 'I.9'));
  assert.ok(!niveauOuvert(p, 'angle-60'));
  assert.equal(premierAJouer(p), 'I.12');
});

test('progression enregistrée en 0.1.x, chapitre 1 fini : rien n’est perdu et le chapitre 2 s’ouvre', () => {
  const p = { done: Object.fromEntries(BASES.map((id) => [id, { solved: true, star: true, best: 3 }])), seenHelp: true };
  for (const id of BASES) assert.ok(niveauOuvert(p, id));
  assert.ok(niveauOuvert(p, 'angle-60'));
  assert.ok(!niveauOuvert(p, 'angle-30'));
  assert.ok(!niveauOuvert(p, 'angle-15'));
  assert.equal(premierAJouer(p), 'angle-60');
});

test('le défi s’ouvre avec les niveaux requis, et n’est jamais requis', () => {
  const p = prog(...BASES, 'angle-60', 'angle-30', 'angle-45');
  assert.ok(niveauOuvert(p, 'angle-15'));
  assert.equal(premierAJouer(p), 'I.1'); // tout le requis est réussi : on ne pousse pas vers le défi
  // un chapitre suivant ne dépendrait que des niveaux requis
  const ch2 = CHAPITRES.find((c) => c.id === 'angles');
  assert.ok(!ch2.niveaux.includes(ch2.defi));
});

test('position dans le chapitre : le défi compte dans le total', () => {
  assert.deepEqual((({ rang, total }) => ({ rang, total }))(position('angle-45')), { rang: 3, total: 4 });
  assert.deepEqual((({ rang, total }) => ({ rang, total }))(position('angle-15')), { rang: 4, total: 4 });
  assert.equal(position('I.10').chapitre.numero, 1);
});
