# PHASE 4 — Refonte Visuelle EIGEN

> Durée estimée : 2-3 jours
> Branche : `egen/phase-4-design`
> Objectif : Donner une identité visuelle propre à EIGEN sans toucher au fonctionnement du système.

---

## 4.1 Stratégie de design

### Ce qui CHANGE (identité visuelle)
- Palette de couleurs (Egen bleu/teal → EIGEN couleurs nationales)
- Logo (SVG EIGEN)
- Typographie (optionnel)
- Nom dans les UI textes ("Egen" → "EIGEN")
- Textes des boutons, titres de pages
- Page de login (layout, image de fond, message d'accueil)
- Favicon et icônes PWA

### Ce qui NE CHANGE PAS (fonctionnement)
- La structure des composants Carbon (Header, Modal, Notification, etc.)
- Le système d'extension slots
- La logique de routing
- Les animations CSS Carbon

---

## 4.2 Palette de couleurs EIGEN

Définir les couleurs officielles EIGEN. Exemple pour une plateforme éducative nationale :

```scss
// packages/framework/esm-styleguide/src/components/_colors.scss

:root {
  /* ═══════════════════════════════════════════
     EIGEN — Système de couleurs
     ═══════════════════════════════════════════ */

  /* Fonds */
  --egen-color-bg-high-contrast: #ffffff;
  --egen-color-bg-medium-contrast: rgba(249, 249, 249, 0.94);
  --egen-color-bg-low-contrast: #f0f4ff;
  --egen-color-bg-lowest-contrast: #e8edf8;

  /* Textes */
  --egen-color-ink-high-contrast: #0d1b3e;
  --egen-color-ink-medium-contrast: rgba(13, 27, 62, 0.7);
  --egen-color-ink-low-contrast: rgba(13, 27, 62, 0.4);
  --egen-color-ink-white: #ffffff;

  /* Couleur principale — Bleu national EIGEN */
  --egen-color-primary-dark: #0a2463;
  --egen-color-primary: #1a4fba;
  --egen-color-primary-light: #2d6cdf;
  --egen-color-primary-subtle: rgba(26, 79, 186, 0.08);

  /* Couleur secondaire — Vert (éducation, croissance) */
  --egen-color-secondary-dark: #0d5c2e;
  --egen-color-secondary: #1a8c4e;
  --egen-color-secondary-light: #24b865;
  --egen-color-secondary-subtle: rgba(26, 140, 78, 0.08);

  /* Accent — Or (excellence académique) */
  --egen-color-accent: #c8942a;
  --egen-color-accent-light: #f5c842;
  --egen-color-accent-subtle: rgba(200, 148, 42, 0.1);

  /* Statuts */
  --egen-color-success: #0d5c2e;
  --egen-color-success-bg: #e8f5ee;
  --egen-color-warning: #7d5500;
  --egen-color-warning-bg: #fff4e0;
  --egen-color-danger: #9e1515;
  --egen-color-danger-bg: #fdeaea;
  --egen-color-info: #0a2463;
  --egen-color-info-bg: #e8edf8;

  /* Marque nationale */
  --egen-color-brand-bleu: #0a2463;
  --egen-color-brand-vert: #1a8c4e;
  --egen-color-brand-or: #c8942a;
  --egen-color-brand-blanc: #ffffff;

  /* Compatibilité avec anciens --egen-* (à garder pendant transition) */
  --egen-color-bg-high-contrast: var(--egen-color-bg-high-contrast);
  --egen-color-bg-medium-contrast: var(--egen-color-bg-medium-contrast);
  --egen-color-bg-low-contrast: var(--egen-color-bg-low-contrast);
  --egen-color-ink-high-contrast: var(--egen-color-ink-high-contrast);
  --egen-color-interaction: var(--egen-color-primary);
  --egen-color-interaction-plus-one: var(--egen-color-primary-dark);
  --egen-color-brand-orange: var(--egen-color-accent);
  --egen-color-brand-teal: var(--egen-color-secondary);
}
```

### Intégration Carbon avec les couleurs EIGEN

Carbon utilise ses propres variables CSS. Pour les surcharger :

```scss
// packages/framework/esm-styleguide/src/_vars.scss
// Ajouter en HAUT du fichier :

// Surcharges Carbon pour EIGEN
$interactive-01: #1a4fba;     // Boutons primaires
$interactive-02: #0a2463;     // Fond header
$brand-01: #0a2463;           // Marque
$brand-02: #1a8c4e;
$brand-03: #c8942a;
$focus: #1a4fba;              // Outline de focus
$link-01: #1a4fba;            // Liens
$support-01: #9e1515;         // Danger
$support-02: #0d5c2e;         // Succès
$support-03: #7d5500;         // Warning
$support-04: #0a2463;         // Info
```

---

## 4.3 Logo EIGEN

### Créer le SVG du logo EIGEN

Remplacer les logos Egen dans :
- `packages/framework/esm-styleguide/src/logo/` → Sprites SVG
- `packages/apps/esm-login-app/src/logo.component.tsx`
- `packages/apps/esm-primary-navigation-app/src/components/logo/logo.component.tsx`

**Créer** `packages/framework/esm-styleguide/src/logo/egen-logo.svg` :

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" role="img">
  <title>EIGEN — Plateforme Éducative Nationale</title>
  <!-- Logo EIGEN : E + livre ouvert stylisé -->
  <rect x="0" y="0" width="200" height="50" fill="none"/>
  
  <!-- Icône livre stylisée -->
  <g transform="translate(0, 5)">
    <path d="M5 5 L20 5 L20 35 L5 35 Z" fill="#1a4fba"/>
    <path d="M20 5 L35 5 L35 35 L20 35 Z" fill="#1a8c4e"/>
    <path d="M20 5 L20 35" stroke="white" stroke-width="1.5"/>
    <!-- Pages du livre -->
    <line x1="8" y1="12" x2="17" y2="12" stroke="white" stroke-width="1.5"/>
    <line x1="8" y1="17" x2="17" y2="17" stroke="white" stroke-width="1.5"/>
    <line x1="8" y1="22" x2="17" y2="22" stroke="white" stroke-width="1.5"/>
    <line x1="23" y1="12" x2="32" y2="12" stroke="white" stroke-width="1.5"/>
    <line x1="23" y1="17" x2="32" y2="17" stroke="white" stroke-width="1.5"/>
    <line x1="23" y1="22" x2="32" y2="22" stroke="white" stroke-width="1.5"/>
    <!-- Étoile académique -->
    <polygon points="20,0 22,6 28,6 23,10 25,16 20,12 15,16 17,10 12,6 18,6" 
             fill="#c8942a" transform="translate(0, -3)"/>
  </g>
  
  <!-- Texte EIGEN -->
  <text x="42" y="28" font-family="IBM Plex Sans, sans-serif" font-size="22" 
        font-weight="700" fill="#0a2463" letter-spacing="2">EIGEN</text>
        
  <!-- Sous-titre optionnel -->
  <!-- <text x="42" y="40" font-family="IBM Plex Sans, sans-serif" font-size="8" 
        fill="#1a4fba" letter-spacing="1">ÉDUCATION NATIONALE</text> -->
</svg>
```

### Sprite SVG pour le shell (logo blanc pour header dark)

Créer `packages/framework/esm-styleguide/src/logo/egen-sprite.svg` :

```svg
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <!-- Logo couleur pour fond blanc (login page) -->
  <symbol id="egen-logo-full-color" viewBox="0 0 200 50">
    <!-- ... même SVG avec couleurs bleues/vertes/or ... -->
  </symbol>
  
  <!-- Logo blanc pour fond sombre (header de navigation) -->
  <symbol id="egen-logo-white" viewBox="0 0 200 50">
    <!-- ... même SVG mais tout en blanc ... -->
  </symbol>
  
  <!-- Icône seule (32x32, pour favicon et notifications) -->
  <symbol id="egen-icon" viewBox="0 0 32 32">
    <!-- ... juste le livre + étoile ... -->
  </symbol>
</svg>
```

### Adapter les composants Logo

**`packages/apps/esm-primary-navigation-app/src/components/logo/logo.component.tsx`** :

```tsx
const Logo: React.FC = () => {
  const { logo } = useConfig<ConfigSchema>();

  return (
    <>
      {logo?.src ? (
        <img alt={logo.alt || 'EIGEN Logo'} className={styles.logo} src={interpolateUrl(logo.src)} />
      ) : logo?.name ? (
        logo.name
      ) : (
        <svg aria-label="EIGEN — Plateforme Éducative Nationale" role="img" width={130} height={40}>
          <use href="#egen-logo-white" />
        </svg>
      )}
    </>
  );
};
```

---

## 4.4 Refonte de la page de Login

### Style général de la page login

**Fichier** : `packages/apps/esm-login-app/src/login/login.scss`

```scss
.container {
  display: flex;
  height: 100vh;
  background-color: var(--egen-color-bg-low-contrast);
}

// Panneau gauche - Branding EIGEN
.brandingPanel {
  flex: 0 0 45%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(
    145deg,
    var(--egen-color-primary-dark) 0%,
    var(--egen-color-primary) 50%,
    var(--egen-color-secondary) 100%
  );
  padding: 3rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -30%;
    width: 80%;
    height: 160%;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 50%;
  }

  @media (max-width: 768px) {
    display: none;
  }
}

