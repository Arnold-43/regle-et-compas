/**
 * Règle et Compas — interface : dessin sur canvas, toucher, règles du jeu, progression.
 * La géométrie et les indices vivent dans engine.js ; les niveaux dans levels.js.
 */
import * as RC from './engine.js';
import { LEVELS } from './levels.js';
import { CHAPITRES, ORDRE, niveauxDe, niveauOuvert, chapitreOuvert, premierAJouer, position, chapitreDe, avancement } from './chapters.js';
import { vuePour, cadrageEnglobant, estVisible, flecheBord, interpole } from './vue.js';

// Niveaux dans l'ordre des chapitres (écran des niveaux, « Niveau suivant »).
const NIVEAUX = ORDRE.map((id) => LEVELS.find((l) => l.id === id));
import { VERSION } from './version.js';

const $ = (id) => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d'), stage = $('stage');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DUR = reduceMotion ? 0 : 420;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

const TOOLHELP = {
  line: 'Droite : touche deux points.',
  circle: 'Cercle : touche le centre, puis un point par lequel il passe.',
  med: 'Médiatrice : touche deux points. Elle compte pour un seul coup.',
};
const helpShown = new Set();

let W = 0, H = 0, DPR = 1;
const col = {};
const S = {
  li: 0, specs: [], born: [], tool: null, sel: [], hintUsed: false, hint: null,
  solved: false, winAlt: 0, winAt: 0, view: { s: 1, tx: 0, ty: 0 }, fitS: 1, userView: false, hover: null,
};
let B = null;
let press = null, pinch = null;
const ptrs = new Map();

// ---------- version ----------
const versionLabel = `v${VERSION.version} · build ${VERSION.build} · ${VERSION.sha}`;
$('version').textContent = `Version ${VERSION.version} · build ${VERSION.build} · ${VERSION.sha}` + (VERSION.date ? ` · ${VERSION.date}` : '');

// ---------- progression (propre à ce navigateur) ----------
const KEY = 'regle-compas-v1';
let prog = { done: {}, seenHelp: false, lastVersion: null };
try { const raw = localStorage.getItem(KEY); if (raw) prog = Object.assign(prog, JSON.parse(raw)); } catch (e) { /* stockage indisponible */ }
function save() { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (e) { /* ignore */ } }
const lv = () => NIVEAUX[S.li];
const maxMoves = () => lv().par + lv().extra;
const outOfMoves = () => S.specs.length >= maxMoves();
const done = (i) => prog.done[NIVEAUX[i].id] || {};
// Mode test : 5 tapes sur le numéro de version (écran des chapitres) ouvrent tous les niveaux, 5 de plus
// referment. Rien n'est enregistré pendant le mode test : la progression reste celle d'avant.
let modeTest = false;
// Objectif en pointillés : affiché par défaut ; le choix (bouton œil) vaut pour tous les niveaux.
const CLE_OBJECTIF = 'regle-compas-objectif';
let objectifVisible = true;
try { objectifVisible = localStorage.getItem(CLE_OBJECTIF) !== 'masque'; } catch (e) { /* stockage indisponible : affiché */ }
const unlocked = (i) => modeTest || niveauOuvert(prog, NIVEAUX[i].id);
const firstOpen = () => Math.max(0, ORDRE.indexOf(premierAJouer(prog)));
/** Lignes d'en-tête possibles, de la plus longue à la plus courte : la proposition d'Euclide, sinon la place dans le chapitre. */
function eyebrowsOf(L, suffixe) {
  const fin = suffixe ? ` · ${suffixe}` : '';
  if (L.prop) return [`Euclide · Livre I · Proposition ${L.prop}${fin}`, `Euclide · Livre I · Prop. ${L.prop}${fin}`, `Euclide ${L.id}${fin}`];
  const p = position(L.id), c = p.chapitre, r = `${p.rang}/${p.total}`;
  return [`Chapitre ${c.numero} · ${c.titre} · ${r}${fin}`, `Ch. ${c.numero} · ${c.titre} · ${r}${fin}`, `Ch. ${c.numero} · ${r}${fin}`];
}
/** Écrit la plus longue variante qui tient sur une ligne dans l'élément (sinon la plus courte, tronquée). */
function uneLigne(el, variantes) {
  for (const t of variantes) {
    el.textContent = t;
    if (el.scrollWidth <= el.clientWidth + 1) return;
  }
}
/** Pastille d'un niveau dans la liste : I.10 pour Euclide, 2.3 sinon. */
function badgeOf(L) {
  if (L.prop) return L.id;
  const p = position(L.id);
  return `${p.chapitre.numero}.${p.rang}`;
}
/** Message quand la médiatrice manque à un niveau où le joueur l'a déjà gagnée ('' sinon). */
function sansMed(L) {
  const ch = chapitreDe(L.id);
  if (ch && ch.sansMediatrice) return 'Pas d’outil Médiatrice dans ce chapitre.';
  if (ch && ch.numero > 1) return 'Pas d’outil Médiatrice dans ce niveau.';
  return '';
}
const hasNext = () => S.li < NIVEAUX.length - 1 && unlocked(S.li + 1);

