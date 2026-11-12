/**
 * Idées et explications (src/explications.js) : vérification et documentation.
 *
 *   node tools/idees.js            → vérifie chaque fait, sur la figure et sur des figures déformées
 *   node tools/idees.js --doc      → écrit docs/idees.md (chapitre, niveau, idée, faits vérifiés)
 *   node tools/idees.js --points <id>   → coordonnées des points nommés et des intersections (aide à l'écriture)
 */
import { writeFileSync } from 'node:fs';
import { LEVELS } from '../src/levels.js';
import { CHAPITRES, niveauxDe } from '../src/chapters.js';
import { EXPLICATIONS } from '../src/explications.js';
import { figureExplication, verifieFait, lireFait } from '../src/faits.js';
import { rng, scaleOf, contraindre, build, refToSpecs, solvedIn } from '../src/engine.js';

/**
 * Figures de contrôle : la figure de départ, puis jusqu'à n déformations (comme verify) où la solution
 * épinglée se rejoue et résout encore le niveau (40 essais au plus). Les faits doivent y être vrais.
 */
export function figuresDeControle(level, ref, n = 8, seed = 4242) {
  const rand = rng(seed), amp = scaleOf(level.pts) * 0.08, out = [level.pts];
  for (let essai = 0; essai < 40 && out.length < n + 1; essai++) {
    const Q = {};
    for (const k of Object.keys(level.pts)) {
      const a = rand() * Math.PI * 2, r = amp * (0.3 + 0.7 * rand());
      Q[k] = [level.pts[k][0] + Math.cos(a) * r, level.pts[k][1] + Math.sin(a) * r];
    }
    contraindre(Q, level.contraintes);
    const specs = refToSpecs({ ...level, pts: Q }, ref);
    const b = specs && build(level, Q, specs);
    if (b && b.ok && solvedIn(level, Q, b) >= 0) out.push(Q);
  }
  return out;
}

/** Tous les faits d'une explication (idée et étapes du « Pourquoi ? »), avec leur origine. */
export const tousLesFaits = (ex) => [
  ...(ex.idee ? ex.idee.faits.map((f) => ({ f, ou: 'idée' })) : []),
  ...(ex.pourquoi || []).flatMap((e, i) => e.faits.map((f) => ({ f, ou: `pourquoi ${i + 1}` }))),
];

/** Problèmes d'une explication (liste vide si tout est juste). */
export function problemes(level, ex) {
  const out = [];
  if (!level.refs.some((r) => JSON.stringify(r) === JSON.stringify(ex.ref))) out.push('la solution épinglée n’est pas parmi les refs du niveau (recertifier)');
  const specs = refToSpecs(level, ex.ref);
  if (!specs || solvedIn(level, level.pts, build(level, level.pts, specs)) < 0) out.push('la solution épinglée ne résout pas le niveau');
  else if (specs.length !== level.par) out.push(`la solution épinglée fait ${specs.length} coups au lieu de ${level.par}`);
  const faits = tousLesFaits(ex);
  if (ex.idee && !ex.idee.faits.length) out.push('idée sans fait');
  (ex.pourquoi || []).forEach((e, i) => { if (!e.faits.length) out.push(`étape ${i + 1} du « Pourquoi ? » sans fait`); });
  const figs = figuresDeControle(level, ex.ref);
  if (figs.length < 5) out.push(`seulement ${figs.length - 1} figures déformées où la solution épinglée tient (il en faut 4)`);
  figs.forEach((G, i) => {
    const fig = figureExplication(level, G, ex);
    if (!fig) { out.push(`figure ${i} : la solution épinglée ne se rejoue pas`); return; }
    const echelle = scaleOf(G);
    for (const { f, ou } of faits) {
      let r;
      try { r = verifieFait(f, fig, echelle); } catch (e) { r = { ok: false, detail: e.message }; }
      if (!r.ok) out.push(`figure ${i}, ${ou} : « ${lireFait(f)} » faux (${r.detail})`);
    }
  });
  return [...new Set(out)];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  if (argv[0] === '--points') {
    const lv = LEVELS.find((l) => l.id === argv[1]), ex = EXPLICATIONS[argv[1]] || { ref: lv.refs[0] };
    const fig = figureExplication(lv, lv.pts, ex);
    for (const [n, p] of Object.entries(fig.P)) console.log(n.padEnd(6), p.map((v) => v.toFixed(2)).join(', '));
    const b = build(lv, lv.pts, refToSpecs(lv, ex.ref));
    for (const p of b.points) if (!p.given) console.log(p.id.padEnd(16), p.p.map((v) => v.toFixed(2)).join(', '));
  } else {
    let n = 0, sans = [];
    for (const lv of LEVELS) {
      const ex = EXPLICATIONS[lv.id];
      if (!ex || !ex.idee) { sans.push(lv.id); continue; }
      const p = problemes(lv, ex);
      if (p.length) { n++; console.log(`✗ ${lv.id}\n  ${p.join('\n  ')}`); }
    }
    console.log(`${LEVELS.length - sans.length} idées, ${n} en échec ; sans idée : ${sans.join(', ') || 'aucun'}`);
    if (argv[0] === '--doc') {
      const lignes = ['# Idées des niveaux', '', 'Écrit par `node tools/idees.js --doc` depuis `src/explications.js`. Chaque fait est vérifié numériquement par `npm test`', 'sur la figure du niveau et sur des figures déformées (comme `verify`).', ''];
      for (const ch of CHAPITRES) {
        lignes.push(`## Chapitre ${ch.numero} · ${ch.titre}`, '', '| Niveau | Idée | Faits vérifiés |', '|---|---|---|');
        for (const id of niveauxDe(ch)) {
          const lv = LEVELS.find((l) => l.id === id), ex = EXPLICATIONS[id];
          const idee = ex && ex.idee ? ex.idee.texte : '*(pas d’idée)*';
          const faits = ex && ex.idee ? ex.idee.faits.map(lireFait).join(' ; ') : '';
          lignes.push(`| \`${id}\` ${lv.title} | ${idee} | ${faits} |`);
          if (ex && ex.pourquoi) lignes.push(...ex.pourquoi.map((e, i) => `| ↳ Pourquoi ${i + 1} | ${e.texte} | ${e.faits.map(lireFait).join(' ; ')} |`));
        }
        lignes.push('');
      }
      const nb = Object.values(EXPLICATIONS).filter((e) => e.idee).length;
      lignes.push(`${nb} niveaux sur ${LEVELS.length} ont une idée.` + (sans.length ? ` Sans idée : ${sans.map((s) => `\`${s}\``).join(', ')}.` : ''), '');
      writeFileSync(new URL('../docs/idees.md', import.meta.url), lignes.join('\n'));
      console.log('docs/idees.md écrit');
    }
  }
}
