// Garde-fou des chapitres et de la progression : `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels.js';
import { CHAPITRES, ORDRE, chapitreDe, niveauOuvert, premierAJouer, position, estDefi, niveauxDe } from '../src/chapters.js';

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
  assert.notEqual(premierAJouer(p), 'angle-15'); // on ne pousse jamais vers un défi
  const toutRequis = prog(...ORDRE.filter((id) => !estDefi(id)));
  for (const id of ORDRE) assert.ok(niveauOuvert(toutRequis, id), id); // défis compris, sans les avoir faits
  assert.equal(premierAJouer(toutRequis), ORDRE[0]);
  // un chapitre suivant ne dépendrait que des niveaux requis
  const ch2 = CHAPITRES.find((c) => c.id === 'angles');
  assert.ok(!ch2.niveaux.includes(ch2.defi));
});

test('position dans le chapitre : le défi compte dans le total', () => {
  assert.deepEqual((({ rang, total }) => ({ rang, total }))(position('angle-45')), { rang: 3, total: 4 });
  assert.deepEqual((({ rang, total }) => ({ rang, total }))(position('angle-15')), { rang: 4, total: 4 });
  assert.equal(position('I.10').chapitre.numero, 1);
});

test('chaque entrée du catalogue a une présentation (titre, consigne, célébration)', async () => {
  const { CATALOGUE } = await import('../src/catalog.js');
  const { presentation } = await import('../src/presentation.js');
  for (const e of CATALOGUE) assert.doesNotThrow(() => presentation(e.id), e.id);
});

test('au plus 2 niveaux avec la même cible du catalogue par chapitre', () => {
  for (const ch of CHAPITRES) {
    const n = {};
    for (const id of niveauxDe(ch)) {
      const l = LEVELS.find((x) => x.id === id);
      if (l.objectif) n[l.objectif.id] = (n[l.objectif.id] || 0) + 1;
    }
    for (const [k, v] of Object.entries(n)) assert.ok(v <= 2, `${ch.titre} : ${v} niveaux « ${k} »`);
  }
});

test('les niveaux des fiches ont un titre, une consigne et une célébration pour chaque variante', () => {
  for (const l of LEVELS.filter((x) => x.chapitre && !['bases', 'angles'].includes(x.chapitre))) {
    assert.ok(l.title && l.goal, l.id);
    l.target(l.pts).forEach((_, i) => assert.ok(l.celebrate(l.pts, i).length, `${l.id} variante ${i}`));
    assert.ok(l.ghost(l.pts).length, l.id);
  }
});

test('dents de scie : facile → dur, une respiration aux deux tiers', async () => {
  const { dentsDeScie } = await import('../src/chapters.js');
  const sc = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 };
  assert.deepEqual(dentsDeScie(Object.keys(sc), (k) => sc[k]), ['a', 'c', 'd', 'b', 'e', 'f']);
  assert.deepEqual(dentsDeScie(['c', 'a', 'b'], (k) => sc[k]), ['a', 'b', 'c']);
});

test('garde-fous de contenu (tools/garde-fous.js) : aucune violation', async () => {
  const { violations } = await import('../tools/garde-fous.js');
  assert.deepEqual(violations(), []);
});

test('aucun niveau n’arrive avant ses prérequis', async () => {
  const { FICHES } = await import('../src/fiches.js');
  for (const f of FICHES) for (const p of f.apres || []) {
    if (!ORDRE.includes(f.id)) continue;
    assert.ok(ORDRE.includes(p), `${f.id} : prérequis ${p} absent du jeu`);
    assert.ok(ORDRE.indexOf(p) < ORDRE.indexOf(f.id), `${f.id} arrive avant ${p}`);
  }
});

test('ordonner : prérequis d’abord, puis dents de scie, sans deux cibles identiques à la suite', async () => {
  const { ordonner } = await import('../src/chapters.js');
  const sc = { a: 1, b: 2, c: 3, d: 4, e: 5 };
  const ap = { a: ['d'] };
  const o = ordonner(Object.keys(sc), { score: (k) => sc[k], apres: (k) => ap[k] || [] });
  assert.ok(o.indexOf('d') < o.indexOf('a'));
  const cib = { a: 'x', b: 'x', c: 'y', d: 'z', e: 'w' };
  const o2 = ordonner(['a', 'b', 'c'], { score: (k) => sc[k], cible: (k) => cib[k] });
  for (let i = 1; i < o2.length; i++) assert.notEqual(cib[o2[i]], cib[o2[i - 1]]);
});

test('mise à jour : un chapitre ouvert en 0.3.0 ne se referme pas quand ses niveaux changent', async () => {
  const { REQUIS_PUBLIES, chapitreOuvert } = await import('../src/chapters.js');
  const v = REQUIS_PUBLIES['0.3.0'];
  const ch = (id) => CHAPITRES.find((c) => c.id === id);
  const base = [...BASES, 'angle-60', 'angle-30', 'angle-45'];
  // chapitre 3 fini selon la liste de 0.3.0 (dont des niveaux retirés depuis) : le chapitre 4 reste ouvert
  assert.ok(chapitreOuvert(prog(...base, ...v.cercle), ch('sans-mediatrice')));
  // idem pour chaque chapitre publié en 0.3.0
  let tout = [...base];
  for (const [id, requis] of Object.entries(v)) {
    tout = tout.concat(requis);
    const k = CHAPITRES.findIndex((c) => c.id === id);
    if (k >= 0 && k + 1 < CHAPITRES.length) assert.ok(chapitreOuvert(prog(...tout), CHAPITRES[k + 1]), CHAPITRES[k + 1].titre);
  }
  // un niveau réussi dans un chapitre (même retiré depuis) prouve qu'il était ouvert
  assert.ok(chapitreOuvert(prog(...base, 'sm-bissectrice-b'), ch('sans-mediatrice')));
  // sans rien de tout cela, le chapitre 4 reste fermé
  assert.ok(!chapitreOuvert(prog(...base), ch('sans-mediatrice')));
});

test('mise à jour : un niveau déjà réussi reste ouvert, même si un niveau est inséré avant lui', () => {
  for (const id of ORDRE) {
    const ch = chapitreDe(id);
    const p = prog(...CHAPITRES.slice(0, CHAPITRES.indexOf(ch)).flatMap((c) => c.niveaux), id);
    assert.ok(niveauOuvert(p, id), id);
  }
});