// ---------- couleurs depuis les jetons CSS ----------
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  ['sheet', 'ink', 'graphite', 'blue', 'red', 'yellow', 'rule', 'muted'].forEach((k) => {
    col[k] = cs.getPropertyValue('--' + k).trim() || '#888';
  });
  render();
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors);
new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// ---------- vue ----------
const T = (v, p) => [p[0] * v.s + v.tx, p[1] * v.s + v.ty];
const toW = (v, x, y) => [(x - v.tx) / v.s, (y - v.ty) / v.s];
/** Cadrage initial du niveau (au chargement et quand l'écran change de taille). */
function fitView() {
  vueAnim = null;
  S.view = vuePour(lv().view, W, H);
  S.fitS = S.view.s; // échelle de référence du zoom (0,35 à 10 fois)
  S.userView = false;
  render();
}
// Recadrage en douceur vers une vue écran
let vueAnim = null;
function allerVers(v) {
  if (!DUR) { S.view = v; S.userView = true; render(); return; }
  vueAnim = { de: { ...S.view }, vers: v, t0: performance.now(), dur: 450 };
  S.userView = true; render();
}
const pointsConstruits = () => (B ? B.points.filter((p) => !p.given).map((p) => p.p) : []);
/** « Recadrer » : la figure et tous les points construits, dans la limite du zoom arrière maximal. */
function recadrer() { allerVers(vuePour(cadrageEnglobant(lv().view, pointsConstruits()), W, H)); }
/** Montre des points s'ils sont hors de l'écran (indice qui désigne un point invisible). */
function montrer(points) {
  if (points.every((p) => estVisible(S.view, p, W, H, 18))) return;
  allerVers(vuePour(cadrageEnglobant(lv().view, pointsConstruits().concat(points)), W, H));
}
function resize() {
  const r = stage.getBoundingClientRect();
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  DPR = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  if (!S.userView) fitView(); else render();
}
new ResizeObserver(resize).observe(stage);

// ---------- dessin ----------
let raf = 0;
function render() { if (!raf) raf = requestAnimationFrame(draw); }
function draw() {
  raf = 0;
  if (!W || !B) return;
  const now = performance.now();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = col.sheet; ctx.fillRect(0, 0, W, H);
  let anim = false;
  if (vueAnim) {
    const t = Math.min(1, (now - vueAnim.t0) / vueAnim.dur);
    S.view = interpole(vueAnim.de, vueAnim.vers, t);
    if (t >= 1) vueAnim = null; else anim = true;
  }
  anim = scene(ctx, S.view, now) || anim;
  if (press && press.loupe) anim = drawLoupe(now) || anim;
  if (anim) render();
}

function pathGeom(c, v, g, p, fromW) {
  c.beginPath();
  if (g.k === 'circle') {
    const q = T(v, g.c), r = g.r * v.s;
    if (p >= 1) c.arc(q[0], q[1], r, 0, Math.PI * 2);
    else {
      const f = fromW ? T(v, fromW) : [q[0] + r, q[1]];
      const a0 = Math.atan2(f[1] - q[1], f[0] - q[0]);
      c.arc(q[0], q[1], r, a0, a0 + Math.PI * 2 * p);
    }
    return;
  }
  if (g.seg) {
    const a = T(v, g.o), b = T(v, g.end);
    c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
    return;
  }
  const o = T(v, g.o), d = g.d;
  let m, half;
  if (p >= 1) {
    const t0 = (W / 2 - o[0]) * d[0] + (H / 2 - o[1]) * d[1];
    m = [o[0] + d[0] * t0, o[1] + d[1] * t0]; half = (W + H) * 3;
  } else {
    m = fromW ? T(v, fromW) : o; half = (W + H) * p;
  }
  c.moveTo(m[0] - d[0] * half, m[1] - d[1] * half);
  c.lineTo(m[0] + d[0] * half, m[1] + d[1] * half);
}

