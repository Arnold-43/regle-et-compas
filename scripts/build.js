// Construit dist/ à partir de src/ et y grave la version (affichée dans l'app).
// En CI : BUILD_NUMBER = numéro d'exécution GitHub Actions, GIT_SHA = commit.
import { readFileSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { execSync } from 'node:child_process';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
let sha = (process.env.GIT_SHA || '').slice(0, 7);
if (!sha) {
  try { sha = execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { sha = 'local'; }
}
const VERSION = {
  version: pkg.version,
  build: process.env.BUILD_NUMBER || 'local',
  sha,
  date: new Date().toISOString().slice(0, 10),
};

rmSync('dist', { recursive: true, force: true });
cpSync('src', 'dist', { recursive: true });
writeFileSync('dist/version.js', `export const VERSION = ${JSON.stringify(VERSION)};\n`);
const sw = readFileSync('dist/sw.js', 'utf8').replace('__CACHE__', `rc-${VERSION.version}-${VERSION.build}-${VERSION.sha}`);
writeFileSync('dist/sw.js', sw);
writeFileSync('dist/.nojekyll', '');

console.log(`dist/ prêt — v${VERSION.version} · build ${VERSION.build} · ${VERSION.sha}`);
