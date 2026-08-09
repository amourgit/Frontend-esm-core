// =============================================================================
//  @egen/esm-ai-tools — Tools natifs EGEN
//
//  Tous les imports utilisent les barrels publics @egen/* officiels.
//  Signatures d'appel vérifiées contre les types réels du framework :
//    showNotification(NotificationDescriptor) → { description: string, kind?, title?, ... }
//    showSnackbar(SnackbarDescriptor)         → { title: string, subtitle?, kind?, ... }
//    showModal(name, props?, onClose?)
//    egenFetch(path, config?)                 → Promise<FetchResponse<T>>
//    navigate({ to })
// =============================================================================

import { navigate } from '@egen/esm-navigation';
import { showNotification, showSnackbar, showModal } from '@egen/esm-styleguide/src/public';
import { egenFetch } from '@egen/esm-api';
import { inferRootDomain, buildTenantSubdomainUrl, getTenantStoreState } from '@egen/esm-tenant';
import type { AIToolDefinition } from '../types';
import { getRoutesCatalogForLLM } from '../routes';
import { getVisibleUIActions, getUIActionElement, setNativeInputValue } from '../ui-actions';
import { getObservablesCatalogForLLM } from '../observables';
import { describeCurrentScreen } from './describe-screen';

export type { DescribedElement, DescribedHeading, ScreenDescription } from './describe-screen';

// ─── navigate ─────────────────────────────────────────────────────────────────

