# Idées des niveaux

Écrit par `node tools/idees.js --doc` depuis `src/explications.js`. Chaque fait est vérifié numériquement par `npm test`
sur la figure du niveau et sur des figures déformées (comme `verify`).

## Chapitre 1 · Les bases

| Niveau | Idée | Faits vérifiés |
|---|---|---|
| `I.1` Triangle équilatéral | Les trois côtés doivent être égaux à AB. Un cercle de centre A passant par B contient tous les points à la distance AB de A. | AB = AC = BC |
| ↳ Pourquoi 1 | C est sur le cercle de centre A qui passe par B : AC = AB. | AB = AC |
| ↳ Pourquoi 2 | C est aussi sur le cercle de centre B qui passe par A : BC = BA. | BA = BC |
| ↳ Pourquoi 3 | Les trois côtés sont égaux : le triangle ABC est équilatéral. | AB = BC = CA |
| `I.10` Médiatrice | Un point à la même distance de A et de B est sur la médiatrice. Cherche deux points comme ça. | AP = BP ; AQ = BQ |
| ↳ Pourquoi 1 | Les deux cercles ont le même rayon AB. P est sur les deux : PA = PB. | PA = PB |
| ↳ Pourquoi 2 | De même, Q est à la même distance de A et de B : QA = QB. | QA = QB |
| ↳ Pourquoi 3 | La droite (PQ) passe donc par le milieu de [AB] et le coupe à angle droit : c’est la médiatrice. | M milieu de [AB] ; angle PMA droit |
| `I.11` Perpendiculaire en un point | Si P est le milieu d’un segment posé sur la droite, la perpendiculaire en P est la médiatrice de ce segment. | P milieu de [AA2] ; A, P, A2 alignés |
| `I.12` Perpendiculaire depuis un point | Un cercle de centre P coupe la droite en deux points à la même distance de P. P est alors sur leur médiatrice. | PA = PA2 ; A, B, A2 alignés ; P sur tracé 2 |
| `I.9` Bissectrice | Pour couper un angle en deux, cherche deux points à la même distance du sommet, un sur chaque côté. | OA = OA2 ; O, B, A2 alignés ; angle AOQ = angle QOA2 |
| `I.31` Parallèle | Deux droites perpendiculaires à une même droite sont parallèles entre elles. | angle AFP droit ; angle UPW droit ; droite l parallèle à tracé 3 |
| ↳ Pourquoi 1 | Le cercle de centre P coupe la droite en A et A′, à la même distance de P. | PA = PA2 |
| ↳ Pourquoi 2 | La médiatrice de [AA′] passe par P et tombe sur la droite à angle droit. | angle AFP droit ; P sur tracé 2 |
| ↳ Pourquoi 3 | Le même cercle coupe cette perpendiculaire en U et V, à la même distance de P. Leur médiatrice est perpendiculaire à (UV) en P. | P milieu de [UV] ; angle UPW droit |
| ↳ Pourquoi 4 | Deux droites perpendiculaires à (UV) sont parallèles : la droite tracée ne coupe jamais la droite de départ. | droite l parallèle à tracé 3 |

## Chapitre 2 · Les angles

| Niveau | Idée | Faits vérifiés |
|---|---|---|
| `angle-60` Angle de 60° | Dans un triangle équilatéral, chaque angle vaut 60°. Construis-en un sur [AB]. | AB = AC = BC ; angle BAC = 60° |
| `angle-30` Angle de 30° | 30°, c’est la moitié de 60°. Coupe en deux l’angle d’un triangle équilatéral. | AB = AC = BC ; A sur tracé 3 ; tracé 3 et droite s font 30° |
| `angle-45` Angle de 45° | Un triangle rectangle avec deux côtés égaux a deux angles de 45°. | angle AMX droit ; MA = MX ; angle MAX = 45° |
| `angle-15` Angle de 15° | Un triangle isocèle avec 30° au sommet a deux angles de 75°. Retire les 60° d’un triangle équilatéral : il reste 15°. | CA = CD ; angle ACD = 30° ; angle CAD = 75° ; angle BAC = 60° ; tracé 4 et droite s font 15° |

## Chapitre 3 · Le cercle donné

