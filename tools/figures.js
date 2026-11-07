/**
 * Figures de départ du générateur, et association des rôles du catalogue à leurs éléments.
 * Positions génériques (ni horizontales, ni symétriques) pour éviter les coïncidences.
 * Format : celui d'un niveau (pts, given, hidden, view), plus nom et outils par défaut.
 */
import { rot } from '../src/engine.js';
import { CATALOGUE } from '../src/catalog.js';

const O = [6, 8], R = [-40, 30];

export const FIGURES = {
  segment: {
    nom: 'Segment seul',
    pts: { A: [-52, 28], B: [48, 36] },
    given: [{ id: 's', t: 'seg', a: 'A', b: 'B' }],
    view: [-115, -95, 115, 145],
  },
  'droite-point': {
    nom: 'Droite et point extérieur',
    pts: { A: [-60, 35], B: [55, 20], P: [-10, -60] },
    given: [{ id: 'l', t: 'line', a: 'A', b: 'B' }],
    view: [-120, -112, 120, 142],
  },
  angle: {
    nom: 'Angle',
    pts: { O: [-70, 50], A: [50, 20], B: [0, -70] },
    given: [{ id: 'la', t: 'line', a: 'O', b: 'A' }, { id: 'lb', t: 'line', a: 'O', b: 'B' }],
    view: [-105, -100, 115, 135],
  },
  'cercle-point': {
    nom: 'Cercle (centre connu) et point extérieur',
    pts: { O: [-30, 20], R: [10, -15], P: [95, 40] },
    given: [{ id: 'c', t: 'circle', a: 'O', b: 'R' }],
    view: [-120, -110, 130, 120],
  },
  triangle: {
    nom: 'Triangle quelconque',
    pts: { A: [-60, 40], B: [70, 25], C: [-5, -55] },
    given: [{ id: 'a', t: 'seg', a: 'B', b: 'C' }, { id: 'b', t: 'seg', a: 'C', b: 'A' }, { id: 'c', t: 'seg', a: 'A', b: 'B' }],
    view: [-110, -100, 120, 110],
  },
  'cercle-cache': {
    nom: 'Cercle sans son centre, deux points dessus',
    pts: { O, R, S: rot(R, O, 137) },
    hidden: ['O'],
    given: [{ id: 'c', t: 'circle', a: 'O', b: 'R' }],
    view: [-100, -100, 110, 110],
  },
};

const lignes = (fig) => fig.given.filter((g) => g.t === 'line' || g.t === 'seg');
const visibles = (fig) => Object.keys(fig.pts).filter((k) => !(fig.hidden || []).includes(k));

/** Valeurs possibles de chaque type de rôle dans la figure. */
function domaine(fig, type) {
  const V = visibles(fig), Ls = lignes(fig);
  const relies = (a, b) => Ls.some((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
  switch (type) {
    case 'point': return V;
    case 'paire': return V.flatMap((a, i) => V.slice(i + 1).map((b) => [a, b]));
    case 'droite': return Ls.map((l) => [l.a, l.b]);
    case 'cercle': return fig.given.filter((g) => g.t === 'circle').map((g) => ({ O: g.a, R: g.b }));
    case 'angle': {
      const out = [];
      for (let i = 0; i < Ls.length; i++) for (let j = i + 1; j < Ls.length; j++) {
        const p = [Ls[i].a, Ls[i].b], q = [Ls[j].a, Ls[j].b];
        const s = p.filter((x) => q.includes(x));
        if (s.length === 1) out.push({ O: s[0], A: p.find((x) => x !== s[0]), B: q.find((x) => x !== s[0]) });
      }
      return out;
    }
    case 'triangle': {
      const out = [];
      for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) for (let k = j + 1; k < V.length; k++) {
        const [a, b, c] = [V[i], V[j], V[k]];
        if (relies(a, b) && relies(b, c) && relies(a, c)) out.push([a, b, c]);
      }
      return out;
    }
    default: throw new Error(`type de rôle inconnu : ${type}`);
  }
}

/** Toutes les instances du catalogue qui ont un sens dans la figure : [{entree, args, id, libelle, target}]. */
export function instances(fig) {
  const out = [];
  for (const e of CATALOGUE) {
    let combos = [{}];
    for (const [role, type] of Object.entries(e.args)) {
      combos = combos.flatMap((b) => domaine(fig, type).map((v) => ({ ...b, [role]: v })));
    }
    for (const args of combos) {
      if (e.cond && !e.cond(fig.pts, args, fig)) continue;
      const alts = e.cible(fig.pts, args);
      if (!alts.length || alts.some((alt) => !alt.length)) continue;
      out.push({ entree: e.id, nom: e.nom, args, id: `${e.id}:${JSON.stringify(args)}`, libelle: e.libelle(args), target: (G) => e.cible(G, args) });
    }
  }
  return out;
}
