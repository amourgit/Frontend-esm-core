// ============================================================================
//  @egen/esm-tenant — Orchestrateur du système tenant
// ============================================================================

import type { TenantDefinition, TenantSystemConfig, TenantId } from './types';
import { resolveConfigFromEnv } from './config/env';
import { initTenantRegistry, getAllTenants, getTenantById } from './context/registry';
import { resolveActiveTenantId, persistActiveTenant } from './context/resolver';
import {
  setTenantConfig,
  setTenantStoreStatus,
  setAvailableTenants,
  setActiveTenantInStore,
  getTenantStoreState,
} from './context/store';

// ---------------------------------------------------------------------------
// Theme applier injection (évite dépendance circulaire esm-tenant ↔ esm-theme)
// ---------------------------------------------------------------------------

type ThemeApplier = (tenantId: string, schema?: TenantDefinition['themeOverride'], themeUrl?: string) => Promise<void>;
let _themeApplier: ThemeApplier | null = null;

/**
 * Injecte la fonction d'application du thème tenant.
 * À appeler dans le shell, après `setupThemeEngine()`.
 *
 * @example
 * ```ts
 * // Dans run.ts du shell :
 * import { applyAppThemeOverride } from '@egen/esm-theme';
 * import { registerTenantThemeApplier } from '@egen/esm-tenant';
 *
 * registerTenantThemeApplier(async (tenantId, schema, themeUrl) => {
 *   const urls = themeUrl
 *     ? [themeUrl, existingThemeUrl]
 *     : [existingThemeUrl];
 *   if (schema) applyAppThemeOverride(`tenant-${tenantId}`, schema, { priority: 10 });
 * });
 * ```
 */
export function registerTenantThemeApplier(fn: ThemeApplier): void {
  _themeApplier = fn;
}

// ---------------------------------------------------------------------------
// Activation d'un tenant
// ---------------------------------------------------------------------------

async function applyTenantTheme(tenant: TenantDefinition, config: TenantSystemConfig): Promise<void> {
  if (!config.applyTheme) return;
  if (!_themeApplier) return;
  if (!tenant.themeOverride && !tenant.themeUrl) return;

  try {
    await _themeApplier(tenant.id, tenant.themeOverride, tenant.themeUrl);
  } catch (err) {
    console.warn(`[egen/esm-tenant] Erreur thème pour "${tenant.id}":`, err);
  }
}

/**
 * Charge les import maps additionnels d'un tenant.
 * Utilisé pour activer des microfrontends spécifiques à un tenant.
 * @internal
 */
