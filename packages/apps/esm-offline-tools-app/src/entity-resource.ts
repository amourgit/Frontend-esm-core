import { egenFetch, type FetchConfig } from '@egen-civitas/esm-framework';

/** Chemin de la ressource FHIR « Entity », relatif à la racine de l'API. */
export const entityResourcePath = '/ws/fhir2/R4/Entity';

/**
 * Récupère une entité par son identifiant (`null` si l'identifiant est vide). Une réponse en erreur est
 * propagée par `egenFetch`.
 *
 * Remplace `fetchCurrentEntity`, retiré du framework avec sa couche clinique. L'ancien repli sur les
 * entités « enregistrées hors-ligne » (éléments de synchronisation `entity-registration`) n'est pas repris :
 * aucune app de ce dépôt n'en produit, seule l'interface de cette app les lit.
 */
export async function fetchEntity(
  entityUuid: string | null | undefined,
  fetchInit?: FetchConfig,
): Promise<fhir.Patient | null> {
  if (!entityUuid) {
    return null;
  }

  const { data } = await egenFetch<fhir.Patient>(`${entityResourcePath}/${entityUuid}`, fetchInit);
  return data;
}
