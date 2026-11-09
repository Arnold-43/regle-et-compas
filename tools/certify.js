/**
 * Certificats des niveaux (outil de développement, tourne sous Node).
 *
 *   npm run certify                 → certifie les niveaux nouveaux ou modifiés, écrit src/certificats.js
 *   npm run certify -- --tout       → recalcule tout
 *   npm run certify -- <id> …       → recalcule ces niveaux seulement
 *   --budget <minutes>              → budget par exploration (10 par défaut)
 *
 * Pour chaque niveau : empreinte de la définition, minimum (exploration exhaustive), nombre de solutions
 * minimales, score (tools/metrics.js). Pour une fiche (src/fiches.js), on déduit aussi les refs (au moins
 * une solution minimale par variante d'objectif), le cadrage, la place des lettres et l'objectif affiché.
 *
 * Garde-fous d'une fiche (sinon elle est rejetée, avec la raison) : minimum de 2 à 5 coups, étoile jouable
 * dans le cadre (minimum cadré = minimum théorique), refs sans coïncidence (verify), indices qui mènent au
 * minimum, y compris après un détour.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { build, solvedIn, verify, refToSpecs, hint, geomOf, isDuplicate, onLine, onCircle, near, mul, sub, unit, perp, dist } from '../src/engine.js';
import { NIVEAUX_ECRITS } from '../src/levels.js';
import { FICHES, depuisFiche } from '../src/fiches.js';
import { explore, cadre, ZOOM_MIN } from './explore.js';
import { boiteFigure, occupation, CANEVAS } from './occupation.js';
import { mesuresDe, auxiliaires } from './metrics.js';

const FICHIER = new URL('../src/certificats.js', import.meta.url);

// ---------- empreinte ----------
function hash(str) {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 16777619) >>> 0;
    h2 = Math.imul(h2 + ch, 2246822519) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}
/** Empreinte de la définition d'un niveau : points, objets donnés, outils, objectif et géométrie cible. */
export function empreinte(lv) {
  const r = (x) => Math.round(x * 1e6) / 1e6;
  const geo = (g) => (g.k === 'point' ? ['p', ...g.p.map(r)] : g.k === 'circle' ? ['c', ...g.c.map(r), r(g.r)] : ['l', ...g.o.map(r), ...g.d.map(r)]);
  return hash(JSON.stringify({
    pts: lv.pts, given: lv.given, hidden: lv.hidden || [], tools: lv.tools, objectif: lv.objectif || null,
    cible: lv.target(lv.pts).map((alt) => alt.map(geo)),
  }));
}

// ---------- outils ----------
const resolu = (lv, specs) => {
  const b = build(lv, lv.pts, specs);
  return b.ok && solvedIn(lv, lv.pts, b) >= 0 && verify(lv, specs).ok;
};
function suitIndices(lv, specs) {
  for (let garde = 0; garde < 14 && !resolu(lv, specs); garde++) {
    const h = hint(lv, specs);
    if (!h || h.kind !== 'step') break;
    specs.push({ t: h.step.t, a: h.step.a, b: h.step.b });
  }
  return specs;
}
/** Id de point d'une construction → référence (src/engine.js, evalRef). */
function versRef(id) {
  const m = /^x:([^:]+):([^:]+):(\d)$/.exec(id);
  if (!m) return id;
  const part = (t) => (/^o\d+$/.test(t) ? Number(t.slice(1)) : t);
  return { x: [part(m[1]), part(m[2])], k: Number(m[3]) };
}
const versRefs = (specs) => specs.map((s) => ({ t: s.t, a: versRef(s.a), b: versRef(s.b) }));

/**
 * Cadrage : la vue initiale encadre la figure de départ et l'objectif, avec une marge, au format du
 * téléphone de référence (tools/occupation.js). Puis on l'élargit juste ce qu'il faut pour que chaque point
 * des solutions retenues reste visible au zoom arrière maximal du jeu (cadre()).
 */
