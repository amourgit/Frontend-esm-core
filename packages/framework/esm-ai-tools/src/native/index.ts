// =============================================================================
//  @eigen/esm-ai-tools — Tools natifs EIGEN
//
//  Tous les imports utilisent les barrels publics @eigen/* officiels.
//  Signatures d'appel vérifiées contre les types réels du framework :
//    showNotification(NotificationDescriptor) → { description: string, kind?, title?, ... }
//    showSnackbar(SnackbarDescriptor)         → { title: string, subtitle?, kind?, ... }
//    showModal(name, props?, onClose?)
//    egenFetch(path, config?)                 → Promise<FetchResponse<T>>
//    navigate({ to })
// =============================================================================

import { navigate } from '@eigen/esm-navigation';
import { showNotification } from '@eigen/esm-styleguide/src/notifications';
import { showSnackbar } from '@eigen/esm-styleguide/src/snackbars';
import { showModal } from '@eigen/esm-styleguide/src/modals';
import { egenFetch } from '@eigen/esm-api';
import type { AIToolDefinition } from '../types';

// ─── navigate ─────────────────────────────────────────────────────────────────

export const navigateTool: AIToolDefinition = {
  id: 'navigate',
  name: 'Naviguer vers une route',
  description:
    "Navigue vers une route interne de l'application EIGEN. Utiliser pour emmener l'utilisateur sur une page spécifique.",
  parameters: {
    route: {
      type: 'string',
      required: true,
      description: 'Route cible (ex: "/students/123" ou "${egenSpaBase}/home")',
    },
  },
  moduleName: '@eigen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      navigate({ to: String(ctx.args.route) });
      return { success: true, data: { route: ctx.args.route }, durationMs: 0 };
    } catch (err) {
      return { success: false, error: String(err), durationMs: 0 };
    }
  },
};

// ─── show_notification ────────────────────────────────────────────────────────

export const showNotificationTool: AIToolDefinition = {
  id: 'show_notification',
  name: 'Afficher une notification',
  description:
    "Affiche une notification inline à l'utilisateur (succès, erreur, avertissement, information).",
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
      description: 'Durée d\'affichage en millisecondes',
    },
  },
  moduleName: '@eigen/esm-ai-tools',
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
  description: 'Affiche un message snackbar temporaire en bas de l\'écran.',
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
      description: 'Durée d\'affichage',
    },
  },
  moduleName: '@eigen/esm-ai-tools',
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
    "Ouvre une modale EIGEN identifiée par son nom. La modale doit être préalablement enregistrée par une app.",
  parameters: {
    name: { type: 'string', required: true, description: 'Nom de la modale à ouvrir' },
    props: { type: 'object', required: false, description: 'Props à passer à la modale' },
  },
  moduleName: '@eigen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      // showModal(modalName: string, props: ModalProps = {}, onClose: () => void = () => {})
      showModal(String(ctx.args.name), (ctx.args.props as object) ?? {}, () => {});
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
  description: 'Copie du texte dans le presse-papier de l\'utilisateur.',
  parameters: {
    text: { type: 'string', required: true, description: 'Texte à copier' },
  },
  moduleName: '@eigen/esm-ai-tools',
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
  description: 'Déclenche le téléchargement d\'un fichier depuis une URL ou un contenu base64.',
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
  moduleName: '@eigen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      const { url, content, filename, mimeType } = ctx.args as Record<string, string>;
      if (!url && !content) {
        return { success: false, error: '"url" ou "content" est requis', durationMs: 0 };
      }
      const link = document.createElement('a');
      link.download = filename;
      link.href = url
        ? url
        : `data:${mimeType ?? 'application/octet-stream'};base64,${content}`;
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
  description:
    "Effectue une requête GET authentifiée vers l'API EIGEN via egenFetch (X-Tenant-ID automatique).",
  parameters: {
    endpoint: {
      type: 'string',
      required: true,
      description: 'Endpoint relatif (ex: "/ws/rest/v1/student?limit=20")',
    },
    queryParams: {
      type: 'object',
      required: false,
      description: 'Paramètres de requête supplémentaires (mergeés dans l\'URL)',
    },
  },
  moduleName: '@eigen/esm-ai-tools',
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
  moduleName: '@eigen/esm-ai-tools',
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
  moduleName: '@eigen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      const slug = String(ctx.args.tenantSlug);
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      const rootDomain = parts.length > 2 ? parts.slice(1).join('.') : hostname;
      const spaBase = window.getEigenSpaBase?.() ?? '/';
      const targetUrl = `${window.location.protocol}//${slug}.${rootDomain}${spaBase}`;
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
  description: 'Navigue vers la page de recherche EIGEN avec un terme prédéfini.',
  parameters: {
    query: { type: 'string', required: true, description: 'Terme de recherche' },
    category: {
      type: 'string',
      required: false,
      description: 'Catégorie (students, courses, reports…)',
    },
  },
  moduleName: '@eigen/esm-ai-tools',
  execute: async (ctx) => {
    try {
      const query = String(ctx.args.query);
      const category = ctx.args.category as string | undefined;
      const spaBase = window.getEigenSpaBase?.() ?? '/';
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

// ─── Export groupé ────────────────────────────────────────────────────────────

export const NATIVE_TOOLS: AIToolDefinition[] = [
  navigateTool,
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
