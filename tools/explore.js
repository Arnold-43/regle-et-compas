/**
 * Exploration exhaustive des constructions (outil de développement, tourne sous Node).
 * Base commune des mesures (tools/metrics.js) et du générateur (tools/generate.js).
 *
 * Idées clés :
 *  - Un état = l'ensemble des objets tracés. Sa signature est la liste triée des clés
 *    géométriques de ses objets : l'ordre des coups ne compte pas, et un état de k objets
 *    est toujours atteint en exactement k coups. On peut donc parcourir en profondeur
 *    avec un seul ensemble « déjà vu » sans perdre l'exactitude des minimums.
 *  - Construction incrémentale : un enfant n'ajoute qu'un objet et ses intersections,
 *    avec les mêmes ids que engine.build (les coups restent rejouables et vérifiables).
 *  - Dernier coup ciblé : au coup N, on ne fabrique que les coups qui tracent l'objet cible
 *    manquant, ou qui passent par tous les points cibles manquants.
 *  - Une seule exploration pour toutes les cibles d'une figure de départ.
 *  - Cadre : seuls les points visibles au zoom arrière maximal du jeu servent d'appui.
 */
import { geomOf, intersect, near, onLine, onCircle, dist, cross, sub, build, solvedIn, verify } from '../src/engine.js';

/** Zoom arrière maximal autorisé par game.js (0,35 × le cadrage initial). */
export const ZOOM_MIN = 0.35;
const TOL = 1e-6;

/** Boîte visible au zoom arrière maximal : le cadrage initial agrandi de 1/ZOOM_MIN autour de son centre. */
export function cadre(view, zoomMin = ZOOM_MIN) {
  const cx = (view[0] + view[2]) / 2, cy = (view[1] + view[3]) / 2;
  const hw = (view[2] - view[0]) / 2 / zoomMin, hh = (view[3] - view[1]) / 2 / zoomMin;
  return [cx - hw, cy - hh, cx + hw, cy + hh];
}
export const dansBoite = (boite, p) => !boite || (p[0] >= boite[0] && p[0] <= boite[2] && p[1] >= boite[1] && p[1] <= boite[3]);

// ---------- clés géométriques ----------
const rnd = (x, k) => { const v = Math.round(x * k) / k; return String(v === 0 ? 0 : v); };
/** Clé d'un objet, identique pour deux objets confondus (droite tracée à la règle ou par médiatrice). */
export function cle(g) {
  if (g.k === 'circle') return `c${rnd(g.c[0], 1e3)},${rnd(g.c[1], 1e3)},${rnd(g.r, 1e3)}`;
  let d = g.d;
  if (d[0] < -1e-9 || (Math.abs(d[0]) < 1e-9 && d[1] < 0)) d = [-d[0], -d[1]];
  const off = -d[1] * g.o[0] + d[0] * g.o[1];
  const base = `${rnd(d[0], 1e4)},${rnd(d[1], 1e4)},${rnd(off, 1e3)}`;
  if (!g.seg) return 'l' + base;
  const ends = [g.o, g.end].map((p) => `${rnd(p[0], 1e3)},${rnd(p[1], 1e3)}`).sort();
  return `s${base};${ends.join(';')}`; // un segment donné n'est pas la droite qui le porte (comme engine.sameGeom)
}

// ---------- états ----------
function ajoutePoint(points, id, p, nouveaux) {
  for (const q of points) if (near(q.p, p)) return;
  const pt = { id, p, given: false };
  points.push(pt);
  nouveaux.push(pt);
}
function ajouteObjet(points, objs, o, nouveaux) {
  for (const prev of objs) for (const x of intersect(prev.g, o.g)) ajoutePoint(points, `x:${prev.id}:${o.id}:${x.k}`, x.p, nouveaux);
  objs.push(o);
}

/** État de départ d'une figure {pts, given, hidden}. */
export function racine(fig) {
  const G = fig.pts, hidden = fig.hidden || [];
  const points = [], objs = [];
  for (const id of Object.keys(G)) {
    if (hidden.includes(id)) continue;
    if (!points.some((q) => near(q.p, G[id]))) points.push({ id, p: G[id], given: true });
  }
  for (const go of fig.given) {
    const g = geomOf(go.t, G[go.a], G[go.b]);
    ajouteObjet(points, objs, { id: go.id, g, cle: cle(g), given: true }, []);
  }
  return { points, objs, specs: [], cles: [], nouveaux: [], dernier: null };
}