function cadrage(lv, solutions, alts) {
  const [x0, y0, x1, y1] = boiteFigure(lv);
  const P = [[x0, y0], [x1, y1]];
  for (const alt of alts) for (const el of alt) {
    if (el.k === 'point') P.push(el.p);
    else if (el.k === 'circle') P.push([el.c[0] - el.r, el.c[1] - el.r], [el.c[0] + el.r, el.c[1] + el.r]);
  }
  let a0 = Math.min(...P.map((p) => p[0])), a1 = Math.max(...P.map((p) => p[0]));
  let b0 = Math.min(...P.map((p) => p[1])), b1 = Math.max(...P.map((p) => p[1]));
  const m = 0.12 * Math.max(a1 - a0, b1 - b0) + 12;
  a0 -= m; a1 += m; b0 -= m; b1 += m + 10; // un peu plus en bas : les lettres sous les points
  // au format du canevas (la vue remplit l'écran, et le cadre de zoom arrière est exact)
  const r = (CANEVAS[0] - 16) / (CANEVAS[1] - 16);
  let w = a1 - a0, h = b1 - b0;
  if (w / h > r) { const dh = w / r - h; b0 -= dh / 2; b1 += dh / 2; h = w / r; } else { const dw = h * r - w; a0 -= dw / 2; a1 += dw / 2; w = h * r; }
  // la solution doit rester visible au zoom arrière maximal : sinon on élargit la vue autour de son centre
  const cx = (a0 + a1) / 2, cy = (b0 + b1) / 2;
  let k = 1;
  for (const specs of solutions) {
    const b = build(lv, lv.pts, specs);
    for (const st of specs) for (const id of [st.a, st.b]) {
      const q = b.byId.get(id).p, demi = [(w / 2) / ZOOM_MIN, (h / 2) / ZOOM_MIN];
      k = Math.max(k, (Math.abs(q[0] - cx) * 1.05) / demi[0], (Math.abs(q[1] - cy) * 1.05) / demi[1]);
    }
  }
  return [cx - (w / 2) * k, cy - (h / 2) * k, cx + (w / 2) * k, cy + (h / 2) * k].map((v) => Math.round(v));
}

/** Points de départ visibles qui ne servent ni à l'objectif ni à aucune solution minimale. */
function pointsDecoratifs(lv, solutions) {
  const sert = new Set();
  const visite = (v) => { if (typeof v === 'string') sert.add(v); else if (Array.isArray(v)) v.forEach(visite); else if (v && typeof v === 'object') Object.values(v).forEach(visite); };
  visite(lv.objectif.args);
  for (const specs of solutions) for (const st of specs) { sert.add(st.a); sert.add(st.b); }
  return Object.keys(lv.pts).filter((id) => !(lv.hidden || []).includes(id) && !sert.has(id));
}

/** Lettres : pour chaque point donné, la direction la plus éloignée des tracés qui passent par lui. */
function lettres(lv, solutions) {
  const geoms = lv.given.map((g) => geomOf(g.t, lv.pts[g.a], lv.pts[g.b]));
  for (const specs of solutions) for (const o of build(lv, lv.pts, specs).objs) if (!o.given) geoms.push(o.g);
  const lab = {};
  for (const id of Object.keys(lv.pts)) {
    if ((lv.hidden || []).includes(id)) continue;
    const Pp = lv.pts[id], dirs = [];
    for (const g of geoms) {
      if (g.k === 'line' && onLine(g, Pp)) {
        if (!g.seg) dirs.push(g.d, mul(g.d, -1));
        else { if (!near(Pp, g.end)) dirs.push(unit(sub(g.end, Pp))); if (!near(Pp, g.o)) dirs.push(unit(sub(g.o, Pp))); }
      } else if (g.k === 'circle' && onCircle(g, Pp)) { const t = perp(unit(sub(Pp, g.c))); dirs.push(t, mul(t, -1)); }
    }
    for (const q of Object.keys(lv.pts)) if (q !== id && dist(lv.pts[q], Pp) < 70) dirs.push(unit(sub(lv.pts[q], Pp)));
    let best = [0, -1], bestScore = -1;
    for (let k = 0; k < 16; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 8, d = [Math.cos(a), Math.sin(a)];
      const sc = dirs.length ? Math.min(...dirs.map((u) => Math.acos(Math.max(-1, Math.min(1, u[0] * d[0] + u[1] * d[1]))))) : Math.PI;
      if (sc > bestScore + 1e-9) { bestScore = sc; best = d; }
    }
    lab[id] = best.map((v) => Math.round(v * 100) / 100);
  }
  return lab;
}

