# Règle et Compas

Énigmes de géométrie à la règle et au compas, d'après les *Éléments* d'Euclide.
Chaque niveau demande de construire une figure exacte en un nombre de coups limité.

**Jouer** : https://arnold-43.github.io/regle-et-compas/
Sur Android, ouvrir le lien dans Chrome puis « Installer l'application ».

## Développement

```bash
npm test        # tests des niveaux
npm run dev     # http://localhost:8000
npm run build   # dist/ avec la version gravée
```

Chaque push sur `main` lance les tests puis publie sur GitHub Pages.
Voir [CLAUDE.md](CLAUDE.md) pour l'architecture, les règles de conception et la feuille de route.