function drawShape(c, v, sh, p) {
  const k = (name) => col[name] || col.ink;
  c.save();
  if (sh.poly) {
    c.globalAlpha = 0.3 * p; c.fillStyle = k(sh.fill);
    c.beginPath();
    sh.poly.forEach((q, i) => { const s = T(v, q); if (i) c.lineTo(s[0], s[1]); else c.moveTo(s[0], s[1]); });
    c.closePath(); c.fill();
  } else if (sh.wedge) {
    const s = T(v, sh.wedge[0]), u = sh.wedge[1], w = sh.wedge[2];
    const a1 = Math.atan2(u[1], u[0]), a2 = Math.atan2(w[1], w[0]);
    let d = a2 - a1;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    c.globalAlpha = (sh.fill === 'yellow' ? 0.45 : 0.4) * p; c.fillStyle = k(sh.fill);
    c.beginPath(); c.moveTo(s[0], s[1]); c.arc(s[0], s[1], sh.r, a1, a1 + d, d < 0); c.closePath(); c.fill();
  } else if (sh.seg) {
    c.globalAlpha = p; c.strokeStyle = k(sh.stroke); c.lineWidth = 3;
    const a = T(v, sh.seg[0]), b = T(v, sh.seg[1]);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  } else if (sh.line) {
    c.globalAlpha = p; c.strokeStyle = k(sh.stroke); c.lineWidth = 3;
    pathGeom(c, v, sh.line, 1); c.stroke();
  } else if (sh.right) {
    const s = T(v, sh.right[0]), u = sh.right[1], w = sh.right[2], n = 12;
    c.globalAlpha = p; c.strokeStyle = col.red; c.lineWidth = 1.75;
    c.beginPath();
    c.moveTo(s[0] + u[0] * n, s[1] + u[1] * n);
    c.lineTo(s[0] + (u[0] + w[0]) * n, s[1] + (u[1] + w[1]) * n);
    c.lineTo(s[0] + w[0] * n, s[1] + w[1] * n);
    c.stroke();
  } else if (sh.dot) {
    const s = T(v, sh.dot);
    c.globalAlpha = p; c.fillStyle = k(sh.fill);
    c.beginPath(); c.arc(s[0], s[1], 4.5, 0, Math.PI * 2); c.fill();
  } else if (sh.label) {
    // label: [point, texte], dir: direction (unitaire) du décalage, off: décalage en pixels écran
    const s0 = T(v, sh.label[0]), dv = sh.dir || [0, 0], o = sh.off || 0;
    const s = [s0[0] + dv[0] * o, s0[1] + dv[1] * o];
    c.globalAlpha = p; c.fillStyle = k(sh.fill || 'ink');
    c.font = 'italic 20px "Libre Caslon Text", Georgia, serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(sh.label[1], s[0], s[1]);
  } else if (sh.ticks) {
    const s = T(v, sh.ticks[0]), u = sh.ticks[1], n = [-u[1], u[0]];
    c.globalAlpha = p; c.strokeStyle = col.red; c.lineWidth = 2;
    for (const off of [-4, 4]) {
      const x = s[0] + u[0] * off, y = s[1] + u[1] * off;
      c.beginPath();
      c.moveTo(x - u[0] * 6 + n[0] * 5, y - u[1] * 6 + n[1] * 5);
      c.lineTo(x, y);
      c.lineTo(x - u[0] * 6 - n[0] * 5, y - u[1] * 6 - n[1] * 5);
      c.stroke();
    }
  }
  c.restore();
}