// ---------- certification ----------
/** Certificat d'un niveau écrit à la main : minimum (il doit égaler par), solutions, score. */
export function certifierEcrit(lv, { limiteMs }) {
  const t0 = Date.now(), cibleN = { target: (G) => lv.target(G) };
  const boite = cadre(lv.view);
  const rt = explore(lv, [cibleN], { n: lv.par, outils: lv.tools, boite: null, limiteMs }).resultats[0];
  if (rt.min !== lv.par) throw new Error(`${lv.id} : minimum ${rt.min} au lieu de ${lv.par}`);
  const rc = explore(lv, [cibleN], { n: lv.par, outils: lv.tools, boite, limiteMs }).resultats[0];
  const m = mesuresDe(lv, cibleN, rc, rt, lv.tools, boite);
  return { empreinte: empreinte(lv), par: lv.par, minCadre: rc.min, nbSolutions: rt.solutions.size, score: arrondi(m.score), ms: Date.now() - t0 };
}

/** Certificat d'une fiche, ou {rejet} si un garde-fou échoue. */
export function certifierFiche(f, { limiteMs }) {
  const t0 = Date.now();
  const lv0 = depuisFiche(f, null), cibleN = { target: (G) => lv0.target(G) };
  const base = { empreinte: empreinte(lv0) };
  const rejet = (raison) => ({ ...base, rejet: raison, ms: Date.now() - t0 });
  let rt = null;
  for (let n = 1; n <= 5 && !rt; n++) {
    try {
      const r = explore(lv0, [cibleN], { n, outils: lv0.tools, boite: null, limiteMs }).resultats[0];
      if (Number.isFinite(r.min)) rt = r;
    } catch (e) {
      if (e.interrompu) return rejet(`exploration à ${n} coups arrêtée au budget (${e.etats} états)`);
      throw e;
    }
  }
  if (!rt) return rejet('aucune solution en 5 coups au plus');
  if (rt.min < 2) return rejet(`minimum de ${rt.min} coup`);
  const min = rt.min, alts = lv0.target(lv0.pts);
  // une solution par variante d'objectif, la plus simple (moins de points auxiliaires)
  const parAlt = new Map();
  for (const specs of rt.solutions.values()) {
    const b = build(lv0, lv0.pts, specs), a = solvedIn(lv0, lv0.pts, b);
    if (a < 0 || !verify(lv0, specs).ok) continue;
    const aux = auxiliaires(lv0, specs);
    if (!parAlt.has(a) || aux < parAlt.get(a).aux) parAlt.set(a, { specs, aux });
  }
  if (!parAlt.size) return rejet('aucune solution minimale sans coïncidence');
  const deco = pointsDecoratifs(lv0, [...rt.solutions.values()]);
  if (deco.length) return rejet(`point décoratif : ${deco.join(', ')} ne sert ni à l'objectif ni à aucune solution minimale`);
  const solutions = [...parAlt.entries()].sort((x, y) => x[0] - y[0]).map(([, v]) => v.specs);
  const view = cadrage(lv0, solutions, alts);
  const boite = cadre(view);
  let rc;
  try { rc = explore(lv0, [cibleN], { n: min, outils: lv0.tools, boite, limiteMs }).resultats[0]; } catch (e) {
    if (e.interrompu) return rejet('exploration cadrée arrêtée au budget');
    throw e;
  }
  if (rc.min !== min) return rejet(`étoile hors cadre : ${rc.min} coups dans le cadre, ${min} en théorie`);
  const m = mesuresDe(lv0, cibleN, rc, rt, lv0.tools, boite);
  const cert = {
    ...base, par: min, minCadre: rc.min, nbSolutions: rt.solutions.size, score: arrondi(m.score),
    refs: solutions.map(versRefs), view, lab: lettres(lv0, solutions), ghostAlt: [...parAlt.keys()].sort()[0],
    mesures: { premier: arrondi(m.premier), goulotLibre: arrondi(m.goulotLibre), auxMin: m.auxMin, occupation: arrondi(occupation(lv0, view)) },
  };
  // vérifications de bout en bout sur le niveau construit
  const lv = depuisFiche(f, cert);
  for (const ref of lv.refs) {
    const specs = refToSpecs(lv, ref);
    if (!specs || !resolu(lv, specs)) return rejet('une ref ne se rejoue pas');
  }
  const suivi = suitIndices(lv, []);
  if (!resolu(lv, suivi) || suivi.length !== min) return rejet(`les indices mènent à ${suivi.length} coups au lieu de ${min}`);
  const b0 = build(lv, lv.pts, []);
  const ids = b0.points.map((p) => p.id), a = ids[ids.length - 1], bb = ids[0];
  const g = geomOf('circle', b0.byId.get(a).p, b0.byId.get(bb).p);
  if (!isDuplicate(b0, g)) {
    const detour = suitIndices(lv, [{ t: 'circle', a, b: bb }]);
    if (!resolu(lv, detour) || detour.length > min + lv.extra) return rejet('après un détour, les indices ne ramènent pas à la solution');
  }
  cert.ms = Date.now() - t0;
  return cert;
}
const arrondi = (x) => (x === null || x === undefined ? x : Math.round(x * 100) / 100);

