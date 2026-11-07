/**
 * Règle et Compas — moteur géométrique pur.
 * Aucune dépendance au DOM : tout ce fichier tourne aussi sous Node (tests, solveur, générateur).
 * Repère « écran » : x vers la droite, y vers le bas.
 */

export const EPS = 1e-6;

// ---------- vecteurs ----------
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const mul = (a, s) => [a[0] * s, a[1] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
export const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const unit = (v) => { const n = Math.hypot(v[0], v[1]); return [v[0] / n, v[1] / n]; };
export const perp = (v) => [-v[1], v[0]];
export const near = (a, b, e = EPS) => dist(a, b) < e;
export function rot(p, c, deg) {
  const r = (deg * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r);
  const v = sub(p, c);
  return [c[0] + v[0] * cs - v[1] * sn, c[1] + v[0] * sn + v[1] * cs];
}

// ---------- objets géométriques ----------
// droite  : {k:'line', o, d}      (d unitaire)
// segment : droite + seg:[0, longueur], end
// cercle  : {k:'circle', c, r}
export function lineThrough(p, q) {
  const v = sub(q, p), n = Math.hypot(v[0], v[1]);
  if (n < EPS) return null;
  return { k: 'line', o: p, d: [v[0] / n, v[1] / n] };
}
export function segment(p, q) {
  const L = lineThrough(p, q);
  if (!L) return null;
  L.seg = [0, dist(p, q)];
  L.end = q;
  return L;
}
export function circle(c, p) {
  const r = dist(c, p);
  if (r < EPS) return null;
  return { k: 'circle', c, r };
}
export function bisector(p, q) {
  const v = sub(q, p), n = Math.hypot(v[0], v[1]);
  if (n < EPS) return null;
  return { k: 'line', o: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], d: [-v[1] / n, v[0] / n] };
}

/** Outils du joueur : 'line' (règle), 'circle' (compas : centre a, passant par b), 'med' (médiatrice). */
export function geomOf(t, a, b) {
  if (t === 'line') return lineThrough(a, b);
  if (t === 'circle') return circle(a, b);
  if (t === 'med') return bisector(a, b);
  if (t === 'seg') return segment(a, b);
  return null;
}

export const onLine = (L, X) => Math.abs(cross(L.d, sub(X, L.o))) < EPS;
export const onCircle = (C, X) => Math.abs(dist(C.c, X) - C.r) < EPS;
function inRange(L, X) {
  if (!L.seg) return true;
  const t = dot(sub(X, L.o), L.d);
  return t >= L.seg[0] - 1e-7 && t <= L.seg[1] + 1e-7;
}

export function sameGeom(g, h) {
  if (g.k !== h.k) return false;
  if (g.k === 'circle') return near(g.c, h.c) && Math.abs(g.r - h.r) < EPS;
  if (!!g.seg !== !!h.seg) return false;
  if (Math.abs(cross(g.d, h.d)) > EPS) return false;
  if (!onLine(g, h.o)) return false;
  if (g.seg) return (near(g.o, h.o) && near(g.end, h.end)) || (near(g.o, h.end) && near(g.end, h.o));
  return true;
}

// ---------- intersections ----------
// L'indice k de chaque intersection reste stable quand on déforme continûment la figure :
// c'est ce qui permet de rejouer une construction sur des points de départ déplacés.
function xLL(a, b) {
  const den = cross(a.d, b.d);
  if (Math.abs(den) < 1e-9) return [];
  const t = cross(sub(b.o, a.o), b.d) / den;
  const X = add(a.o, mul(a.d, t));
  return inRange(a, X) && inRange(b, X) ? [{ p: X, k: 0 }] : [];
}
function xLC(L, C) {
  const f = sub(L.o, C.c);
  const b = dot(f, L.d);
  const c = dot(f, f) - C.r * C.r;
  const disc = b * b - c;
  if (disc < -1e-9) return [];
  let res;
  if (disc < 1e-9) res = [{ p: add(L.o, mul(L.d, -b)), k: 0 }];
  else {
    const s = Math.sqrt(disc);
    res = [{ p: add(L.o, mul(L.d, -b - s)), k: 0 }, { p: add(L.o, mul(L.d, -b + s)), k: 1 }];
  }
  return res.filter((x) => inRange(L, x.p));
}
function xCC(A, B) {
  const u = sub(B.c, A.c);
  const d = Math.hypot(u[0], u[1]);
  if (d < EPS) return [];
  if (d > A.r + B.r + 1e-9 || d < Math.abs(A.r - B.r) - 1e-9) return [];
  const a = (A.r * A.r - B.r * B.r + d * d) / (2 * d);
  const h2 = A.r * A.r - a * a;
  const base = add(A.c, mul(u, a / d));
  if (h2 < 1e-9) return [{ p: base, k: 0 }];
  const h = Math.sqrt(h2);
  const n = [-u[1] / d, u[0] / d];
  return [{ p: add(base, mul(n, h)), k: 0 }, { p: sub(base, mul(n, h)), k: 1 }];
}
export function intersect(g, h) {
  if (g.k === 'line' && h.k === 'line') return xLL(g, h);
  if (g.k === 'line') return xLC(g, h);
  if (h.k === 'line') return xLC(h, g);
  return xCC(g, h);
}

