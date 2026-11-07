# Règle et Compas

Jeu mobile d'énigmes de constructions géométriques à la règle et au compas, niveau par niveau,
d'après les *Éléments* d'Euclide. Inspiration : Euclidea. Différence voulue : **le joueur ne doit
jamais rester bloqué** (Euclidea monte trop vite en difficulté et verrouille la fin du jeu).

- Joueur cible : sessions de 2 à 5 minutes sur téléphone, aime les puzzles de déduction calmes.
- Langue : interface, textes et documentation en **français**, le joueur est tutoyé.
- Jeu publié automatiquement sur GitHub Pages et installable comme app (PWA) : https://arnold-43.github.io/regle-et-compas/

## Commandes

Aucune dépendance npm. Garder ce cap tant qu'il n'y a pas une vraie raison d'en ajouter une.

```bash
npm test          # tests des niveaux et de l'outillage (node:test) — doit rester vert et rapide
npm run dev       # sert src/ sur http://localhost:8000 (ES modules : il faut un serveur)
npm run build     # construit dist/ et y grave la version
npm run metrics   # tableau des mesures de difficulté des niveaux du jeu
npm run generate -- triangle --n 4   # candidats de niveaux (figure ou « toutes », --outils line,circle,med)
python3 tools/make-icons.py   # régénère les icônes (Pillow)
```

## Architecture

| Fichier | Rôle |
|---|---|
| `src/engine.js` | Moteur géométrique **pur** (aucun DOM, tourne sous Node) : objets, intersections, rejeu d'une construction, vérification, indices. |
| `src/levels.js` | Les niveaux, sous forme de données + petites fonctions (format documenté en tête de fichier). L'objectif vient du catalogue. |
| `src/catalog.js` | Catalogue des figures remarquables (médiatrice, tangente, carré…) : nom + fonction pure qui calcule la cible. Pur. |
| `src/game.js` | Interface : canvas, toucher (loupe, pincer, glisser), règles du jeu, progression (localStorage), version. |
| `src/index.html`, `src/styles.css` | Squelette et styles (jetons de couleur lus par le canvas). |
| `src/sw.js`, `src/manifest.webmanifest`, `src/icons/` | App installable et hors ligne. |
| `src/version.js` | Version de dev ; remplacé au build. |
| `tools/solver.js` | Recherche du minimum de coups, simple et indépendante : sert d'oracle aux tests. |
| `tools/explore.js` | Exploration exhaustive élaguée (incrémentale, signature, dernier coup ciblé, cadre jouable), toutes cibles d'une figure à la fois. |
| `tools/metrics.js` | Mesures de difficulté et score provisoire (définitions exactes en tête de fichier). |
| `tools/figures.js` | Figures de départ du générateur et association des rôles du catalogue. |
| `tools/generate.js` | Générateur de candidats : JSON dans `tools/out/` (non versionné) + résumé trié par score. |
| `tests/levels.test.js` | Garde-fou de chaque niveau. |
| `tests/tools.test.js` | Garde-fou de l'outillage (incrémental ≡ build, solutions recoupées par force brute, fumée du générateur). |
| `scripts/build.js` | Copie `src/` vers `dist/`, injecte la version, nomme le cache du service worker. |
| `.github/workflows/deploy.yml` | Tests sur chaque PR ; sur `main` : tests → build → GitHub Pages. |

### Concepts clés du moteur
- Une construction = une liste de coups `specs` : `{t:'line'|'circle'|'med', a, b}` (cercle : centre `a`, passant par `b`).
- `build(level, G, specs)` rejoue la construction depuis les points de départ `G`. Chaque intersection reçoit un id stable `x:<obj1>:<obj2>:<k>` ; l'indice `k` reste le même quand on déforme la figure.
- `verify(level, specs)` rejoue la construction sur des points de départ légèrement déplacés : une figure juste « par coïncidence » est refusée.
- `hint(level, specs)` calcule l'indice **depuis la figure du joueur** : d'abord « un seul tracé manque ? », sinon la solution de référence qui recoupe le plus ce qui est déjà tracé ; signale une impasse si les coups restants ne suffisent plus.
- Les solutions de référence (`refs`) désignent les intersections par `{x:[i, j], pick}` avec `pick:'top'|'bottom'`, `not:'A'`, `near:'B'`, `far:'O'`.
- `hidden` (niveau ou figure) : points qui définissent un objet donné sans être visibles (ex. centre d'un cercle donné).

### Mesures de difficulté (`tools/metrics.js`)
- `min` : minimum de coups avec appuis dans le **cadre jouable** (zoom arrière maximal de `game.js`, 0,35 × le cadrage). `minTheorique` : sans cadre, c'est le `par`. S'ils diffèrent, l'étoile est injouable sur téléphone.
- `nbSolutions` : ensembles d'objets distincts de `min` coups qui résolvent (l'ordre ne compte pas).
- Part de bons coups par étape : un coup est bon si l'ensemble tracé reste inclus dans une solution minimale. `premier`, `moyenne`, `goulot` (pire étape, brut) et `goulotLibre` (sans les étapes guidées, utilisé dans le score).
- `aux` : points construits servant d'appui, hors de la cible (min et max sur les solutions minimales).
- `score = 1·min + 0,75·aux + 1·(−log2 goulotLibre) − 0,5·log2(min(nbSolutions, 4))` (constantes `POIDS`, `PLAFOND_SOLUTIONS`). Coup guidé = tracé d'un objet de la cible (droite, cercle), visible en pointillés ; créer un point cible ne l'est pas, mais le joueur vise le point : la part de bons coups se calcule alors parmi les tracés qui passent par un point cible manquant. Provisoire : contrôle de cohérence sur les niveaux existants, pas un calage.