function scene(c, v, now) {
  const L = lv(), G = L.pts;
  let anim = false;
  c.lineCap = 'round'; c.lineJoin = 'round';

  if (L.decor) for (const sh of L.decor(G)) drawShape(c, v, sh, 1);

  // objectif, en pointillés pâles (masquable : bouton œil)
  if (!S.solved && objectifVisible) {
    c.save();
    c.setLineDash([5, 6]); c.strokeStyle = col.blue; c.globalAlpha = 0.4; c.lineWidth = 1.5;
    for (const gh of L.ghost(G)) {
      if (gh.dot) {
        const q = T(v, gh.dot);
        c.beginPath(); c.arc(q[0], q[1], 7, 0, Math.PI * 2); c.stroke();
      } else if (gh.seg) {
        const a = T(v, gh.seg[0]), b = T(v, gh.seg[1]);
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      } else { pathGeom(c, v, gh.line, 1); c.stroke(); }
    }
    c.restore();
  }

  let cp = 0;
  const cel = S.solved ? L.celebrate(G, S.winAlt) : [];
  if (S.solved) {
    cp = DUR ? clamp((now - S.winAt) / 650, 0, 1) : 1;
    if (cp < 1) anim = true;
    for (const sh of cel) if (sh.poly || sh.wedge) drawShape(c, v, sh, cp);
  }

  // traits de construction (fins, graphite)
  let k = 0;
  for (const o of B.objs) {
    if (o.given) continue;
    const born = S.born[k++] || 0;
    const p = DUR ? clamp((now - born) / DUR, 0, 1) : 1;
    if (p < 1) anim = true;
    const e = 1 - Math.pow(1 - p, 3);
    const pa = B.byId.get(o.a).p, pb = B.byId.get(o.b).p;
    const fromW = o.t === 'circle' ? pb : RC.mul(RC.add(pa, pb), 0.5);
    c.strokeStyle = col.graphite; c.lineWidth = 1.25;
    pathGeom(c, v, o.g, e, fromW); c.stroke();
    if (p < 1 && o.t === 'circle') {
      const q = T(v, o.g.c), r = o.g.r * v.s, f = T(v, pb);
      const a = Math.atan2(f[1] - q[1], f[0] - q[0]) + Math.PI * 2 * e;
      c.fillStyle = col.yellow;
      c.beginPath(); c.arc(q[0] + r * Math.cos(a), q[1] + r * Math.sin(a), 3.5, 0, Math.PI * 2); c.fill();
    }
  }

  // figure donnée (trait fort, encre)
  c.strokeStyle = col.ink; c.lineWidth = 2;
  for (const o of B.objs) if (o.given) { pathGeom(c, v, o.g, 1); c.stroke(); }

  // indice niveau 3 : le tracé à faire
  if (S.hint && S.hint.show && S.hint.lvl >= 3) {
    c.save(); c.setLineDash([7, 6]); c.strokeStyle = col.red; c.lineWidth = 2;
    pathGeom(c, v, S.hint.step.g, 1); c.stroke(); c.restore();
  }

  for (const sh of cel) if (!sh.poly && !sh.wedge) drawShape(c, v, sh, cp);

  // aperçu du tracé en cours
  const cand = press ? (press.mode === 'select' ? press.cand : null) : S.hover;
  if (!S.solved && S.tool && S.sel.length === 1 && cand && cand.id !== S.sel[0]) {
    const a = B.byId.get(S.sel[0]);
    const g = a ? RC.geomOf(S.tool, a.p, cand.p) : null;
    if (g) {
      c.save(); c.setLineDash([4, 5]); c.strokeStyle = col.blue; c.lineWidth = 1.5;
      pathGeom(c, v, g, 1); c.stroke(); c.restore();
    }
  }

  // points d'intersection
  for (const p of B.points) {
    if (p.given) continue;
    const s = T(v, p.p);
    c.beginPath(); c.arc(s[0], s[1], 3, 0, Math.PI * 2);
    c.fillStyle = col.sheet; c.fill();
    c.lineWidth = 1.25; c.strokeStyle = col.graphite; c.stroke();
  }
  // points construits hors de l'écran : petite flèche sur le bord, de leur côté
  const indices = S.hint && S.hint.show ? [S.hint.step.a, S.hint.step.b] : [];
  for (const p of B.points) {
    const f = flecheBord(v, p.p, W, H);
    if (!f || (p.given && !indices.includes(p.id))) continue;
    c.save(); c.translate(f.x, f.y); c.rotate(f.angle);
    c.fillStyle = indices.includes(p.id) ? col.red : col.graphite;
    c.beginPath(); c.moveTo(7, 0); c.lineTo(-5, -5.5); c.lineTo(-5, 5.5); c.closePath(); c.fill();
    c.restore();
  }
  // sélection
  for (const id of S.sel) {
    const p = B.byId.get(id); if (!p) continue;
    const s = T(v, p.p);
    c.save(); c.globalAlpha = 0.55; c.fillStyle = col.yellow;
    c.beginPath(); c.arc(s[0], s[1], 10, 0, Math.PI * 2); c.fill(); c.restore();
  }
  // points donnés et lettres
  const lab = L.lab || {};
  c.font = 'italic 17px "Libre Caslon Text", Georgia, serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const p of B.points) {
    if (!p.given) continue;
    const s = T(v, p.p);
    c.fillStyle = col.ink;
    c.beginPath(); c.arc(s[0], s[1], 4.5, 0, Math.PI * 2); c.fill();
    const d = lab[p.id] || [0, -1], n = Math.hypot(d[0], d[1]) || 1;
    c.fillText(p.id, s[0] + (d[0] / n) * 20, s[1] + (d[1] / n) * 20);
  }
  // point visé
  if (cand && !S.solved) {
    const s = T(v, cand.p);
    c.strokeStyle = col.yellow; c.lineWidth = 2.25;
    c.beginPath(); c.arc(s[0], s[1], 12, 0, Math.PI * 2); c.stroke();
  }
  // indice : points cerclés de rouge
  if (S.hint && S.hint.show) {
    const st = S.hint.step;
    [[st.a, st.t === 'circle'], [st.b, false]].forEach(([id, isCenter]) => {
      const p = B.byId.get(id); if (!p) return;
      const s = T(v, p.p);
      c.strokeStyle = col.red; c.lineWidth = 2;
      c.beginPath(); c.arc(s[0], s[1], 13, 0, Math.PI * 2); c.stroke();
      if (isCenter && S.hint.lvl >= 2) {
        c.fillStyle = col.red;
        c.beginPath(); c.arc(s[0], s[1], 6, 0, Math.PI * 2); c.fill();
      }
    });
  }
  return anim;
}

function drawLoupe(now) {
  const R = 54, z = 2.4;
  let lx = press.x, ly = press.y - 92;
  if (ly < R + 8) ly = press.y + 92;
  lx = clamp(lx, R + 8, W - R - 8);
  const w = toW(S.view, press.x, press.y), s2 = S.view.s * z;
  const v2 = { s: s2, tx: lx - w[0] * s2, ty: ly - w[1] * s2 };
  ctx.save();
  ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = col.sheet; ctx.fillRect(lx - R, ly - R, R * 2, R * 2);
  const anim = scene(ctx, v2, now);
  ctx.strokeStyle = col.muted; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(lx - 6, ly); ctx.lineTo(lx + 6, ly); ctx.moveTo(lx, ly - 6); ctx.lineTo(lx, ly + 6); ctx.stroke();
  ctx.restore();
  ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2);
  ctx.lineWidth = 1.5; ctx.strokeStyle = col.ink; ctx.stroke();
  return anim;
}