| Niveau | Idée | Faits vérifiés |
|---|---|---|
| `cercle-equilateral-b` Triangle équilatéral | Le cercle donné a pour rayon OR. Un point de ce cercle qui est aussi à la distance OR de R fait un triangle équilatéral avec O et R. | OR = OX = RX |
| `cercle-hexagone` Hexagone régulier | Le côté de l’hexagone est égal au rayon. Les deux sommets voisins de R sont à la même distance de O et de R. | OR = OV = RV ; OR = OV2 = RV2 |
| ↳ Pourquoi 1 | Un sommet V voisin de R vérifie VO = VR = OR : le triangle OVR est équilatéral. | OR = OV = RV |
| ↳ Pourquoi 2 | Les points à la même distance de O et de R sont sur la médiatrice de [OR] : elle coupe le cercle en ces deux sommets. | OV = RV ; OV2 = RV2 |
| ↳ Pourquoi 3 | La droite (OR) donne R′, le sommet opposé à R. La médiatrice de [OR′] donne les deux derniers sommets, de la même façon. | R, O, R2 alignés ; OR2 = OW = R2W |
| `cercle-triangle-inscrit` Triangle inscrit | Le triangle inscrit prend un sommet sur deux de l’hexagone. Les deux sommets qui manquent sont les voisins du point opposé à R. | R, O, R2 alignés ; OR2 = OT = R2T ; angle ROT = 120° |
| ↳ Pourquoi 1 | La droite (OR) coupe le cercle en R′, le point opposé à R. | R, O, R2 alignés |
| ↳ Pourquoi 2 | La médiatrice de [OR′] coupe le cercle en T et U, à la distance OR′ de O et de R′ : les triangles OR′T et OR′U sont équilatéraux. | OR2 = OT = R2T ; OR2 = OU = R2U |
| ↳ Pourquoi 3 | De R′ à T, il y a 60° autour de O. De R à T, il y a donc 180° − 60° = 120°, et de même de R à U : RTU est équilatéral. | angle ROT = 120° ; angle ROU = 120° ; RT = TU = UR |
| `cercle-mediatrice-b` Médiatrice | Le cercle donné et un cercle de même rayon centré en R se croisent en deux points à la même distance de O et de R. | OX = RX ; OY = RY |
| `cercle-carre-inscrit` Carré inscrit | Les diagonales d’un carré inscrit sont deux diamètres perpendiculaires. | R, O, R2 alignés ; angle ROV droit ; V sur le cercle de centre O passant par R |
| `cercle-centre` Centre du cercle | Le centre est à la même distance de tous les points du cercle : il est sur la médiatrice de chaque corde. Deux médiatrices suffisent. | O sur tracé 1 ; O sur tracé 2 |
| `cercle-triangle-inscrit-b` Triangle inscrit | Les deux sommets qui manquent sont les voisins, sur l’hexagone, du point opposé à R : à la distance du rayon de ce point. | R, O, R2 alignés ; OR = R2T = OT ; angle ROT = 120° |
| `cercle-hexagone-b` Hexagone régulier | Le côté de l’hexagone est égal au rayon : un cercle de même rayon, centré sur un sommet, coupe le cercle donné aux deux sommets voisins. | OR = RV = OV ; R, O, R2 alignés ; OR = R2W = OW |
| `cercle-carre` Carré | Un angle droit, c’est 60° + 30°. Le triangle équilatéral sur [OR] donne 60°, et couper cet angle en deux donne 30°. | OR = OE = RE ; angle ORF = 30° ; EF = EC = ED ; angle ORC = 90° ; angle ROD = 90° |
| `cercle-milieu-arc` Milieu d'un arc | Quatre longueurs égales au rayon font un losange. La diagonale d’un losange coupe son angle en deux, donc l’arc aussi. | OR = RZ = ZS = SO ; angle ROZ = angle ZOS |
| `cercle-centre-b` Centre du cercle | Le centre fait un triangle équilatéral avec deux points du cercle séparés d’un sixième de tour, comme dans l’hexagone. Trouve d’abord un tel point, puis deux cercles retrouvent le centre. | W sur le cercle de centre O passant par R ; OS = OW = SW |

## Chapitre 4 · Sans médiatrice