## Règles non négociables

1. **Tout niveau doit passer `npm test`** : chaque référence le résout, le minimum `par` est exact (solveur), aucune solution plus courte, suivre les indices mène à la solution au minimum.
2. **Le moteur reste pur** : rien qui dépende du DOM dans `engine.js` ni `levels.js`.
3. **Pas de chrono, jamais.** La seule contrainte est le nombre de coups (`par + extra`). Annuler et effacer sont gratuits.
4. **Réussir ≠ maîtriser** : réussir (même avec des coups en marge) suffit pour avancer ; l'étoile récompense le minimum sans indice et n'est jamais requise pour progresser.
5. **Enseigner avant d'exiger** : chaque astuce apparaît d'abord dans un niveau facile ; chaque construction réussie peut devenir un outil.
6. **Indices progressifs** (points utiles → outil → tracé), un niveau aidé ne donne pas l'étoile.
7. **Mesurer la difficulté plutôt que la deviner** (voir feuille de route).

## Conventions

- **Version** : semver dans `package.json`. Patch = correction, minor = nouveaux niveaux ou fonctionnalité. Monter la version dans chaque PR qui change le jeu. Le numéro de build et le commit sont ajoutés automatiquement ; ils s'affichent en bas de l'écran « Livre I ».
- **Visuel** : palette d'Oliver Byrne (encre, rouge, bleu, jaune) en jetons CSS dans `styles.css`, thèmes clair et sombre. Convention de dessin technique : figure donnée en trait fort (encre), constructions en trait fin (graphite), objectif en pointillés bleus, indices en rouge.
- **Textes** : phrases courtes et simples, voix active, pas de jargon technique côté joueur.
- **Workflow** : une branche et une PR par changement ; décrire dans la PR ce qui change pour le joueur. Merge sur `main` = publication = mise à jour sur le téléphone à l'ouverture suivante.

## Feuille de route

1. ~~Générateur de niveaux~~ (fait : `tools/generate.js`, catalogue `src/catalog.js`). Reste : étendre le catalogue, ajouter des figures de départ, transformer un candidat choisi en niveau (textes, `refs`, `celebrate`).
2. ~~Mesures de difficulté~~ (faites : `tools/metrics.js`). Reste : le goulot tombe presque toujours au dernier coup (guidé par l'objectif en pointillés), à repenser ; caler les `POIDS` sur des données de jeu (temps, annulations, indices, abandons).
3. **Chapitres** : 10 à 12 chapitres de 12 à 15 niveaux, une idée par chapitre (outil ou notion), courbe en dents de scie (introduction → montée → respiration → défi final optionnel). Sources : Euclide Livres I, III, IV, VI + variantes (compas seul, outillage restreint, autre figure de départ).
4. **Télémétrie de jeu** anonyme pour calibrer la difficulté.
5. **Play Store** : emballer le même code avec Capacitor.

## Pièges connus

- L'exploration explose avec la profondeur (outils règle, compas, médiatrice ; deux passes, cadrée et sans cadre) : N=4 tient en 1 min pour les 6 figures ; N=5 prend 8 à 17 s (segment, cercle sans centre), 6 à 8 min (droite + point, cercle + point) et dépasse 10 min pour le triangle et l'angle (arrêtés au budget vers 700 000 états). Règle et compas seuls : 3 à 8 fois plus rapide. Pour les niveaux à 5 coups : recherche ciblée par objectif plutôt qu'exhaustive (`--budget` pour borner un run).
- Une figure de départ trop « régulière » crée des coïncidences (ex. P à la verticale de A) : choisir des positions génériques ; les tests le détectent.
- Le service worker n'est enregistré qu'en HTTPS ; en local (`npm run dev`), pas de cache.