/** Ajoute le coup spec (géométrie g, clé k) : nouvel état, sans toucher au parent. */
export function etend(st, spec, g, k) {
  const id = 'o' + st.specs.length;
  const points = st.points.slice(), objs = st.objs.slice(), nouveaux = [];
  ajouteObjet(points, objs, { id, g, cle: k, given: false }, nouveaux);
  const cles = st.cles.slice();
  let i = cles.length;
  while (i > 0 && cles[i - 1] > k) i--;
  cles.splice(i, 0, k);
  return { points, objs, specs: st.specs.concat([spec]), cles, nouveaux, dernier: k };
}
export const signature = (st) => st.cles.join('|');
const pris = (st, k) => st.objs.some((o) => o.cle === k);

/** Tous les coups possibles depuis un état, sans doublon géométrique, appuis pris dans la boîte. */
export function coups(st, outils, boite) {
  const P = st.points.filter((q) => dansBoite(boite, q.p));
  const vus = new Set(st.objs.map((o) => o.cle));
  const out = [];
  for (let i = 0; i < P.length; i++) {
    for (let j = 0; j < P.length; j++) {
      if (i === j) continue;
      for (const t of outils) {
        if ((t === 'line' || t === 'med') && j < i) continue;
        const g = geomOf(t, P[i].p, P[j].p);
        if (!g) continue;
        const k = cle(g);
        if (vus.has(k)) continue;
        vus.add(k);
        out.push({ spec: { t, a: P[i].id, b: P[j].id }, g, cle: k });
      }
    }
  }
  return out;
}

// ---------- cibles ----------
function prepareCible(fig, c) {
  const alts = c.target(fig.pts).map((alt) => alt.map((el) => (el.k === 'point' ? { k: 'point', p: el.p } : { k: el.k, g: el, cle: cle(el) })));
  return { alts, level: { ...fig, target: c.target } };
}
const aPoint = (st, p) => st.points.some((q) => near(q.p, p));
const aObjet = (st, k) => st.objs.some((o) => !o.given && o.cle === k);
const present = (st, el) => (el.k === 'point' ? aPoint(st, el.p) : aObjet(st, el.cle));
const complet = (st, alt) => alt.every((el) => present(st, el));

/** Un coup qui trace exactement l'objet X, ou null. */
function coupPour(st, X, outils, boite) {
  const P = st.points.filter((q) => dansBoite(boite, q.p));
  if (X.k === 'line') {
    if (outils.includes('line')) {
      const on = P.filter((q) => onLine(X.g, q.p));
      if (on.length >= 2) return { spec: { t: 'line', a: on[0].id, b: on[1].id }, g: geomOf('line', on[0].p, on[1].p) };
    }
    if (outils.includes('med')) {
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
        const g = geomOf('med', P[i].p, P[j].p);
        if (g && cle(g) === X.cle) return { spec: { t: 'med', a: P[i].id, b: P[j].id }, g };
      }
    }
  } else if (X.k === 'circle' && outils.includes('circle')) {
    const c = P.find((q) => near(q.p, X.g.c));
    const on = c && P.find((q) => q !== c && onCircle(X.g, q.p));
    if (on) return { spec: { t: 'circle', a: c.id, b: on.id }, g: geomOf('circle', c.p, on.p) };
  }
  return null;
}
/** Le coup (t, a, b) passe-t-il par le point X ? Test bon marché, avant toute construction. */
function passePar(t, a, b, X) {
  if (t === 'line') { const v = sub(b, a); return Math.abs(cross(v, sub(X, a))) / Math.hypot(v[0], v[1]) < TOL; }
  if (t === 'circle') return Math.abs(dist(a, X) - dist(a, b)) < TOL;
  if (t === 'med') return Math.abs(dist(a, X) - dist(b, X)) < TOL;
  return false;
}

/**
 * Explore toutes les constructions d'au plus n coups depuis fig et trouve, pour chaque cible,
 * le minimum de coups et toutes les solutions minimales (ensembles d'objets distincts).
 * @param fig     {pts, given, hidden?}
 * @param cibles  [{target(G) → [[géométries]]}]
 * @param opts    {n, outils, boite (null = sans cadre)}
 * @returns {resultats: [{min, solutions: Map<signature, specs>}], etats, ms}
 *          min = Infinity si la cible n'est pas atteinte en n coups ; 0 si elle est déjà là.
 */
