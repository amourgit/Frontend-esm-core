# Character Factory — Inventaire des dépendances d'assets (F6.4)

Dernière vérification : sur le code et `src/public/manifest.json` du Core (branche `feature/character-factory`).

## 1. Embarqué dans l'application (`dist/character-factory-assets`, ~115 Mo avant compression)

| Contenu | Poids | Rôle |
|---|---|---|
| `sound/` | 52 Mo | Musique de fond et effets |
| `sprite-atlas-assets/`, `lora-assets/` | 21 Mo chacun | Manifestes et animations des modes sprites / LoRA |
| `assets/` | 11 Mo | Portraits, icônes, médias d'interface |
| `hdr/`, `ktx2/`, `textures/`, `3d/`, `thumbnail-assets/` | ~10 Mo | Éclairage, décodeur KTX2, textures, miniatures |
| `manifest.json` (racine) | — | Liste des personnages proposés + animations par défaut (4) |

## 2. Dépendances externes réelles

### 2.1 Personnages — **bloquant pour l'usage**
Les 4 personnages du manifeste racine ne sont pas embarqués :

| Personnage | Manifeste | État |
|---|---|---|
| Anata (femme) | `https://m3-org.github.io/loot-assets/anata/female/manifest.json` | Externe |
| Anata (homme) | `./loot-assets/anata/male/manifest.json` | **Absent du dépôt** (récupéré à part en amont par `npm run get-assets`) |
| ON1FORCE | `https://m3-org.github.io/loot-assets/0N1/manifest.json` | Externe |
| TUBBY CAT | `https://m3-org.github.io/loot-assets/tubbycats/manifest.json` | Externe |

Conséquence : sans accès à `m3-org.github.io`, **aucun personnage n'est utilisable**. Les modèles 3D, textures et miniatures référencés par ces manifestes sont eux aussi servis par ce site.

### 2.2 Blockchain (isolée en phase 15)
RPC et explorateurs référencés par le code : `polygon-rpc.com`, `polygonscan.com`, `etherscan.io`, `goerli.etherscan.io`, `rpc.ankr.com`, `mainnet.infura.io`, `api.mainnet-beta.solana.com`, `devnet.helius-rpc.com`. N'interviennent que sur les parcours NFT / wallet / mint.

## 3. Réglage `assetBaseUrl`

Défini dans `config-schema.ts`, appliqué par `applyAssetBase()` avant le chargement du moteur.
- **Vide (défaut)** : les assets embarqués sont servis depuis l'application.
- **Renseigné** (ex. `https://assets.egen.example/character-factory`) : toute lecture d'asset passe par cette base (`manifest.json`, HDR, icônes, sons, sprites…). Le slash final est ignoré.

**Limite** : ce réglage ne redirige **pas** les URLs absolues `https://m3-org.github.io/...` inscrites dans le manifeste racine.

## 4. Procédure de rapatriement (décision D2)

1. Vérifier les licences du dépôt `M3-org/loot-assets` (par collection : Anata, 0N1, Tubby Cats).
2. Copier les collections retenues sous `<assetBaseUrl>/loot-assets/...`.
3. Dans le manifeste racine, remplacer les URLs `https://m3-org.github.io/loot-assets/...` par des chemins relatifs `./loot-assets/...` (le code les résout déjà contre la base d'assets).
4. Vérifier dans les manifestes copiés qu'aucune URL absolue ne subsiste (`assetsLocation`, `traitsDirectory`…).
5. Tester : chaque personnage se charge, ses traits et miniatures s'affichent, l'export VRM fonctionne.

À terme (phases 7 et 8), ces collections deviennent des **Ressources** servies par le backend EGEN.