// ---------- construction : graphe rejouable ----------
/**
 * Rejoue une construction.
 * @param level  niveau (pts, given, hidden : ids de points qui définissent un objet donné
 *               sans être visibles ni utilisables, ex. le centre d'un cercle donné)
 * @param G      positions des points de départ ({A:[x,y], …}) — level.pts ou une version déformée
 * @param specs  coups du joueur : [{t:'line'|'circle'|'med', a:idPoint, b:idPoint}]
 * @returns {ok, points, byId, objs}  — chaque intersection reçoit un id stable 'x:<obj1>:<obj2>:<k>'
 */
export function build(level, G, specs) {
  const points = [];
  const byId = new Map();
  const objs = [];
  const addPoint = (id, p, given) => {
    for (const q of points) if (near(q.p, p)) return q;
    const pt = { id, p, given };
    points.push(pt);
    byId.set(id, pt);
    return pt;
  };
  const hidden = level.hidden || [];
  for (const id of Object.keys(G)) if (!hidden.includes(id)) addPoint(id, G[id], true);
  const addObj = (o) => {
    for (const prev of objs) {
      for (const x of intersect(prev.g, o.g)) addPoint(`x:${prev.id}:${o.id}:${x.k}`, x.p, false);
    }
    objs.push(o);
  };
  for (const go of level.given) {
    const g = geomOf(go.t, G[go.a], G[go.b]);
    if (!g) return { ok: false };
    addObj({ id: go.id, t: go.t, a: go.a, b: go.b, g, given: true });
  }
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    const pa = byId.get(s.a), pb = byId.get(s.b);
    if (!pa || !pb) return { ok: false, failAt: i };
    const g = geomOf(s.t, pa.p, pb.p);
    if (!g) return { ok: false, failAt: i };
    addObj({ id: 'o' + i, t: s.t, a: s.a, b: s.b, g, given: false });
  }
  return { ok: true, points, byId, objs };
}

export const pointAt = (b, p) => b.points.find((q) => near(q.p, p)) || null;
export const hasObj = (b, g) => b.objs.some((o) => !o.given && sameGeom(o.g, g));
export const isDuplicate = (b, g) => b.objs.some((o) => sameGeom(o.g, g));
export const present = (b, t) => (t.k === 'point' ? !!pointAt(b, t.p) : hasObj(b, t));

/** Index de la variante d'objectif atteinte, ou -1. */
export function solvedIn(level, G, b) {
  const alts = level.target(G);
  for (let i = 0; i < alts.length; i++) if (alts[i].every((t) => present(b, t))) return i;
  return -1;
}

// ---------- vérification par déformation des points de départ ----------
export function rng(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function scaleOf(G) {
  const ps = Object.values(G);
  let m = 0;
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) m = Math.max(m, dist(ps[i], ps[j]));
  return m;
}
function perturb(G, amp, rand) {
  const Q = {};
  for (const k of Object.keys(G)) {
    const a = rand() * Math.PI * 2, r = amp * (0.3 + 0.7 * rand());
    Q[k] = [G[k][0] + Math.cos(a) * r, G[k][1] + Math.sin(a) * r];
  }
  return Q;
}
/**
 * Une figure juste doit le rester quand on bouge un peu les points de départ.
 * Refuse les constructions qui ne tombent juste que par coïncidence.
 */
export function verify(level, specs, seed = 20261107) {
  const rand = rng(seed);
  const amp = scaleOf(level.pts) * 0.08;
  let valid = 0, tries = 0;
  while (valid < 6 && tries < 40) {
    tries++;
    const Q = perturb(level.pts, amp, rand);
    const b = build(level, Q, specs);
    if (!b.ok) continue;
    valid++;
    if (solvedIn(level, Q, b) < 0) return { ok: false, reason: 'coincidence' };
  }
  return valid >= 3 ? { ok: true } : { ok: false, reason: 'fragile' };
}