.brandingTitle {
  color: white;
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.brandingSubtitle {
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  font-size: 1rem;
}

.brandingLogo {
  margin-bottom: 2.5rem;
  width: 180px;
}

// Panneau droit - Formulaire
.formPanel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  background: white;
}

.formContainer {
  width: 100%;
  max-width: 400px;
}

.formTitle {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--egen-color-ink-high-contrast);
  margin-bottom: 0.5rem;
}

.formSubtitle {
  color: var(--egen-color-ink-medium-contrast);
  margin-bottom: 2rem;
}

.loginButton {
  width: 100%;
  background-color: var(--egen-color-primary) !important;
  
  &:hover {
    background-color: var(--egen-color-primary-dark) !important;
  }
}
```

### Modifier le component login pour le nouveau design

**Fichier** : `packages/apps/esm-login-app/src/login/login.component.tsx`

```tsx
// Ajouter le panneau de branding gauche
return (
  <div className={styles.container}>
    {/* Panneau gauche - Branding */}
    <div className={styles.brandingPanel}>
      <img src="/egen-logo-white.svg" alt="EIGEN" className={styles.brandingLogo} />
      <h1 className={styles.brandingTitle}>
        Plateforme Éducative Nationale
      </h1>
      <p className={styles.brandingSubtitle}>
        Gérez efficacement votre établissement scolaire avec EIGEN
      </p>
    </div>

    {/* Panneau droit - Formulaire */}
    <div className={styles.formPanel}>
      <div className={styles.formContainer}>
        <h2 className={styles.formTitle}>Connexion</h2>
        <p className={styles.formSubtitle}>
          Accédez à votre espace EIGEN
        </p>
        
        {/* Formulaire existant reste ici */}
        {/* ... */}
      </div>
    </div>
  </div>
);
```

---

## 4.5 Adaptation de la navigation principale

### Couleur du header

**Fichier** : `packages/apps/esm-primary-navigation-app/src/components/navbar/navbar.scss`

```scss
.topNavHeader {
  // Carbon Header en bleu EIGEN
  background-color: var(--egen-color-primary-dark) !important;
  border-bottom: 3px solid var(--egen-color-accent) !important; // Filet or

  :global(.cds--header__name) {
    color: white;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  :global(.cds--header__action) {
    color: white;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
}
```

---

## 4.6 Remplacer les textes "Egen" dans l'UI

```bash
# Chercher tous les textes "Egen" dans les fichiers de traduction et composants
grep -r "Egen\|egen" packages/apps --include="*.json" --include="*.tsx" | grep -v "node_modules"
```

### Fichiers de traduction

Dans chaque app, modifier `translations/en.json` et `translations/fr.json` :

**`packages/apps/esm-login-app/translations/fr.json`** :
```json
{
  "egenLogo": "Logo EIGEN",
  "loginHeader": "Connexion à EIGEN",
  "username": "Identifiant",
  "password": "Mot de passe",
  "login": "Se connecter",
  "selectLocation": "Choisir votre établissement",
  "confirmLocation": "Confirmer",
  "loadingText": "Connexion en cours...",
  "invalidCredentials": "Identifiant ou mot de passe incorrect",
  "networkError": "Erreur de connexion réseau",
  "changePassword": "Changer mon mot de passe",
  "logout": "Se déconnecter"
}
```

**`packages/apps/esm-primary-navigation-app/translations/fr.json`** :
```json
{
  "openMenu": "Ouvrir le menu",
  "closeMenu": "Fermer le menu",
  "userMenuButton": "Mon compte",
  "appMenuButton": "Applications",
  "changeLanguage": "Changer la langue",
  "home": "Accueil",
  "platform": "EIGEN — Plateforme Éducative Nationale"
}
```

---

## 4.7 Favicon et icônes

### Remplacer le favicon

1. Créer `packages/shell/esm-app-shell/src/assets/egen-favicon.ico`
2. Créer `packages/shell/esm-app-shell/src/assets/egen-icon-192.png`
3. Créer `packages/shell/esm-app-shell/src/assets/egen-icon-512.png`

Dans `packages/shell/esm-app-shell/src/index.ejs` :
```html
<link rel="icon" href="./egen-favicon.ico" type="image/x-icon" />
<link rel="apple-touch-icon" href="./egen-icon-192.png" />
```

---

## ✅ Checklist Phase 4

- [ ] Variables CSS couleurs EIGEN définies
- [ ] Variables Carbon surchargées avec couleurs EIGEN
- [ ] Logo SVG EIGEN créé (couleur + blanc)
- [ ] Sprite SVG intégré dans le shell
- [ ] Composants Logo des apps mis à jour
- [ ] Page login repensée (layout 2 colonnes)
- [ ] SCSS login avec nouveau design
- [ ] Couleur header navigation mise à jour
- [ ] Fichiers de traduction FR créés pour toutes les apps
- [ ] Tous les textes "Egen" remplacés par "EIGEN"
- [ ] Favicon et icônes PWA créés
- [ ] Test visuel sur mobile + desktop