// ---------- toucher, souris ----------
function pos(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function pick(x, y, rad) {
  let best = null, bd = rad;
  for (const p of B.points) {
    const s = T(S.view, p.p), d = Math.hypot(s[0] - x, s[1] - y);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}
cv.addEventListener('pointerdown', (e) => {
  vueAnim = null;
  try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  const [x, y] = pos(e);
  ptrs.set(e.pointerId, [x, y]);
  if (ptrs.size === 2) {
    press = null;
    const [a, b] = [...ptrs.values()];
    pinch = { d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m0: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], v0: { ...S.view } };
    render(); return;
  }
  if (ptrs.size > 2) return;
  const touch = e.pointerType !== 'mouse';
  const cand = S.solved ? null : pick(x, y, touch ? 30 : 16);
  press = { id: e.pointerId, x0: x, y0: y, x, y, cand, touch, mode: cand ? 'select' : 'pan', v0: { ...S.view }, moved: false, loupe: !!cand && touch };
  if (!cand) cv.style.cursor = 'grabbing';
  render();
});
cv.addEventListener('pointermove', (e) => {
  const [x, y] = pos(e);
  if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [x, y]);
  if (pinch && ptrs.size >= 2) {
    const [a, b] = [...ptrs.values()];
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const s = clamp((pinch.v0.s * d) / pinch.d0, S.fitS * 0.35, S.fitS * 10);
    const w = toW(pinch.v0, pinch.m0[0], pinch.m0[1]);
    S.view = { s, tx: m[0] - w[0] * s, ty: m[1] - w[1] * s };
    S.userView = true; render(); return;
  }
  if (press && press.id === e.pointerId) {
    press.x = x; press.y = y;
    if (Math.hypot(x - press.x0, y - press.y0) > 6) press.moved = true;
    if (press.mode === 'pan') {
      if (press.moved) {
        S.view = { s: press.v0.s, tx: press.v0.tx + (x - press.x0), ty: press.v0.ty + (y - press.y0) };
        S.userView = true;
      }
    } else press.cand = pick(x, y, press.touch ? 30 : 16);
    render(); return;
  }
  if (e.pointerType === 'mouse') {
    const h = S.solved ? null : pick(x, y, 16);
    cv.style.cursor = h ? 'pointer' : 'grab';
    if (h !== S.hover) { S.hover = h; render(); }
  }
});
function endPtr(e, cancel) {
  ptrs.delete(e.pointerId);
  if (pinch) { if (ptrs.size < 2) pinch = null; press = null; render(); return; }
  if (press && press.id === e.pointerId) {
    const p = press; press = null;
    cv.style.cursor = 'grab';
    if (!cancel) {
      if (p.mode === 'select' && p.cand) onPoint(p.cand);
      else if (p.mode === 'pan' && !p.moved) onEmpty();
    }
    render();
  }
}
cv.addEventListener('pointerup', (e) => endPtr(e, false));
cv.addEventListener('pointercancel', (e) => endPtr(e, true));
cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && S.hover) { S.hover = null; render(); } });
cv.addEventListener('wheel', (e) => {
  e.preventDefault();
  const [x, y] = pos(e);
  vueAnim = null;
  const s = clamp(S.view.s * Math.exp(-e.deltaY * 0.0015), S.fitS * 0.35, S.fitS * 10);
  const w = toW(S.view, x, y);
  S.view = { s, tx: x - w[0] * s, ty: y - w[1] * s };
  S.userView = true; render();
}, { passive: false });

// ---------- règles du jeu ----------
function rebuild() {
  B = RC.build(lv(), lv().pts, S.specs);
  if (!B.ok) { S.specs = []; S.born = []; B = RC.build(lv(), lv().pts, []); }
}
function onPoint(p) {
  if (S.solved) return;
  if (outOfMoves()) { toast('Plus de coups. Annule ou efface pour réessayer.'); return; }
  if (!S.tool) { toast('Choisis d’abord un instrument en bas : Droite ou Cercle.'); return; }
  if (S.sel[0] === p.id) { S.sel = []; render(); return; }
  if (!S.sel.length) { S.sel = [p.id]; render(); return; }
  const a = B.byId.get(S.sel[0]);
  S.sel = [];
  const g = a ? RC.geomOf(S.tool, a.p, p.p) : null;
  if (!g) { render(); return; }
  if (RC.isDuplicate(B, g)) { toast('Ce tracé existe déjà.'); render(); return; }
  S.specs.push({ t: S.tool, a: a.id, b: p.id });
  S.born.push(performance.now());
  if (S.hint) S.hint.show = false;
  hideHint();
  rebuild(); updateUI(); checkWin(); render();
}
function onEmpty() { if (S.sel.length) { S.sel = []; render(); } }

function checkWin() {
  const L = lv();
  const alt = RC.solvedIn(L, L.pts, B);
  if (alt < 0) {
    if (outOfMoves()) toast('Plus de coups. Annule ou efface pour réessayer.', 4200);
    return;
  }
  if (!RC.verify(L, S.specs).ok) {
    toast('Juste ici, mais par hasard : si l’on bouge un peu les points de départ, la figure ne tient plus. Cherche une construction qui marche toujours.', 6500);
    return;
  }
  win(alt);
}

