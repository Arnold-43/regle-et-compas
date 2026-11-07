# Journal de la session de nuit (0.3.0)

Objectif : passer de 10 à environ 55 niveaux dans une seule PR (version 0.3.0), branche
`claude/niveaux-0-3-0` créée depuis `main` (f4d9b0e).

## Pour reprendre

1. `git checkout claude/niveaux-0-3-0 && npm test`
2. Lire « État » ci-dessous, puis continuer à la première case non cochée.
3. Après une modification de niveaux : `npm run certify` (seuls les niveaux modifiés sont recalculés), puis `npm test`.

## État

- [x] Étape 1 : industrialisation (fiches, certificats, CI exhaustive, mode test, bouton Médiatrice)
- [ ] Chapitre 3 « Le cercle donné »
- [ ] Chapitre 4 « Sans médiatrice »
- [ ] Chapitre 5 « Centres et tangentes »
- [ ] Chapitre 6 « Carrés et partages »
- [ ] Description finale de la PR, docs/chapitres.md, CLAUDE.md

## Fait

- Étape 1 :
  - `src/fiches.js` (fiches + figures), `src/presentation.js` (titre, consigne, ghost, célébration Byrne par entrée du catalogue) ;
  - 5 entrées de catalogue en plus (triangle et carré inscrits, tangente en un point, partage en 4, report) ;
  - `tools/certify.js` + `src/certificats.js` : `npm test` vérifie les empreintes ; `npm run test:complet` (job CI séparé `verification-complete.yml`) recalcule tout ;
  - mode test (5 tapes sur la version), message « Pas d'outil Médiatrice » ;
  - les 10 niveaux écrits à la main restent tels quels (certifiés aussi).

## Temps de calcul

- Certification des 10 niveaux écrits : 0,15 s au total.

## Incidents et contournements

- La branche de session `claude/dazzling-fermat-vysncs` porte encore les commits d'avant le squash
  de la PR 3 : la repartir de `main` aurait demandé un push forcé (interdit). Nouvelle branche
  `claude/niveaux-0-3-0`, comme demandé.
