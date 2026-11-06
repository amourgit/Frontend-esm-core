/**
 * Logos du projet — ré-export de la source unique `<racine du dépôt>/branding/`.
 *
 * Importer les logos depuis ce module uniquement (jamais le PNG directement, jamais de copie
 * locale) : voir branding/README.md. N'exporter ici que les variantes réellement utilisées par
 * l'app : chaque import est embarqué dans son bundle.
 *
 * Deux marques à ne pas confondre : EGEN est le produit, CIVITAS l'entreprise qui l'a créé.
 *
 *  - `egenLogoFull` : logo + « EGEN » écrit (connexion, en-têtes)
 *  - `civitasLogoWordmark` : « CIVITAS » seul, logo argenté à poser sur fond sombre (pied de page : « créé par »)
 *  - `civitasWebsite` : site de CIVITAS, cible du lien du logo CIVITAS
 */
import civitasLogoWordmark from '../../../../branding/civitas-logo-wordmark.png';
import egenLogoFull from '../../../../branding/egen-logo-full.png';

export const civitasWebsite = 'https://civitas-africa.vercel.app/';

export { civitasLogoWordmark, egenLogoFull };