function win(alt) {
  const L = lv(), n = S.specs.length;
  S.solved = true; S.winAlt = alt; S.winAt = performance.now() + (DUR ? DUR * 0.6 : 0);
  S.tool = null; S.sel = []; S.hover = null; S.hint = null; hideHint();
  const star = n <= L.par && !S.hintUsed;
  const d = { ...(prog.done[L.id] || {}) };
  const first = !d.solved;
  d.solved = true;
  if (star) d.star = true;
  d.best = Math.min(d.best || Infinity, n);
  if (!modeTest) { prog.done[L.id] = d; save(); }

  $('sheet').hidden = false; // mesurable pour choisir l'en-tête qui tient sur une ligne
  uneLigne($('sheetEyebrow'), L.prop ? [`Euclide ${L.id} · résolu`] : eyebrowsOf(L, 'résolu'));
  if (!$('sheet').classList.contains('in')) $('sheet').hidden = true;
  $('sheetMoves').textContent = n;
  $('sheetUnit').textContent = n > 1 ? 'coups' : 'coup';
  $('sheetStarMark').dataset.on = star ? '1' : '0';
  $('sheetStar').textContent = star
    ? 'Étoile gagnée : c’est le minimum.'
    : S.hintUsed
      ? `Résolu avec un indice. L’étoile se gagne sans aide, en ${L.par} coups.`
      : `Le minimum est de ${L.par} coups. Rejoue pour décrocher l’étoile.`;
  $('sheetUnlock').hidden = !(L.unlocks === 'med' && first);
  $('nextBtn').textContent = hasNext() ? 'Niveau suivant' : 'Voir les niveaux';
  updateUI(); render();
  setTimeout(() => { if (S.solved) openSheet(); }, DUR ? 950 : 0);
}

function undo() {
  if (!S.specs.length) return;
  S.specs.pop(); S.born.pop(); S.sel = [];
  if (S.solved) { S.solved = false; closeSheet(); }
  if (S.hint) S.hint.show = false;
  hideHint(); rebuild(); updateUI(); render();
}
function wipe() {
  if (!S.specs.length && !S.solved) return;
  S.specs = []; S.born = []; S.sel = []; S.solved = false; S.hint = null;
  closeSheet(); hideHint(); rebuild(); updateUI(); render();
}

// ---------- indices ----------
function hintText(h) {
  const t = h.step.t, r = h.remaining;
  if (h.lvl === 1) {
    return 'La prochaine étape s’appuie sur les deux points cerclés de rouge. ' +
      (r > 1 ? `Encore ${r} tracés jusqu’à la solution.` : 'Un seul tracé te sépare de la solution.');
  }
  if (h.lvl === 2) {
    if (t === 'circle') return 'Prends le Cercle : centre sur le point plein, passant par l’autre point cerclé.';
    if (t === 'line') return 'Prends la Droite et relie les deux points cerclés.';
    return 'Prends la Médiatrice entre les deux points cerclés.';
  }
  return 'Voici le tracé, en pointillés rouges. À toi de le faire.';
}
function onHint() {
  if (S.solved) return;
  const h = RC.hint(lv(), S.specs);
  if (!h) { showHint('Indice', 'Rien à proposer depuis cette figure. Efface-la pour repartir de zéro.'); return; }
  if (h.kind === 'stuck') {
    S.hint = null;
    const m = h.movesLeft;
    showHint('Impasse', m > 0
      ? `Avec ${m} coup${m > 1 ? 's' : ''} restant${m > 1 ? 's' : ''}, cette figure ne mène plus à la solution. Annule tes derniers tracés.`
      : 'Plus de coups. Annule tes derniers tracés pour reprendre une autre piste.');
    updateUI(); render(); return;
  }
  const key = `${h.step.t}|${h.step.a}|${h.step.b}`;
  const lvl = S.hint && S.hint.key === key ? Math.min(3, S.hint.lvl + 1) : 1;
  S.hint = { key, lvl, step: h.step, remaining: h.remaining, show: true };
  S.hintUsed = true; S.sel = [];
  montrer([h.step.a, h.step.b].map((id) => B.byId.get(id)).filter(Boolean).map((q) => q.p));
  showHint(`Indice ${lvl} sur 3`, hintText(S.hint));
  updateUI(); render();
}
function showHint(kicker, text) { $('hintKicker').textContent = kicker; $('hintText').textContent = text; $('hintcard').hidden = false; }
function hideHint() { $('hintcard').hidden = true; }

