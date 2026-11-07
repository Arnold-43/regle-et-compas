# Journal de la session de nuit (0.3.0)

Objectif : passer de 10 à environ 55 niveaux dans une seule PR (version 0.3.0), branche
`claude/niveaux-0-3-0` créée depuis `main` (f4d9b0e).

## Pour reprendre

1. `git checkout claude/niveaux-0-3-0 && npm test`
2. Lire « État » ci-dessous, puis continuer à la première case non cochée.
3. Après une modification de niveaux : `npm run certify` (seuls les niveaux modifiés sont recalculés), puis `npm test`.

## État

- [x] Étape 1 : industrialisation (fiches, certificats, CI exhaustive, mode test, bouton Médiatrice)
- [x] Chapitre 3 « Le cercle donné »
- [x] Chapitre 4 « Sans médiatrice »
- [x] Chapitre 5 « Centres et tangentes »
- [x] Chapitre 6 « Carrés et partages »
- [x] Description finale de la PR, docs/chapitres.md, CLAUDE.md

## Fait

- Chapitres 3 à 6 : 45 fiches acceptées (12 + 12 + 10 + 11). Ordre de jeu calculé en dents de scie d'après les scores.
- Écartées : `cp-partage-4-b` (partage en 4, règle et compas : rejeté, aucune solution en 5 coups au plus) ;
  `ct-deux-tangentes` (10,5 : plus dur que le défi du chapitre), `ct-centre-inscrit-b` (doublon du défi, même score),
  `cp-milieu` (hors thème, et score gonflé par le goulot) ; `cp-parallelogramme-b` passé de RC (5 coups, 11,95) à RCM (3 coups).
- Ajouts au catalogue pour remplir les chapitres : parallélogramme.

- Étape 1 :
  - `src/fiches.js` (fiches + figures), `src/presentation.js` (titre, consigne, ghost, célébration Byrne par entrée du catalogue) ;
  - 5 entrées de catalogue en plus (triangle et carré inscrits, tangente en un point, partage en 4, report) ;
  - `tools/certify.js` + `src/certificats.js` : `npm test` vérifie les empreintes ; `npm run test:complet` (job CI séparé `verification-complete.yml`) recalcule tout ;
  - mode test (5 tapes sur la version), message « Pas d'outil Médiatrice » ;
  - les 10 niveaux écrits à la main restent tels quels (certifiés aussi).

## Temps de calcul

- `npm test` : 307 tests en 0,47 s. `npm run test:complet` (exhaustif, 55 niveaux) : 93 tests en 179 s en local.

- Certification des 46 premières fiches : 194 s au total. La plus longue : `cp-partage-3-b` (partage en 3 dans l'angle, règle et compas, 5 coups) 174 s ; puis `ct-deux-tangentes` 17 s, `cp-parallelogramme-b` en RC 15 s ; toutes les autres < 1 s.

- Certification des 10 niveaux écrits : 0,15 s au total.

## Incidents et contournements

- La branche de session `claude/dazzling-fermat-vysncs` porte encore les commits d'avant le squash
  de la PR 3 : la repartir de `main` aurait demandé un push forcé (interdit). Nouvelle branche
  `claude/niveaux-0-3-0`, comme demandé.

## Ce qui reste (pour la suite)

- Tester sur téléphone les 5 niveaux signalés comme les plus faibles dans la PR.
- Cadrage : les figures apparaissent petites, car le cadrage englobe toute la solution ; à affiner (une marge plus faible peut sortir des étoiles du cadre, d'où le choix prudent).
- Chapitres 7 et suivants ; recherche ciblée pour les niveaux à 5 coups sur les figures riches.