// ---------- solutions de référence ----------
// Une référence est une liste d'étapes {t, a, b} dont les points sont :
//  - un id de point donné ('A'),
//  - ou une intersection {x:[i, j], pick} entre deux étapes (index) ou objets donnés (id),
//    départagée par pick:'top'|'bottom', not:'A', near:'B' ou far:'O'.
function givenGeom(level, G, id) {
  const go = level.given.find((x) => x.id === id);
  return go ? geomOf(go.t, G[go.a], G[go.b]) : null;
}
function resolveRef(level, G, stepG, r) {
  if (typeof r === 'string') return G[r] || null;
  const gi = (i) => (typeof i === 'number' ? stepG[i] : givenGeom(level, G, i));
  const g1 = gi(r.x[0]), g2 = gi(r.x[1]);
  if (!g1 || !g2) return null;
  const xs = intersect(g1, g2).map((x) => x.p);
  if (!xs.length) return null;
  const by = (f) => xs.reduce((a, b) => (f(b) < f(a) ? b : a));
  if (r.pick === 'top') return by((p) => p[1]);
  if (r.pick === 'bottom') return by((p) => -p[1]);
  if (r.not) { const q = G[r.not]; const c = xs.filter((p) => !near(p, q, 1e-4)); return c[0] || null; }
  if (r.near) { const q = G[r.near]; return by((p) => dist(p, q)); }
  if (r.far) { const q = G[r.far]; return by((p) => -dist(p, q)); }
  return xs[0];
}
export function evalRef(level, G, ref) {
  const stepG = [], out = [];
  for (const st of ref) {
    const a = resolveRef(level, G, stepG, st.a), b = resolveRef(level, G, stepG, st.b);
    if (!a || !b) return null;
    const g = geomOf(st.t, a, b);
    if (!g) return null;
    stepG.push(g);
    out.push({ t: st.t, a, b, g });
  }
  return out;
}
/** Traduit une référence en coups joueur (ids de points). */
export function refToSpecs(level, ref) {
  const ev = evalRef(level, level.pts, ref);
  if (!ev) return null;
  const specs = [];
  for (const st of ev) {
    const b = build(level, level.pts, specs);
    const pa = pointAt(b, st.a), pb = pointAt(b, st.b);
    if (!pa || !pb) return null;
    specs.push({ t: st.t, a: pa.id, b: pb.id });
  }
  return specs;
}

// ---------- indices ----------
const givenFirst = (x, y) => (y.given ? 1 : 0) - (x.given ? 1 : 0);
function directStep(b, t, tools) {
  const pts = b.points;
  if (t.k === 'line') {
    if (tools.includes('line')) {
      const on = pts.filter((q) => onLine(t, q.p)).sort(givenFirst);
      if (on.length >= 2) return { t: 'line', a: on[0].id, b: on[1].id, g: lineThrough(on[0].p, on[1].p) };
    }
    if (tools.includes('med')) {
      const ps = pts.slice().sort(givenFirst);
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const g = bisector(ps[i].p, ps[j].p);
        if (g && sameGeom(g, t)) return { t: 'med', a: ps[i].id, b: ps[j].id, g };
      }
    }
  } else if (t.k === 'circle' && tools.includes('circle')) {
    const c = pts.find((q) => near(q.p, t.c));
    const on = pts.find((q) => onCircle(t, q.p));
    if (c && on) return { t: 'circle', a: c.id, b: on.id, g: t };
  }
  return null;
}

/**
 * Indice calculé depuis la figure du joueur.
 * @returns {kind:'step', step:{t,a,b,g}, remaining} | {kind:'stuck', movesLeft} | null
 */
export function hint(level, specs) {
  const G = level.pts, tools = level.tools;
  const b = build(level, G, specs);
  if (!b.ok) return null;
  const movesLeft = level.par + level.extra - specs.length;
  const alts = level.target(G);
  // 1. Un seul tracé manque ? On le donne directement, même hors des solutions de référence.
  for (const alt of alts) {
    const missing = alt.filter((t) => !present(b, t));
    if (missing.length === 1 && movesLeft >= 1) {
      const st = directStep(b, missing[0], tools);
      if (st) return { kind: 'step', step: st, remaining: 1 };
    }
  }
  // 2. Sinon, la référence qui recoupe le plus ce que le joueur a déjà tracé.
  let best = null;
  for (const ref of level.refs) {
    if (ref.some((s) => !tools.includes(s.t))) continue;
    const ev = evalRef(level, G, ref);
    if (!ev) continue;
    const flags = ev.map((st) => hasObj(b, st.g));
    const idx = flags.indexOf(false);
    if (idx < 0) continue;
    const st = ev[idx];
    const pa = pointAt(b, st.a), pb = pointAt(b, st.b);
    if (!pa || !pb) continue;
    const done = flags.filter(Boolean).length;
    const remaining = flags.length - done;
    if (!best || done > best.done || (done === best.done && remaining < best.remaining)) {
      best = { step: { t: st.t, a: pa.id, b: pb.id, g: st.g }, remaining, done };
    }
  }
  if (!best) return null;
  if (best.remaining > movesLeft) return { kind: 'stuck', movesLeft };
  return { kind: 'step', step: best.step, remaining: best.remaining };
}