// ---------- interface ----------
let toastT = 0;
function toast(msg, ms) {
  const t = $('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { t.hidden = true; }, ms || 2600);
}
function updateUI() {
  const L = lv(), n = S.specs.length, m = maxMoves();
  uneLigne($('eyebrow'), eyebrowsOf(L));
  $('title').textContent = L.title;
  $('goal').textContent = L.goal;
  $('moves').innerHTML = `${n}<span>/${m}</span>`;
  $('count').dataset.state = n >= m && !S.solved ? 'out' : '';
  $('par').innerHTML = S.hintUsed ? 'Indice utilisé : pas d’étoile cette fois' : `<b>★</b>Étoile en ${L.par} coups`;
  document.querySelectorAll('.tool').forEach((b) => {
    const t = b.dataset.tool, avail = L.tools.includes(t);
    b.dataset.locked = avail ? '' : '1';
    b.setAttribute('aria-disabled', avail ? 'false' : 'true');
    if (t === 'med') {
      const sans = avail ? '' : sansMed(L);
      b.title = sans;
      b.setAttribute('aria-label', sans ? `Médiatrice : ${sans}` : 'Médiatrice');
    }
    b.setAttribute('aria-pressed', S.tool === t ? 'true' : 'false');
    b.classList.toggle('cue', !!(S.hint && S.hint.show && S.hint.lvl >= 2 && S.hint.step.t === t));
    b.classList.toggle('off', avail && (S.solved || outOfMoves()));
  });
  $('undoBtn').disabled = !S.specs.length;
  $('resetBtn').disabled = !S.specs.length;
  $('hintBtn').disabled = S.solved;
  const lvl = S.hint ? S.hint.lvl : 0;
  document.querySelectorAll('.pips i').forEach((el, i) => el.classList.toggle('on', i < lvl));
}
function openSheet() {
  const s = $('sheet');
  s.hidden = false;
  requestAnimationFrame(() => s.classList.add('in'));
}
function closeSheet() { const s = $('sheet'); s.classList.remove('in'); s.hidden = true; }

function loadLevel(i) {
  S.li = i; S.specs = []; S.born = []; S.tool = null; S.sel = []; S.hint = null;
  S.hintUsed = false; S.solved = false; S.hover = null;
  closeSheet(); hideHint();
  rebuild(); fitView(); updateUI(); render();
  if (i === 0 && !prog.seenHelp) {
    prog.seenHelp = true; save();
    toast('Choisis un instrument en bas, puis touche des points. Chaque croisement devient un point utilisable.', 7000);
  }
}

const CADENAS = '<svg class="ic lock" viewBox="0 0 28 28" aria-hidden="true"><rect x="7" y="13" width="14" height="10" rx="2"/><path d="M10 13V9.5a4 4 0 0 1 8 0V13"/></svg>';
function renderLevels() {
  const ul = $('lvList');
  ul.innerHTML = '';
  let stars = 0, solved = 0, enCours = null;
  const courant = chapitreDe(NIVEAUX[S.li].id);
  for (const ch of CHAPITRES) {
    const ouvert = modeTest || chapitreOuvert(prog, ch);
    const k = CHAPITRES.indexOf(ch), av = avancement(prog, ch);
    stars += av.etoiles; solved += av.resolus;
    const head = document.createElement('li');
    head.className = 'lv-ch';
    head.dataset.locked = ouvert ? '' : '1';
    head.innerHTML = `<span class="lv-ch-top"><span class="lv-ch-num">${ouvert ? '' : CADENAS}Chapitre ${ch.numero}</span>` +
      `<span class="lv-ch-av" aria-label="${av.resolus} niveaux réussis sur ${av.total}, ${av.etoiles} étoiles">${av.texte}</span></span>` +
      `<span class="lv-ch-title">${ch.titre}</span>` +
      `<span class="lv-ch-idea">${ch.idee}</span>` +
      (ouvert ? '' : `<span class="lv-ch-cond">Réussis les niveaux du chapitre ${CHAPITRES[k - 1].numero} pour l’ouvrir.</span>`);
    ul.appendChild(head);
    if (ch === courant) enCours = head;
    if (!ouvert) { // niveaux repliés en une ligne
      const li = document.createElement('li');
      li.className = 'lv-pli';
      li.textContent = `${av.total} niveaux` + (av.defis ? `, dont ${av.defis} défi` : '');
      ul.appendChild(li);
      continue;
    }
    for (const id of niveauxDe(ch)) ul.appendChild(levelItem(ORDRE.indexOf(id), done(ORDRE.indexOf(id))));
  }
  $('lvTally').textContent = `${solved} sur ${NIVEAUX.length} résolus · ${stars} étoile${stars > 1 ? 's' : ''}`;
  return enCours;
}
function levelItem(i, d) {
  const L = NIVEAUX[i], un = unlocked(i);
  const st = !un ? ['locked', 'Verrouillé'] : d.star ? ['star', '★ Étoile'] : d.solved ? ['done', 'Résolu'] : ['todo', 'À faire'];
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.className = 'lv'; b.disabled = !un;
  if (i === S.li) b.setAttribute('aria-current', 'true');
  b.innerHTML = `<span class="lv-prop">${badgeOf(L)}</span>` +
    `<span><span class="lv-title">${L.title}</span><span class="lv-meta">` +
    (L.defi ? 'Défi · optionnel · ' : '') +
    (d.best ? `Meilleur : ${d.best} coups · minimum ${L.par}` : `Minimum : ${L.par} coups`) +
    `</span></span><span class="chip" data-s="${st[0]}">${st[1]}</span>`;
  b.addEventListener('click', () => { closeLevels(); loadLevel(i); });
  li.appendChild(b);
  return li;
}
function openLevels() {
  const enCours = renderLevels();
  $('wipeBtn').dataset.armed = ''; $('wipeBtn').textContent = 'Effacer la progression';
  $('levels').hidden = false;
  // défile jusqu'au chapitre en cours (celui du niveau ouvert)
  if (enCours) requestAnimationFrame(() => { $('levels').scrollTop = Math.max(0, enCours.offsetTop - 12); });
}
function closeLevels() { $('levels').hidden = true; }

document.querySelectorAll('.tool').forEach((b) => b.addEventListener('click', () => {
  const t = b.dataset.tool, L = lv();
  if (!L.tools.includes(t)) {
    toast(sansMed(L) || 'La Médiatrice se gagne en réussissant la proposition I.10.');
    return;
  }
  if (S.solved || outOfMoves()) return;
  S.tool = S.tool === t ? null : t;
  S.sel = [];
  if (S.tool && !helpShown.has(t)) { helpShown.add(t); toast(TOOLHELP[t], 3200); }
  updateUI(); render();
}));
$('undoBtn').addEventListener('click', undo);
$('resetBtn').addEventListener('click', wipe);
$('hintBtn').addEventListener('click', onHint);
$('hintcard').addEventListener('click', hideHint);
$('fitBtn').addEventListener('click', recadrer);
// Objectif en pointillés : affiché par défaut, choix mémorisé pour tous les niveaux.
function majBoutonObjectif() {
  const b = $('ghostBtn'), l = objectifVisible ? 'Masquer l’objectif' : 'Afficher l’objectif';
  b.setAttribute('aria-label', l); b.title = l; b.setAttribute('aria-pressed', objectifVisible ? 'false' : 'true');
  b.dataset.masque = objectifVisible ? '' : '1';
}
$('ghostBtn').addEventListener('click', () => {
  objectifVisible = !objectifVisible;
  try { localStorage.setItem(CLE_OBJECTIF, objectifVisible ? 'affiche' : 'masque'); } catch (e) { /* le choix vaut pour la session */ }
  majBoutonObjectif(); render();
});
majBoutonObjectif();
$('menuBtn').addEventListener('click', openLevels);
$('closeLevels').addEventListener('click', closeLevels);
$('nextBtn').addEventListener('click', () => {
  if (hasNext()) loadLevel(S.li + 1);
  else openLevels();
});
$('replayBtn').addEventListener('click', () => loadLevel(S.li));
let tapes = 0, tapeT = 0;
$('version').addEventListener('click', () => {
  const now = Date.now();
  tapes = now - tapeT < 1500 ? tapes + 1 : 1; tapeT = now;
  if (tapes < 5) return;
  tapes = 0; modeTest = !modeTest;
  toast(modeTest ? 'Mode test : tous les niveaux sont ouverts. Ta progression ne change pas.' : 'Mode test terminé.', 3200);
  renderLevels();
});
$('wipeBtn').addEventListener('click', () => {
  const btn = $('wipeBtn');
  if (btn.dataset.armed !== '1') { btn.dataset.armed = '1'; btn.textContent = 'Toucher encore pour confirmer'; return; }
  prog = { done: {}, seenHelp: true, lastVersion: prog.lastVersion }; save();
  btn.dataset.armed = ''; btn.textContent = 'Effacer la progression';
  closeLevels(); loadLevel(0);
});
document.addEventListener('keydown', (e) => {
  if (!$('levels').hidden) { if (e.key === 'Escape') closeLevels(); return; }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
  const map = { 1: 'line', 2: 'circle', 3: 'med' };
  if (map[e.key]) { document.querySelector(`.tool[data-tool="${map[e.key]}"]`).click(); return; }
  if (e.key === 'Escape') { S.sel = []; render(); }
});

// ---------- démarrage ----------
readColors();
resize();
loadLevel(firstOpen());
if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);