export const navigateTool: AIToolDefinition = {
  id: 'navigate',
  name: 'Naviguer vers une route',
  description:
    "Navigue vers une route interne de l'application EGEN. Utiliser pour emmener l'utilisateur sur une page " +
    'spécifique. IMPORTANT : ne JAMAIS deviner un chemin. Le chemin exact doit provenir soit du catalogue de ' +
    "routes déjà fourni dans le contexte, soit d'un appel préalable au tool list_routes si le contexte ne " +
    "suffit pas ou semble incomplet.",
  parameters: {
    route: {
      type: 'string',
      required: true,
      description: 'Route applicative cible, relative à la racine de la SPA (ex: "/students/123", "/login").',
    },
  },
  moduleName: '@egen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      const route = String(ctx.args.route);
      // navigate() (voir @egen/esm-navigation) ne déclenche une vraie
      // navigation SPA (navigateToUrl) QUE si la cible commence déjà par
      // egenSpaBase (ex: "/egen/spa") — sinon elle fait un rechargement
      // complet de page (window.location.assign), ce qui casse l'état de
      // l'application et l'expérience de navigation. On ne peut pas
      // compter sur le LLM pour toujours préfixer ${egenSpaBase} lui-même
      // (il renvoie naturellement des chemins "logiques" comme "/login") —
      // c'est donc CE tool, de façon déterministe, qui résout la route
      // reçue vers le chemin SPA correct avant d'appeler navigate().
      const isAbsoluteUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(route);
      const isAlreadyResolved = route.includes('${egenBase}') || route.includes('${egenSpaBase}');
      const target = isAbsoluteUrl || isAlreadyResolved ? route : `\${egenSpaBase}${route.startsWith('/') ? '' : '/'}${route}`;

      navigate({ to: target });
      return { success: true, data: { route: target }, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── show_notification ────────────────────────────────────────────────────────

export const showNotificationTool: AIToolDefinition = {
  id: 'show_notification',
  name: 'Afficher une notification',
  description: "Affiche une notification inline à l'utilisateur (succès, erreur, avertissement, information).",
  parameters: {
    description: {
      type: 'string',
      required: true,
      description: 'Message principal de la notification',
    },
    title: { type: 'string', required: false, description: 'Titre optionnel' },
    kind: {
      type: 'string',
      required: false,
      default: 'info',
      enum: ['error', 'info', 'info-square', 'success', 'warning', 'warning-alt'],
      description: 'Type de notification (correspond à NotificationDescriptor.kind)',
    },
    millis: {
      type: 'number',
      required: false,
      default: 5000,
      description: "Durée d'affichage en millisecondes",
    },
  },
  moduleName: '@egen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      showNotification({
        description: String(ctx.args.description),
        title: ctx.args.title ? String(ctx.args.title) : undefined,
        kind: (ctx.args.kind as any) ?? 'info',
        millis: (ctx.args.millis as number) ?? 5000,
      });
      return { success: true, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── show_snackbar ────────────────────────────────────────────────────────────

export const showSnackbarTool: AIToolDefinition = {
  id: 'show_snackbar',
  name: 'Afficher une snackbar',
  description: "Affiche un message snackbar temporaire en bas de l'écran.",
  parameters: {
    title: { type: 'string', required: true, description: 'Titre de la snackbar (champ obligatoire)' },
    subtitle: { type: 'string', required: false, description: 'Sous-titre ou message détaillé' },
    kind: {
      type: 'string',
      required: false,
      default: 'info',
      enum: ['success', 'error', 'warning', 'info'],
      description: 'Type de snackbar',
    },
    timeoutInMs: {
      type: 'number',
      required: false,
      default: 5000,
      description: "Durée d'affichage",
    },
  },
  moduleName: '@egen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      showSnackbar({
        title: String(ctx.args.title),
        subtitle: ctx.args.subtitle ? String(ctx.args.subtitle) : undefined,
        kind: (ctx.args.kind as any) ?? 'info',
        timeoutInMs: (ctx.args.timeoutInMs as number) ?? 5000,
      });
      return { success: true, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── open_modal ───────────────────────────────────────────────────────────────

export const openModalTool: AIToolDefinition = {
  id: 'open_modal',
  name: 'Ouvrir une modale',
  description:
    'Ouvre une modale EGEN identifiée par son nom. La modale doit être préalablement enregistrée par une app.',
  parameters: {
    name: { type: 'string', required: true, description: 'Nom de la modale à ouvrir' },
    props: { type: 'object', required: false, description: 'Props à passer à la modale' },
  },
  moduleName: '@egen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      // showModal(modalName: string, props: ModalProps = {}, onClose: () => void = () => {})
      showModal(String(ctx.args.name), (ctx.args.props as Record<string, unknown>) ?? {}, () => {});
      return { success: true, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── copy_to_clipboard ────────────────────────────────────────────────────────

export const copyToClipboardTool: AIToolDefinition = {
  id: 'copy_to_clipboard',
  name: 'Copier dans le presse-papier',
  description: "Copie du texte dans le presse-papier de l'utilisateur.",
  parameters: {
    text: { type: 'string', required: true, description: 'Texte à copier' },
  },
  moduleName: '@egen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      const text = String(ctx.args.text);
      await navigator.clipboard.writeText(text);
      return { success: true, data: { copiedLength: text.length }, durationMs: 0 };
    } catch (err) {
      return {
        success: false,
        error: `Impossible d'accéder au presse-papier : ${String(err)}`,
        durationMs: 0,
      };
    }
  },
};

// ─── download_file ────────────────────────────────────────────────────────────

export const downloadFileTool: AIToolDefinition = {
  id: 'download_file',
  name: 'Télécharger un fichier',
  description: "Déclenche le téléchargement d'un fichier depuis une URL ou un contenu base64.",
  parameters: {
    url: { type: 'string', required: false, description: 'URL du fichier à télécharger' },
    content: { type: 'string', required: false, description: 'Contenu base64 du fichier' },
    filename: { type: 'string', required: true, description: 'Nom du fichier téléchargé' },
    mimeType: {
      type: 'string',
      required: false,
      default: 'application/octet-stream',
      description: 'Type MIME',
    },
  },
  moduleName: '@egen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      const { url, content, filename, mimeType } = ctx.args as Record<string, string>;
      if (!url && !content) {
        return { success: false, error: '"url" ou "content" est requis', durationMs: 0 };
      }
      const link = document.createElement('a');
      link.download = filename;
      link.href = url ? url : `data:${mimeType ?? 'application/octet-stream'};base64,${content}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true, data: { filename }, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── fetch_data ───────────────────────────────────────────────────────────────

export const fetchDataTool: AIToolDefinition = {
  id: 'fetch_data',
  name: 'Récupérer des données API',
  description: "Effectue une requête GET authentifiée vers l'API EGEN via egenFetch (X-Tenant-ID automatique).",
  parameters: {
    endpoint: {
      type: 'string',
      required: true,
      description: 'Endpoint relatif (ex: "/ws/rest/v1/student?limit=20")',
    },
    queryParams: {
      type: 'object',
      required: false,
      description: "Paramètres de requête supplémentaires (mergeés dans l'URL)",
    },
  },
  moduleName: '@egen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      const endpoint = String(ctx.args.endpoint);
      const queryParams = ctx.args.queryParams as Record<string, string> | undefined;

      let url = endpoint;
      if (queryParams && Object.keys(queryParams).length > 0) {
        const params = new URLSearchParams(queryParams);
        url += (url.includes('?') ? '&' : '?') + params.toString();
      }

      const response = await egenFetch(url);
      return { success: true, data: response.data, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── refresh_data ─────────────────────────────────────────────────────────────

export const refreshDataTool: AIToolDefinition = {
  id: 'refresh_data',
  name: 'Rafraîchir les données',
  description: 'Invalide le cache SWR pour forcer le rechargement des données.',
  parameters: {
    key: {
      type: 'string',
      required: false,
      description: 'Clé SWR à invalider. Si absent, invalide tout.',
    },
  },
  moduleName: '@egen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      const { mutate } = await import('swr');
      const key = ctx.args.key as string | undefined;
      if (key) {
        await mutate(key);
      } else {
        await mutate(() => true, undefined, { revalidate: true });
      }
      return { success: true, data: { key: key ?? 'all' }, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── switch_tenant ────────────────────────────────────────────────────────────

export const switchTenantTool: AIToolDefinition = {
  id: 'switch_tenant',
  name: "Changer d'établissement",
  description: "Redirige l'utilisateur vers un autre établissement (sous-domaine tenant différent).",
  parameters: {
    tenantSlug: {
      type: 'string',
      required: true,
      description: "Slug/identifiant de l'établissement cible",
    },
  },
  moduleName: '@egen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      const slug = String(ctx.args.tenantSlug);
      const hostname = window.location.hostname;
      // Domaine racine : priorité au rootDomain explicitement configuré
      // (EGEN_TENANT_ROOT_DOMAIN / setupTenantSystem({ rootDomain })), avec
      // repli heuristique sinon — même source unique de vérité que le reste
      // du système tenant (@egen/esm-tenant/src/utils/domain-utils.ts),
      // au lieu d'une extraction de domaine réimplémentée localement ici.
      const rootDomain = inferRootDomain(hostname, getTenantStoreState().config.rootDomain);
      const spaBase = window.getEgenSpaBase?.() ?? '/';
      const targetUrl = buildTenantSubdomainUrl(slug, rootDomain, spaBase);
      window.location.href = targetUrl;
      return { success: true, data: { targetUrl }, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── search ──────────────────────────────────────────────────────────────────

export const searchTool: AIToolDefinition = {
  id: 'search',
  name: 'Lancer une recherche globale',
  description: 'Navigue vers la page de recherche EGEN avec un terme prédéfini.',
  parameters: {
    query: { type: 'string', required: true, description: 'Terme de recherche' },
    category: {
      type: 'string',
      required: false,
      description: 'Catégorie (students, courses, reports…)',
    },
  },
  moduleName: '@egen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      const query = String(ctx.args.query);
      const category = ctx.args.category as string | undefined;
      const spaBase = window.getEgenSpaBase?.() ?? '/';
      const route = `${spaBase}search?q=${encodeURIComponent(query)}${
        category ? `&category=${encodeURIComponent(category)}` : ''
      }`;
      navigate({ to: route });
      return { success: true, data: { query, category }, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── list_routes ──────────────────────────────────────────────────────────────

export const listRoutesTool: AIToolDefinition = {
  id: 'list_routes',
  name: 'Lister les routes disponibles',
  description:
    "Retourne le catalogue des routes de l'application connues (chemin, description, paramètres attendus). " +
    "À appeler AVANT navigate quand on n'est pas certain à 100% du chemin exact d'une page — ne JAMAIS deviner " +
    "un chemin de navigation : soit il figure déjà dans le contexte fourni, soit il faut appeler ce tool pour le vérifier.",
  parameters: {},
  moduleName: '@egen/esm-ai-tools',
  execute: async () => {
    try {
      return { success: true, data: { routes: getRoutesCatalogForLLM() }, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── list_ui_actions ──────────────────────────────────────────────────────────

export const listUIActionsTool: AIToolDefinition = {
  id: 'list_ui_actions',
  name: "Lister les actions possibles sur l'écran courant",
  description:
    "Retourne le catalogue des boutons, liens et champs actuellement VISIBLES à l'écran (id, description, type). " +
    "Ce catalogue est déjà fourni dans le contexte à chaque message et se met à jour automatiquement quand l'écran " +
    "change — appeler ce tool seulement si le contexte semble tronqué ou pour revérifier après une navigation. " +
    "Ne JAMAIS deviner un id d'action : un id n'existe que s'il apparaît ici ou dans le contexte.",
  parameters: {},
  moduleName: '@egen/esm-ai-tools',
  execute: async () => {
    try {
      return { success: true, data: { actions: getVisibleUIActions() }, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── click_element ────────────────────────────────────────────────────────────

export const clickElementTool: AIToolDefinition = {
  id: 'click_element',
  name: 'Cliquer sur un élément',
  description:
    "Clique sur un bouton ou un lien de l'écran actuel, identifié par son id (voir le catalogue d'actions du " +
    "contexte, ou list_ui_actions). N'agit QUE sur un élément actuellement visible à l'écran.",
  parameters: {
    actionId: {
      type: 'string',
      required: true,
      description: "Identifiant exact de l'action, tel que fourni dans le catalogue — jamais deviné.",
    },
  },
  moduleName: '@egen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      const actionId = String(ctx.args.actionId);
      const el = getUIActionElement(actionId);
      if (!el) {
        return {
          success: false,
          error: `Aucun élément visible à l'écran avec l'id "${actionId}". Vérifie le catalogue d'actions courant avant de réessayer.`,
          durationMs: 0,
        };
      }
      el.click();
      return { success: true, data: { actionId }, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── fill_field ────────────────────────────────────────────────────────────────

export const fillFieldTool: AIToolDefinition = {
  id: 'fill_field',
  name: 'Remplir un champ',
  description:
    "Renseigne la valeur d'un champ de formulaire de l'écran actuel, identifié par son id (voir le catalogue " +
    "d'actions du contexte, ou list_ui_actions). N'agit QUE sur un champ actuellement visible à l'écran.",
  parameters: {
    actionId: {
      type: 'string',
      required: true,
      description: "Identifiant exact du champ, tel que fourni dans le catalogue — jamais deviné.",
    },
    value: {
      type: 'string',
      required: true,
      description: 'Valeur à saisir dans le champ.',
    },
  },
  moduleName: '@egen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      const actionId = String(ctx.args.actionId);
      const el = getUIActionElement(actionId);
      if (!el) {
        return {
          success: false,
          error: `Aucun champ visible à l'écran avec l'id "${actionId}". Vérifie le catalogue d'actions courant avant de réessayer.`,
          durationMs: 0,
        };
      }
      if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) {
        return { success: false, error: `L'élément "${actionId}" n'est pas un champ de formulaire.`, durationMs: 0 };
      }
      setNativeInputValue(el, String(ctx.args.value));
      return { success: true, data: { actionId }, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── list_observables ─────────────────────────────────────────────────────────

export const listObservablesTool: AIToolDefinition = {
  id: 'list_observables',
  name: "Lister le contenu descriptif de l'écran",
  description:
    "Retourne le catalogue du contenu descriptif actuellement visible à l'écran (messages, listes, tableaux, " +
    "cartes) déclaré par l'application — position, état sémantique et données structurées. Ce catalogue est déjà " +
    "fourni dans le contexte à chaque message et se met à jour automatiquement ; appeler ce tool seulement si le " +
    "contexte semble tronqué ou pour revérifier après un changement d'écran.",
  parameters: {},
  moduleName: '@egen/esm-ai-tools',
  execute: async () => {
    try {
      return { success: true, data: { observables: getObservablesCatalogForLLM() }, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── describe_screen ──────────────────────────────────────────────────────────

export const describeScreenTool: AIToolDefinition = {
  id: 'describe_screen',
  name: "Décrire l'écran courant",
  description:
    "Décrit l'écran actuellement affiché en lisant sa structure réelle (titres, éléments interactifs visibles " +
    "avec leur nom, leur état et leur position, contenu descriptif déclaré). À utiliser en FILET DE SECOURS " +
    "quand le catalogue d'actions/observables du contexte semble insuffisant pour comprendre une page — par " +
    "exemple une page qui n'a pas explicitement déclaré ses éléments. Ne remplace PAS click_element/fill_field : " +
    "une fois l'élément identifié ici, s'il ne figure pas dans le catalogue d'actions, informer l'utilisateur " +
    "que cette action précise n'est pas encore prise en charge plutôt que de tenter une manipulation directe du DOM.",
  parameters: {},
  moduleName: '@egen/esm-ai-tools',
  execute: async () => {
    try {
      return { success: true, data: describeCurrentScreen(), durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── Export groupé ────────────────────────────────────────────────────────────

export const NATIVE_TOOLS: AIToolDefinition[] = [
  navigateTool,
  listRoutesTool,
  listUIActionsTool,
  listObservablesTool,
  describeScreenTool,
  clickElementTool,
  fillFieldTool,
  showNotificationTool,
  showSnackbarTool,
  openModalTool,
  copyToClipboardTool,
  downloadFileTool,
  fetchDataTool,
  refreshDataTool,
  switchTenantTool,
  searchTool,
];