| Niveau | Idée | Faits vérifiés |
|---|---|---|
| `sm-symetrique` Symétrique | Le symétrique de P est à la même distance que P de chaque point de la droite. Prends deux points de la droite comme centres. | AP = AP2 ; BP = BP2 ; (PP2) et droite l font 90° |
| `sm-perpendiculaire` Perpendiculaire depuis un point | La droite qui joint P à son symétrique par rapport à (AB) est perpendiculaire à (AB). | AP = AP2 ; BP = BP2 ; tracé 3 et droite l font 90° |
| `sm-angle-30` Angle de 30° | Un triangle isocèle avec 120° au sommet a deux angles de 30°. Et 120°, c’est 180° − 60°. | BA2 = BZ = A2Z ; BA = BZ ; angle ABZ = 120° ; angle BAZ = 30° |
| `sm-angle-60` Angle de 60° | Les angles de 60° viennent des triangles équilatéraux. Le symétrique de P en donne un avec le centre A. | AP2 = AW = P2W ; angle P2AW = 60° ; tracé 4 et droite l font 60° |
| `sm-mediatrice` Médiatrice | Reviens à l’idée de départ : il te faut deux points, chacun à la même distance de A et de B. | AX = BX ; AY = BY |
| `sm-milieu` Milieu | Le milieu de [AB] est là où la médiatrice coupe le segment. | AX = BX ; AY = BY ; M milieu de [AB] |
| `sm-parallele` Parallèle | Deux triangles isocèles qui se touchent par un sommet ont des angles égaux. Des angles alternes égaux font des droites parallèles. | BX = BC ; AX = AY ; C, X, Y alignés ; angle AYX = angle BCX ; tracé 4 parallèle à droite a |
| `sm-thales` Perpendiculaire en un point | Tout point d’un cercle voit un diamètre de ce cercle sous un angle droit. | X, A, Y alignés ; C sur le cercle de centre A passant par X ; Y sur le cercle de centre A passant par X ; angle XCY droit |
| `sm-angle-75` Angle de 75° | Dans un triangle isocèle dont l’angle au sommet vaut 30°, les deux autres angles valent 75°. Il te faut donc d’abord un angle de 30°. | BA = BE ; angle ABE = 30° ; angle BAE = 75° |
| ↳ Pourquoi 1 | ABC est équilatéral : l’angle en A vaut 60°. | AB = AC = BC ; angle BAC = 60° |
| ↳ Pourquoi 2 | D est de l’autre côté de A sur le même cercle : AD = AB et l’angle BAD vaut 180° − 60° = 120°. Le triangle ABD est isocèle : ses deux autres angles valent 30°. | AB = AD ; angle BAD = 120° ; angle ABD = 30° |
| ↳ Pourquoi 3 | E est sur le cercle de centre B : BE = BA. Le triangle ABE est isocèle avec 30° au sommet B : ses deux autres angles valent (180° − 30°) ÷ 2 = 75°. | BA = BE ; angle ABE = 30° ; angle BAE = 75° ; angle AEB = 75° |
| `sm-bissectrice` Bissectrice | Avec quatre côtés égaux, on obtient un losange. La diagonale d’un losange coupe son angle en deux. | CB = BW = WZ = ZC ; C, Z, A alignés ; angle BCW = angle WCA |

## Chapitre 5 · Centres et tangentes