// ---------- fichier ----------
export async function lireCertificats() {
  try { return (await import(`${FICHIER.href}?t=${Date.now()}`)).CERTIFICATS; } catch { return {}; }
}
export function ecrireCertificats(certs) {
  const sansDuree = (c) => { const { ms, ...reste } = c; return reste; };
  const tri = Object.fromEntries(Object.keys(certs).sort().map((k) => [k, sansDuree(certs[k])]));
  writeFileSync(FICHIER, '// Écrit par `npm run certify` : ne pas modifier à la main.\n' +
    `export const CERTIFICATS = ${JSON.stringify(tri, null, 1)};\n`);
}

// ---------- ligne de commande ----------
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const tout = argv.includes('--tout');
  const ib = argv.indexOf('--budget');
  const limiteMs = (ib >= 0 ? Number(argv[ib + 1]) : 10) * 60000;
  const ids = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--budget');
  const certs = await lireCertificats();
  const veut = (id, emp) => (ids.length ? ids.includes(id) : tout || !certs[id] || certs[id].empreinte !== emp);
  for (const lv of NIVEAUX_ECRITS) {
    if (!veut(lv.id, empreinte(lv))) continue;
    certs[lv.id] = certifierEcrit(lv, { limiteMs });
    console.log(`${lv.id.padEnd(28)} écrit    min ${certs[lv.id].par}  sol ${certs[lv.id].nbSolutions}  score ${certs[lv.id].score}  (${certs[lv.id].ms} ms)`);
  }
  const connus = new Set([...NIVEAUX_ECRITS.map((l) => l.id), ...FICHES.map((f) => f.id)]);
  for (const id of Object.keys(certs)) if (!connus.has(id)) delete certs[id];
  for (const f of FICHES) {
    if (!veut(f.id, empreinte(depuisFiche(f, null)))) continue;
    const c = certifierFiche(f, { limiteMs });
    certs[f.id] = c;
    console.log(c.rejet
      ? `${f.id.padEnd(28)} REJETÉ   ${c.rejet}  (${c.ms} ms)`
      : `${f.id.padEnd(28)} fiche    min ${c.par}  sol ${c.nbSolutions}  score ${c.score}  (${c.ms} ms)`);
    ecrireCertificats(certs);
  }
  ecrireCertificats(certs);
}