export function explore(fig, cibles, { n, outils, boite = null }) {
  const t0 = Date.now();
  const C = cibles.map((c) => prepareCible(fig, c));
  const res = C.map(() => ({ min: Infinity, solutions: new Map(), attente: new Map(), rejets: new Set() }));
  // index : clé d'objet cible → cibles concernées ; points cibles
  const parCle = new Map(), ptsCibles = [];
  C.forEach((c, ti) => c.alts.forEach((alt, ai) => alt.forEach((el) => {
    if (el.k === 'point') ptsCibles.push({ p: el.p, ti, ai });
    else { if (!parCle.has(el.cle)) parCle.set(el.cle, []); parCle.get(el.cle).push({ ti, ai }); }
  })));

  const valide = (ti, specs) => {
    const lv = C[ti].level, b = build(lv, lv.pts, specs);
    return b.ok && solvedIn(lv, lv.pts, b) >= 0 && verify(lv, specs).ok;
  };
  const touche = (ti, st) => {
    const r = res[ti], d = st.specs.length, sig = signature(st);
    if (d > r.min || r.solutions.has(sig) || r.attente.has(sig) || r.rejets.has(sig)) return;
    if (d === r.min) { r.attente.set(sig, st.specs); return; }
    if (valide(ti, st.specs)) { r.min = d; r.solutions = new Map([[sig, st.specs]]); r.attente = new Map(); }
    else r.rejets.add(sig);
  };
  // cibles nouvellement complètes grâce au dernier objet ou aux nouveaux points
  const detecte = (st) => {
    const vues = new Set();
    const essaie = (ti, ai) => {
      const key = ti * 64 + ai;
      if (vues.has(key)) return;
      vues.add(key);
      if (complet(st, C[ti].alts[ai])) touche(ti, st);
    };
    if (st.dernier) for (const r of parCle.get(st.dernier) || []) essaie(r.ti, r.ai);
    for (const q of st.nouveaux) for (const c of ptsCibles) if (near(q.p, c.p)) essaie(c.ti, c.ai);
  };
  // dernier coup : seulement ceux qui peuvent compléter une cible encore sans solution plus courte
  const finale = (st) => {
    const enfants = new Map();
    const fabrique = (spec, g) => {
      const k = cle(g);
      if (pris(st, k)) return null;
      let e = enfants.get(k);
      if (!e) { e = etend(st, spec, g, k); enfants.set(k, e); }
      return e;
    };
    let P = null;
    for (let ti = 0; ti < C.length; ti++) {
      if (res[ti].min < n) continue;
      for (const alt of C[ti].alts) {
        const mo = [], mp = [];
        for (const el of alt) if (!present(st, el)) (el.k === 'point' ? mp : mo).push(el);
        if (mo.length > 1 || mo.length + mp.length === 0) continue;
        if (mo.length === 1) {
          const c = coupPour(st, mo[0], outils, boite);
          const e = c && fabrique(c.spec, c.g);
          if (e && complet(e, alt)) touche(ti, e);
          continue;
        }
        if (!P) P = st.points.filter((q) => dansBoite(boite, q.p));
        for (let i = 0; i < P.length; i++) for (let j = 0; j < P.length; j++) {
          if (i === j) continue;
          for (const t of outils) {
            if ((t === 'line' || t === 'med') && j < i) continue;
            if (!mp.every((X) => passePar(t, P[i].p, P[j].p, X.p))) continue;
            const g = geomOf(t, P[i].p, P[j].p);
            const e = g && fabrique({ t, a: P[i].id, b: P[j].id }, g);
            if (e && complet(e, alt)) touche(ti, e);
          }
        }
      }
    }
  };

  const vus = new Set();
  let etats = 0;
  const visite = (st) => {
    if (st.specs.length === n - 1) { finale(st); return; }
    for (const m of coups(st, outils, boite)) {
      const e = etend(st, m.spec, m.g, m.cle);
      const sig = signature(e);
      if (vus.has(sig)) continue;
      vus.add(sig);
      etats++;
      detecte(e);
      visite(e);
    }
  };
  const r0 = racine(fig);
  C.forEach((c, ti) => { if (c.alts.some((alt) => complet(r0, alt))) res[ti].min = 0; });
  if (n >= 1) visite(r0);

  for (let ti = 0; ti < C.length; ti++) {
    const r = res[ti];
    for (const [sig, specs] of r.attente) if (valide(ti, specs)) r.solutions.set(sig, specs);
    delete r.attente; delete r.rejets;
  }
  return { resultats: res, etats, ms: Date.now() - t0 };
}