| Niveau | Idée | Faits vérifiés |
|---|---|---|
| `ct-centre-circonscrit` Centre du cercle circonscrit | Un point de la médiatrice de [AB] est à la même distance de A et de B. Sur deux médiatrices à la fois, il est à la même distance des trois sommets. | KA = KB = KC |
| `ct-bissectrice` Bissectrice | Prends deux points à la même distance du sommet, un sur chaque côté : leur médiatrice coupe l’angle en deux. | CA = CX ; C, X, B alignés ; angle ACQ = angle QCX |
| `ct-cercle-circonscrit` Cercle circonscrit | Le centre du cercle est à la même distance des trois sommets : il est sur les médiatrices des côtés. | KA = KB = KC |
| `ct-centre-gravite` Centre de gravité | Une médiane relie un sommet au milieu du côté opposé. La médiatrice d’un côté donne son milieu. Deux médianes suffisent. | Mb milieu de [AC] ; Mc milieu de [AB] ; B, Mb, G alignés ; C, Mc, G alignés |
| `ct-tangente-en` Tangente en un point | La tangente en R est la droite perpendiculaire au rayon [OR], au point R. | R sur tracé 3 ; angle ORT droit |
| `ct-centre-inscrit` Centre du cercle inscrit | La bissectrice de l’angle C et la médiatrice de [AB] se coupent en un point à la même distance de A, de B et du centre du cercle inscrit. | SA = SB = SI ; angle ACI = angle ICB ; angle CAI = angle IAB |
| `ct-tangente` Tangente depuis un point | Une tangente est perpendiculaire au rayon, au point où elle touche le cercle. Les points qui voient [OP] sous un angle droit sont sur le cercle de diamètre [OP]. | M milieu de [OP] ; T sur le cercle de centre M passant par O ; T sur le cercle de centre O passant par R ; angle OTP droit |
| `ct-orthocentre` Orthocentre | Une hauteur part d’un sommet et tombe à angle droit sur le côté opposé. Deux hauteurs suffisent : la troisième passe aussi par leur croisement. | tracé 4 et droite a font 90° ; tracé 3 et droite c font 90° ; C sur tracé 3 ; (BH) et droite b font 90° |
| `ct-tangente-en-b` Tangente en un point | Un point d’un cercle voit un diamètre sous un angle droit. Cherche un cercle qui passe par R et dont un diamètre part de O. | O, X, W alignés ; XO = XR = XW ; angle ORW droit |
| `ct-deux-tangentes` Les deux tangentes | Le cercle de diamètre [OP] coupe le cercle donné aux deux points de contact : là, l’angle entre le rayon et la droite issue de P est droit. | M milieu de [OP] ; angle OTP droit ; angle OUP droit ; T sur le cercle de centre O passant par R ; U sur le cercle de centre O passant par R |

## Chapitre 6 · Carrés et partages

| Niveau | Idée | Faits vérifiés |
|---|---|---|
| `cp-report-b` Report de longueur | Le cercle de centre B passant par A contient tous les points à la distance BA de B. Prolonge d’abord le segment. | BA = BC ; A, B, C alignés |
| `cp-partage-4` Partage en quatre | Partager en quatre, c’est partager en deux, puis encore en deux. | M milieu de [AB] ; M1 milieu de [AM] ; M2 milieu de [MB] |
| `cp-perpendiculaire` Perpendiculaire en un point | Si A est le milieu d’un segment de la droite (AB), la médiatrice de ce segment est perpendiculaire en A. | A milieu de [BB2] ; A sur tracé 3 ; tracé 3 et tracé 1 font 90° |
| `cp-carre` Carré | Un angle droit, c’est 60° + 30°. Le triangle équilatéral sur [AB] donne 60°, et couper cet angle en deux donne 30°. | AB = AE = BE ; angle ABF = 30° ; EF = EC = ED ; angle ABC = 90° ; angle BAD = 90° ; AB = BC = AD |
| `cp-parallelogramme` Parallélogramme | Les diagonales d’un parallélogramme se coupent en leur milieu. D est donc le symétrique de B par rapport au milieu de [AC]. | M milieu de [AC] ; M milieu de [BD] |
| `cp-losange` Losange | Un losange a quatre côtés égaux. Le dernier sommet est à la distance OA à la fois de A et du sommet posé sur (OB). | OA = OA2 = AD = A2D ; O, B, A2 alignés |
| `cp-partage-3` Partage en trois | Un triangle avec deux angles de 30° sur [AB] cache en son milieu un triangle équilatéral : les trois morceaux de [AB] sont égaux. | angle GAB = 30° ; angle GBA = 30° ; P1G = P1P2 = P2G ; AP1 = P1P2 = P2B |
| `cp-carre-rc` Carré | Un angle droit, c’est 60° + 30°. Un triangle isocèle avec 120° au sommet donne les 30° qui manquent. | AB = AX = EX = EA ; angle BAX = 120° ; angle ABY = 30° ; EY = EC = ED ; angle ABC = 90° ; angle BAD = 90° |
| `cp-partage-3-b` Partage en trois | Dans un triangle, deux médianes se coupent aux deux tiers de chacune. Fabrique un triangle dont [OB] est une médiane. | A milieu de [OX] ; B milieu de [XY] ; O, G, B alignés ; OP1 = P1G = GB |

50 niveaux sur 50 ont une idée.