// Annonce discrète d'une nouvelle version installée
if (prog.lastVersion && prog.lastVersion !== versionLabel) {
  setTimeout(() => toast(`Mise à jour installée : ${versionLabel}`, 4000), 600);
}
if (prog.lastVersion !== versionLabel) { prog.lastVersion = versionLabel; save(); }

// Hors ligne et installation sur l'écran d'accueil (uniquement en HTTPS)
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* le jeu marche sans */ });
}

// Crochet de test (Playwright) : seulement avec ?debug dans l'adresse ; sans effet sur le jeu normal.
if (/[?&]debug\b/.test(location.search)) {
  window.__regleCompas = {
    etat: () => ({
      id: lv().id, W, H, view: { ...S.view }, anim: !!vueAnim, solved: S.solved, coups: S.specs.length, objectifVisible,
      indice: S.hint && S.hint.show ? { t: S.hint.step.t, a: S.hint.step.a, b: S.hint.step.b } : null,
      points: Object.fromEntries(B.points.map((p) => [p.id, p.p])),
    }),
    aller: (id) => { modeTest = true; loadLevel(ORDRE.indexOf(id)); },
    indice: () => onHint(),
    jouer: (t, a, b) => { S.tool = t; S.sel = []; onPoint(B.byId.get(a)); onPoint(B.byId.get(b)); },
  };
}
