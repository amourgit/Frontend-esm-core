/**
 * Logos EGEN — ré-export de la source unique `<racine du dépôt>/branding/`.
 *
 * Importer les logos depuis ce module uniquement (jamais le PNG directement, jamais de copie
 * locale) : voir branding/README.md. N'exporter ici que les variantes réellement utilisées par
 * l'app : chaque import est embarqué dans son bundle.
 *
 *  - `egenLogoFull` : logo + « EGEN » écrit (connexion, en-têtes, pied de page)
 */
import egenLogoFull from '../../../../branding/egen-logo-full.png';

export { egenLogoFull };
