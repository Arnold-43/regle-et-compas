# Chapitres et candidats de niveaux

Règle de conception : **un chapitre = une seule idée**. Courbe en dents de scie : introduction, montée,
respiration, puis un défi optionnel. Un chapitre s'ouvre quand les niveaux non optionnels du précédent
sont réussis ; le défi n'est jamais requis.

Les candidats viennent du générateur (`npm run generate`) et des mesures (`npm run metrics`), voir
CLAUDE.md. Le score est provisoire (plus il est haut, plus c'est dur) : il sert à ordonner, pas à décider.

## Carte des chapitres

| Ch. | Titre | Idée | Niveaux | Défi (optionnel) |
|---|---|---|---|---|
| 1 | Les bases | Les premières propositions d'Euclide, outil par outil. | I.1, I.10, I.11, I.12, I.9, I.31 (les 6 niveaux actuels) | — |
| 2 | Les angles | Le triangle équilatéral donne 60° ; couper un angle en deux donne les autres. | 60° (#1), 30° (variante de #1), 45° (#9) | 15° (#8) |
| 3 | Le cercle donné | Un cercle déjà tracé fait gagner des coups. | #6, #4, #3, #12, #13 | — |
| 4 | Sans médiatrice | Retrouver les constructions avec la règle et le compas seuls. | #5, #16, #17, #10 | #15 (Thalès) |
| 5 | Centres et tangentes | Les droites remarquables deviennent des outils. | #2, #19 (+ bissectrice) | #18 |
| 6 | Carrés et partages | Reporter des longueurs pour bâtir et partager. | #7, #14 | #20 |

État : chapitre 1 publié ; chapitre 2 ajouté en 0.2.0 ; chapitres 3 à 6 ajoutés en 0.3.0 (55 niveaux en tout).

Depuis 0.3.0, les niveaux des chapitres 3 à 6 sont des fiches (`src/fiches.js`), certifiées par
`npm run certify`. L'ordre de jeu est calculé d'après les scores, en dents de scie (`src/chapters.js`).

| Ch. | Niveaux requis | Défi | Remarque |
|---|---|---|---|
| 3 Le cercle donné | 11 | centre du cercle effacé, règle et compas (5 coups, 10,9) | carrés et triangles inscrits ajoutés au catalogue |
| 4 Sans médiatrice | 11 | Thalès : perpendiculaire en C (3 coups, 8,3) | les deux bissectrices (9,2 et 9,5) sont plus dures que le défi, comme dans la carte |
| 5 Centres et tangentes | 9 | centre du cercle inscrit (4 coups, 9,3) | la bissectrice remplace « deux tangentes » (10,5, plus dur que le défi) |
| 6 Carrés et partages | 10 | partage en 3 dans l'angle, règle et compas (5 coups, 9,9) | parallélogramme, partage en 4 et report de longueur ajoutés au catalogue |

Fiches écartées : partage en 4 à la règle et au compas (aucune solution en 5 coups au plus), deux
tangentes (plus dur que le défi), second centre inscrit (doublon du défi), milieu de [AP] en règle et
compas (hors thème).

## Les 20 candidats

Outils : RCM = règle, compas, médiatrice ; RC = règle et compas seuls. Les variantes (mêmes idée et
cible, autres figures ou outils) sont entre crochets avec leur score.

| # | Score | Figure de départ | Outils | Cible | Coups | Sol. | Aux | Idée |
|---|---|---|---|---|---|---|---|---|
| 1 | 2,9 | segment | RCM | droite à 60° en A [30° : 3,7] | 3 | 6 | 0 | le sommet du triangle équilatéral sert d'outil |
| 2 | 3,2 | triangle | RCM | centre du cercle circonscrit [cercle : 7,0] | 2 | 3 | 0 | deux médiatrices suffisent |
| 3 | 4,1 | cercle + point | RCM | hexagone inscrit [RC : 4,5] | 3 | 12 | 0 | la médiatrice de [OR] coupe le cercle en deux sommets |
| 4 | 4,5 | cercle + point | RCM | triangle équilatéral sur [OR] [RC : 5,5] | 3 | 4 | 0 | le cercle donné fait gagner un coup |
| 5 | 4,8 | droite + point | RC | perpendiculaire depuis P [angle 5,4 ; triangle 5,7] | 3 | 5 | 0 | deux cercles qui passent par P |
| 6 | 5,0 | cercle + point | RC | médiatrice de [OR] | 2 | 1 | 0 | le cercle donné est le premier coup de compas |
| 7 | 5,3 | segment | RCM | perpendiculaire en A au segment [RC, 5 coups : 7,2] | 3 | 1 | 1 | prolonger le segment d'abord |
| 8 | 6,1 | segment | RCM | droite à 15° | 4 | 20 | 1 | 60° → 30° → 15° |
| 9 | 6,3 | segment | RCM | droite à 45° [RC, 5 coups : 9,5] | 3 | 2 | 1 | un cercle centré au milieu |
| 10 | 6,5 | droite + point | RC | droite par P à 60° de (AB) | 4 | 94 | 1 | un angle depuis un point extérieur |
| 11 | 6,8 | angle | RCM | parallèle à (OA) par B | 2 | 1 | 2 | le losange |
| 12 | 6,8 | cercle sans centre | RCM | centre du cercle [RC, 5 coups : 10,9] | 3 | 7 | 2 | deux cordes, deux médiatrices (Euclide III.1) |
| 13 | 7,0 | cercle + point | RCM | carré sur [OR] [RC, 4 coups : 9,5] | 3 | 8 | 2 | le cercle donné porte deux sommets |
| 14 | 7,4 | segment | RCM | carré sur [AB] [triangle 8,0 ; cercle sans centre 8,0 ; RC, 5 coups : 9,5] | 4 | 8 | 2 | perpendiculaire, puis report de longueur |
| 15 | 8,3 | triangle | RC | perpendiculaire à (BC) en C | 3 | 1 | 1 | angle droit dans un demi-cercle (Thalès) |
| 16 | 8,3 | droite + point | RC | parallèle par P [triangle 7,9] | 4 | 29 | 1 | I.31 sans médiatrice |
| 17 | 9,2 | triangle | RC | bissectrice [angle 9,5] | 4 | 8 | 1 | I.9 à la manière d'Euclide |
| 18 | 9,3 | triangle | RCM | centre du cercle inscrit | 4 | 47 | 2 | par le milieu de l'arc AB (« pôle Sud ») |
| 19 | 9,3 | cercle + point | RCM | une tangente depuis P [RC, 5 coups : 12,0 ; les deux, RCM, 5 coups : 10,5] | 4 | 6 | 1 | cercle de Thalès sur [OP] |
| 20 | 9,7 | angle | RC | partage de [OB] en 3 [droite + point 10,6 ; cercle + point 10,6] | 5 | 19 | 2 | partager en s'aidant des deux côtés de l'angle |

Le n° 11 (parallèle en 2 coups par le losange) n'est placé dans aucun chapitre pour l'instant : c'est un
bon candidat de défi pour un chapitre « parallèles » à venir.

### Avis par candidat

- **1, 8, 9** : un chapitre « angles ». Chaque construction devient l'outil de la suivante ; le 45° est la respiration.
- **4, 6** : « le cercle donné compte » ; le 6 surprend (une médiatrice en 2 coups).
- **5, 16, 17** : I.12, I.31 et I.9 sans médiatrice ; le 17 est la bissectrice d'Euclide.
- **2 → 18** : du centre circonscrit (facile) au centre inscrit (défi). La solution du solveur ne passe pas par les bissectrices mais par le milieu de l'arc : superbe, trop dur pour être exigé.
- **3** : l'hexagone, une astuce élégante et facile une fois les sommets visibles.
- **7** : un piège doux, le segment ne se prolonge pas tout seul.
- **11** : une parallèle en 2 coups, une seule solution : un pur déclic.
- **12** (III.1) et **15** (Thalès) : de très bons milieux de chapitre.
- **13, 14** : les carrés, techniques, après les perpendiculaires.
- **19** : la tangente, classique et défi de fin de chapitre.
- **20** : le partage en 3 dans l'angle, une introduction à Thalès et au Livre VI.

Écartés : les doublons des niveaux actuels sur d'autres figures, les milieux (I.10 plus un point), les
angles par un point extérieur au-delà de 60° (longs et sans idée nouvelle).
