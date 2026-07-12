# @egen/esm-footer-app

Micro-frontend affichant le pied de page minimaliste de la plateforme EGEN :
les informations de l'entreprise à l'origine du projet (nom, accroche,
copyright, liens secondaires optionnels).

## Présence

Le footer est monté via la même règle de routage que la barre de navigation
primaire (`esm-primary-navigation-app`) : il est exclu des routes publiques
(`login`, `logout`, `home`, `change-password`, `tenant-suspended`) et
présent sur **toutes les pages authentifiées**, donc sur exactement les
mêmes pages que la navbar.

## Configuration

Tout le contenu est piloté par `config-schema.ts` (aucune valeur en dur) :

```json
{
  "@egen/esm-footer-app": {
    "company": {
      "name": "CIVITAS",
      "tagline": "Solutions d'intégration IA",
      "url": "https://civitas.example"
    },
    "copyright": {
      "showYear": true,
      "text": "Tous droits réservés"
    },
    "links": [
      { "title": "Mentions légales", "url": "https://civitas.example/legal" },
      { "title": "Contact", "url": "/contact" }
    ]
  }
}
```

Une surcharge par tenant peut personnaliser librement chacune de ces clés
(nom d'entreprise en marque blanche, liens différents, etc.), suivant le même
mécanisme générique que le reste du thème/config EGEN.

## Design

Voir `docs/guide-composants-et-theme.md` à la racine du monorepo. Ce
composant :

- N'utilise aucune couleur codée en dur — uniquement `var(--colors-*)` /
  `var(--typography-*)` / `var(--transitions-*)`.
- N'est pas une surface "glass" flottante (`--panel-*`) : il vit dans le flux
  normal du document, en bas de page — d'où l'usage des tokens
  `--colors-surface-muted*`, sémantiquement adaptés à une zone secondaire.
- S'empile verticalement et se centre sur mobile (`≤ 672px`).

## Garde d'authentification

`Footer` (dans `components/footer/footer.component.tsx`) ne rend rien tant
que `useSession()` n'indique pas un utilisateur authentifié. Il ne redirige
jamais — cette responsabilité reste exclusivement à `TopBar` et aux guards de
tenant, le footer est un composant purement passif.
