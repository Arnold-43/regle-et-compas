/**
 * Solveur par recherche exhaustive (outil de développement, tourne sous Node).
 * Sert aux tests (minimum exact) et servira de base au générateur de niveaux.
 * Attention : l'exploration croît très vite au-delà de 4–5 coups.
 */
import { build, geomOf, isDuplicate, sameGeom, solvedIn, verify } from '../src/engine.js';

/** Signature géométrique d'une figure, indépendante de l'ordre des tracés. */
export function signature(b) {
  return b.objs
    .filter((o) => !o.given)
    .map((o) => {
      const g = o.g;
      if (g.k === 'circle') return `c${g.c.map((x) => x.toFixed(3)).join(',')},${g.r.toFixed(3)}`;
      let d = g.d;
      if (d[0] < -1e-9 || (Math.abs(d[0]) < 1e-9 && d[1] < 0)) d = [-d[0], -d[1]];
      const off = -d[1] * g.o[0] + d[0] * g.o[1];
      return `l${d.map((x) => x.toFixed(4)).join(',')},${off.toFixed(3)}`;
    })
    .sort()
    .join('|');
}

/** Tous les coups possibles depuis une figure, sans doublon géométrique. */
export function candidateMoves(b, tools) {
  const out = [], P = b.points;
  for (let i = 0; i < P.length; i++) {
    for (let j = 0; j < P.length; j++) {
      if (i === j) continue;
      for (const t of tools) {
        if ((t === 'line' || t === 'med') && j < i) continue;
        const g = geomOf(t, P[i].p, P[j].p);
        if (g && !isDuplicate(b, g) && !out.some((u) => sameGeom(u.g, g))) out.push({ t, a: P[i].id, b: P[j].id, g });
      }
    }
  }
  return out;
}

/**
 * Plus courte construction qui résout le niveau, en au plus maxDepth coups.
 * @returns {depth, specs, explored} ou null
 */
export function minMoves(level, maxDepth) {
  let frontier = [[]];
  const seen = new Set(['']);
  for (let depth = 1; depth <= maxDepth; depth++) {
    const next = [];
    for (const specs of frontier) {
      const b = build(level, level.pts, specs);
      for (const m of candidateMoves(b, level.tools)) {
        const s2 = specs.concat([{ t: m.t, a: m.a, b: m.b }]);
        const b2 = build(level, level.pts, s2);
        if (!b2.ok) continue;
        const key = signature(b2);
        if (seen.has(key)) continue;
        seen.add(key);
        if (solvedIn(level, level.pts, b2) >= 0 && verify(level, s2).ok) return { depth, specs: s2, explored: seen.size };
        if (depth < maxDepth) next.push(s2);
      }
    }
    frontier = next;
  }
  return null;
}