function applyTenantImportMaps(urls: string[]): void {
  if (typeof document === 'undefined') return;
  for (const url of urls) {
    // Vérifie si ce script est déjà chargé
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) continue;
    const script = document.createElement('script');
    script.type = 'systemjs-importmap';
    script.src = url;
    document.head.appendChild(script);
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[egen/esm-tenant] Import map tenant chargée : ${url}`);
    }
  }
}

function fireEsmEvent(name: string, detail: unknown): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail, bubbles: false }));
}

async function activateTenant(
  tenant: TenantDefinition,
  config: TenantSystemConfig,
  previousTenant: TenantDefinition | null = null,
): Promise<void> {
  if (tenant.suspended) {
    // IMPORTANT : on peuple quand même `activeTenant` (au lieu de laisser le
    // store à `null`) — `setActiveTenantInStore` dérive déjà correctement
    // `status: 'suspended'` à partir de `tenant.suspended`. Sans ceci,
    // useTenant()/useTenantIsSuspended()/TenantSuspendedBoundary et la page
    // /tenant-suspended n'ont aucun moyen de savoir QUEL tenant est
    // suspendu ni d'afficher son `suspendedMessage` personnalisé — ils ne
    // voient qu'un statut "suspended" sans aucune donnée associée.
    //
    // On ne persiste pas ce tenant (un tenant suspendu ne doit pas devenir
    // "le dernier tenant actif" pour la prochaine session), on n'applique
    // pas son thème et on ne déclenche pas les évènements/callback
    // d'activation (`esm:tenant-activated`, `onTenantActivated`) : un
    // tenant suspendu n'est pas réellement "actif" au sens fonctionnel.
    setActiveTenantInStore(tenant);
    console.warn(`[egen/esm-tenant] ⚠️  Tenant "${tenant.id}" suspendu.`);
    return;
  }

  setActiveTenantInStore(tenant);

  if (config.persistActive) {
    persistActiveTenant(tenant.id, config.storageKey ?? 'egen:tenant:active');
  }

  await applyTenantTheme(tenant, config);

  fireEsmEvent('esm:tenant-activated', { tenant, previousTenantId: previousTenant?.id ?? null });
  fireEsmEvent('esm:tenant-changed', { from: previousTenant, to: tenant });

  config.onTenantActivated?.(tenant);

  // Apply tenant-specific import map URLs if defined
  if (tenant.importMapUrls?.length) {
    applyTenantImportMaps(tenant.importMapUrls);
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.info(`[egen/esm-tenant] ✅ Tenant actif : "${tenant.id}" (${tenant.name})`);
  }
}

// ---------------------------------------------------------------------------
// API principale
// ---------------------------------------------------------------------------

/**
 * Initialise le système de gestion des tenants.
 * À appeler une seule fois au boot du shell, APRÈS `setupThemeEngine()`.
 *
 * @example
 * ```ts
 * // Mode multi, registry distante :
 * await setupTenantSystem({
 *   mode: 'multi',
 *   registryUrl: '/tenants/registry.json',
 *   applyTheme: true,
 * });
 *
 * // Mode single, config statique :
 * await setupTenantSystem({
 *   mode: 'single',
 *   staticTenants: [{ id: 'civitas', name: 'CIVITAS' }],
 *   defaultTenantId: 'civitas',
 * });
 *
 * // Tout depuis variables d'environnement (VITE_TENANT_MODE, etc.) :
 * await setupTenantSystem();
 * ```
 */
export async function setupTenantSystem(userConfig: Partial<TenantSystemConfig> = {}): Promise<void> {
  // 1. Fusion : env < userConfig (userConfig est prioritaire)
  const envConfig = resolveConfigFromEnv();
  const config: TenantSystemConfig = {
    mode: 'off',
    persistActive: true,
    storageKey: 'egen:tenant:active',
    applyTheme: true,
    resolutionOrder: ['subdomain', 'path', 'query', 'jwt', 'header', 'localStorage', 'static', 'first'],
    ...envConfig,
    ...userConfig,
    pathConfig: { ...envConfig.pathConfig, ...userConfig.pathConfig },
    jwtConfig: { claim: 'tenantId', ...envConfig.jwtConfig, ...userConfig.jwtConfig },
  };

  setTenantConfig(config);

  if (config.mode === 'off') {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info('[egen/esm-tenant] Système tenant désactivé (mode: "off").');
    }
    return;
  }

  setTenantStoreStatus('loading');

  try {
    // 2. Registry
    const allTenants = await initTenantRegistry(config.staticTenants, config.registryUrl);
    setAvailableTenants(allTenants);

    if (allTenants.length === 0) {
      throw new Error('La registry de tenants est vide. Configurez staticTenants ou registryUrl.');
    }

    // 3. Résolution
    let activeTenant: TenantDefinition | undefined;

    if (config.mode === 'single') {
      const targetId = config.defaultTenantId ?? allTenants[0]?.id;
      activeTenant = targetId ? getTenantById(targetId) : allTenants[0];
    } else {
      const resolvedId = resolveActiveTenantId(config);
      activeTenant = resolvedId ? getTenantById(resolvedId) : undefined;

      if (!activeTenant) {
        activeTenant = allTenants[0];
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[egen/esm-tenant] Fallback sur le premier tenant:', activeTenant?.id);
        }
      }
    }

    if (!activeTenant) {
      throw new Error('Impossible de résoudre un tenant actif.');
    }

    // 4. Activation
    await activateTenant(activeTenant, config, null);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setTenantStoreStatus('error', message);
    config.onError?.(err instanceof Error ? err : new Error(message));
    console.error('[egen/esm-tenant] ❌', message);
  }
}

/**
 * Change le tenant actif à la volée (mode "multi" uniquement).
 *
 * @example
 * ```ts
 * await switchTenant('acme-corp');
 * ```
 */
export async function switchTenant(tenantId: TenantId): Promise<void> {
  const state = getTenantStoreState();

  if (state.mode === 'off') {
    console.warn('[egen/esm-tenant] switchTenant() ignoré : mode "off".');
    return;
  }
  if (state.mode === 'single') {
    console.warn('[egen/esm-tenant] switchTenant() ignoré : mode "single".');
    return;
  }

  const tenant = getTenantById(tenantId);
  if (!tenant) {
    console.error(`[egen/esm-tenant] Tenant introuvable : "${tenantId}"`);
    return;
  }

  const previous = state.activeTenant;
  setTenantStoreStatus('loading');
  await activateTenant(tenant, state.config, previous);
}

/**
 * Recharge la registry distante et ré-active le tenant courant.
 */
export async function reloadTenantRegistry(): Promise<void> {
  const state = getTenantStoreState();
  if (state.mode === 'off') return;

  setTenantStoreStatus('loading');
  try {
    const tenants = await initTenantRegistry(state.config.staticTenants, state.config.registryUrl);
    setAvailableTenants(tenants);

    if (state.activeTenant) {
      const refreshed = getTenantById(state.activeTenant.id);
      if (refreshed) {
        await activateTenant(refreshed, state.config, state.activeTenant);
      } else {
        // Le tenant actif a disparu de la registry rechargée (supprimé,
        // renommé...) — on ne laisse PAS le store pointer silencieusement
        // sur des données obsolètes (activeTenant resterait un objet qui
        // n'existe plus nulle part dans allTenants), ce qui tromperait tout
        // code qui vérifie l'existence via la registry après coup.
        console.warn(
          `[egen/esm-tenant] Le tenant actif "${state.activeTenant.id}" n'existe plus dans la registry rechargée.`,
        );
        // setTenantStoreStatus seul ne touche que status/error — il faut
        // explicitement vider activeTenant, sans quoi le store garderait un
        // objet tenant qui n'est plus dans allTenants.
        setActiveTenantInStore(null);
        setTenantStoreStatus('error', `Le tenant "${state.activeTenant.id}" n'existe plus.`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setTenantStoreStatus('error', message);
  }
}

// Re-exports pratiques
export { storeHeaderTenantId } from './context/resolver';
export { registerTenant } from './context/registry';
