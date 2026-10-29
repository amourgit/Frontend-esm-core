import { interpolateUrl, navigate } from '@egen-civitas/esm-framework';

/** Navigation depuis une extension (hors du routeur de l'app hôte) : `go('/informations/news')`. */
export const go = (path: string) => navigate({ to: interpolateUrl(`\${egenSpaBase}${path}`) });
