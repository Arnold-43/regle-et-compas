// Calculs de vue et avancement des chapitres : `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vuePour, cadrageEnglobant, estVisible, flecheBord, versEcran, interpole, ZOOM_MIN } from '../src/vue.js';
import { CHAPITRES, avancement, chapitreEnCours } from '../src/chapters.js';

const VIEW = [-100, -150, 100, 150], W = 356, H = 592;

test('vuePour fait tenir le cadrage dans le canevas, centré', () => {
  const v = vuePour(VIEW, W, H);
  for (const p of [[-100, -150], [100, 150], [-100, 150], [100, -150]]) assert.ok(estVisible(v, p, W, H, 0), String(p));
  const c = versEcran(v, [0, 0]);
  assert.ok(Math.abs(c[0] - W / 2) < 1e-9 && Math.abs(c[1] - H / 2) < 1e-9);
});

test('cadrageEnglobant : sans point, le cadrage initial ; avec des points, il les contient tous', () => {
  assert.deepEqual(cadrageEnglobant(VIEW, []), VIEW);
  const pts = [[160, 0], [-30, -200]];
  const r = cadrageEnglobant(VIEW, pts), v = vuePour(r, W, H);
  for (const p of pts.concat([[-100, -150], [100, 150]])) assert.ok(estVisible(v, p, W, H, 0), String(p));
  // même rapport largeur/hauteur que le cadrage initial
  assert.ok(Math.abs((r[2] - r[0]) / (r[3] - r[1]) - 200 / 300) < 1e-9);
});

test('cadrageEnglobant ne dépasse jamais le zoom arrière maximal', () => {
  const r = cadrageEnglobant(VIEW, [[5000, 0]]);
  assert.ok(r[2] - r[0] <= 200 / ZOOM_MIN + 1e-9);
  assert.ok(r[3] - r[1] <= 300 / ZOOM_MIN + 1e-9);
});

test('flèche de bord : rien pour un point visible ; sur le bord, du côté du point, sinon', () => {
  const v = vuePour(VIEW, W, H);
  assert.equal(flecheBord(v, [0, 0], W, H), null);
  const f = flecheBord(v, [1000, 0], W, H);
  assert.ok(f.x > W - 20 && f.x <= W && Math.abs(f.y - H / 2) < 1 && Math.abs(f.angle) < 1e-9);
  const g = flecheBord(v, [0, -1000], W, H);
  assert.ok(g.y < 20 && Math.abs(g.angle + Math.PI / 2) < 1e-9);
});

test('interpole va de la vue de départ à la vue d’arrivée', () => {
  const a = { s: 1, tx: 0, ty: 0 }, b = { s: 2, tx: 10, ty: -10 };
  assert.deepEqual(interpole(a, b, 0), a);
  assert.deepEqual(interpole(a, b, 1), b);
});

test('avancement d’un chapitre : réussis et étoiles sur le total, défi compris', () => {
  const ch = CHAPITRES.find((c) => c.id === 'angles');
  const prog = { done: { 'angle-60': { solved: true, star: true }, 'angle-30': { solved: true }, 'angle-15': { solved: true, star: true } } };
  const a = avancement(prog, ch);
  assert.deepEqual([a.resolus, a.etoiles, a.total, a.defis], [3, 2, 4, 1]);
  assert.equal(a.texte, '3/4 · ★ 2');
  assert.equal(avancement({ done: {} }, ch).texte, '0/4 · ★ 0');
  assert.equal(chapitreEnCours({ done: {} }).id, 'bases');
});

test('vueMontrant : glisse si les points tiennent, dézoome sinon, jamais sous le zoom maximal', async () => {
  const { vueMontrant } = await import('../src/vue.js');
  const v = vuePour(VIEW, W, H), haut = 140;
  const dans = (vv, p) => { const [x, y] = versEcran(vv, p); return x >= 16 && x <= W - 16 && y >= haut && y <= H - 16; };
  // déjà visible sous la carte : rien ne change
  assert.equal(vueMontrant(v, [[0, 0]], W, H, { haut }), v);
  // caché sous la carte : simple glissement, même échelle
  const g = vueMontrant(v, [[0, -140]], W, H, { haut });
  assert.equal(g.s, v.s); assert.ok(dans(g, [0, -140]));
  // deux points trop écartés pour la zone : on dézoome, et les deux sont montrés
  const pts = [[0, -150], [0, 150]], d = vueMontrant(v, pts, W, H, { haut, sMin: v.s * ZOOM_MIN });
  assert.ok(d.s < v.s && d.s >= v.s * ZOOM_MIN); for (const p of pts) assert.ok(dans(d, p), String(p));
  // jamais sous sMin
  assert.ok(vueMontrant(v, [[0, -5000], [0, 5000]], W, H, { haut, sMin: v.s * ZOOM_MIN }).s >= v.s * ZOOM_MIN - 1e-12);
});
