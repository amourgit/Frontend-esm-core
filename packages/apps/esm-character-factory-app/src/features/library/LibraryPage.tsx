import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PublicationStatus, Resource, ResourceKind } from '../../domain/types';
import { MemoryResourceRepository } from '../../adapters/memory';
import { currentAssetBase } from '../../asset-base';
import type { CatalogResult } from './catalog';
import { getCatalog } from '../catalog-store';
import { computeFacets, previewUris, sortResources, thumbnailOf, type SortKey } from './library-model';
import ResourcePreview3D from './ResourcePreview3D';
import { checkPair, type CompatibilityReport, type Verdict } from '../../domain/compatibility';
import { VERDICT_DEFAULTS } from '../verdict-labels';
import styles from './library.module.css';

const KIND_DEFAULTS: Record<ResourceKind, string> = {
  character: 'Personnage',
  part: 'Élément',
  garment: 'Vêtement',
  accessory: 'Accessoire',
  animation: 'Animation',
  expression: 'Expression',
  texture: 'Texture',
  environment: 'Environnement',
};
const STATUS_DEFAULTS: Record<PublicationStatus, string> = {
  draft: 'Brouillon',
  validated: 'Validé',
  published: 'Publié',
  deprecated: 'Déprécié',
};
const DEFAULT_ANIMATIONS = 'default-animations';

/**
 * Bibliothèque de ressources (phase 8). Les données viennent d'un ResourceRepository (port) : aujourd'hui alimenté par
 * les manifestes historiques, demain par le backend EGEN, sans changer cette page.
 */
export default function LibraryPage() {
  const { t } = useTranslation();
  const repo = useMemo(() => new MemoryResourceRepository(), []);
  const [catalog, setCatalog] = useState<CatalogResult | null>(null);
  const [visible, setVisible] = useState<Resource[]>([]);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<ResourceKind | 'all'>('all');
  const [collection, setCollection] = useState<string>('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [compatWith, setCompatWith] = useState<string>('');
  const [hideIncompatible, setHideIncompatible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCatalog(currentAssetBase()).then((result) => {
      if (cancelled) return;
      repo.seed(result.resources);
      setCatalog(result);
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  useEffect(() => {
    if (!catalog) return;
    let cancelled = false;
    repo
      .list({ kind: kind === 'all' ? undefined : kind, text: query, collection: collection === 'all' ? undefined : collection })
      .then((list) => !cancelled && setVisible(sortResources(list, sort)));
    return () => {
      cancelled = true;
    };
  }, [repo, catalog, kind, query, collection, sort]);

  // Compatibilité de chaque ressource avec le personnage choisi (règles pures du domaine)
  const target = useMemo(() => catalog?.resources.find((r) => r.id === compatWith) ?? null, [catalog, compatWith]);
  const reports = useMemo(() => {
    const map = new Map<string, CompatibilityReport>();
    if (target && catalog) catalog.resources.forEach((r) => r.id !== target.id && r.kind !== 'character' && map.set(r.id, checkPair(r, target)));
    return map;
  }, [catalog, target]);
  const shown = hideIncompatible ? visible.filter((r) => reports.get(r.id)?.verdict !== 'incompatible') : visible;
  const verdictLabel = (v: Verdict) => t(`verdict_${v}`, VERDICT_DEFAULTS[v]);
  const facets = useMemo(() => computeFacets(catalog?.resources ?? []), [catalog]);
  const collectionName = (id: string) =>
    id === DEFAULT_ANIMATIONS ? t('libDefaultAnimations', 'Animations par défaut') : (catalog?.collections.find((c) => c.id === id)?.name ?? id);
  const kindLabel = (k: ResourceKind) => t(`kind_${k}`, KIND_DEFAULTS[k]);
  const selected = shown.find((r) => r.id === selectedId) ?? null;
  const previewModels = useMemo(() => (selected && catalog ? previewUris(selected, catalog.resources) : []), [selected, catalog]);

  useEffect(() => setShowPreview(false), [selectedId]);

  if (!catalog) return <div className={styles.empty}>{t('libLoading', 'Chargement du catalogue…')}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('libSearch', 'Rechercher une ressource…')}
          aria-label={t('libSearch', 'Rechercher une ressource…')}
        />
        <select className={styles.select} value={collection} onChange={(e) => setCollection(e.target.value)} aria-label={t('libCollection', 'Collection')}>
          <option value="all">{t('libAllCollections', 'Toutes les collections')}</option>
          {facets.collections.map((c) => (
            <option key={c.id} value={c.id}>
              {collectionName(c.id)} ({c.count})
            </option>
          ))}
        </select>
        <select className={styles.select} value={compatWith} onChange={(e) => setCompatWith(e.target.value)} aria-label={t('libCompatWith', 'Vérifier la compatibilité avec')}>
          <option value="">{t('libCompatNone', 'Compatibilité : aucun personnage')}</option>
          {catalog.resources.filter((r) => r.kind === 'character').map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {target && (
          <label>
            <input type="checkbox" checked={hideIncompatible} onChange={(e) => setHideIncompatible(e.target.checked)} /> {t('libHideIncompatible', 'Masquer les incompatibles')}
          </label>
        )}
        <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label={t('libSort', 'Trier par')}>
          <option value="name">{t('libSortName', 'Nom')}</option>
          <option value="kind">{t('libSortKind', 'Type')}</option>
          <option value="collection">{t('libSortCollection', 'Collection')}</option>
        </select>
      </div>

      <div className={styles.tabs} role="tablist">
        <button type="button" role="tab" aria-selected={kind === 'all'} className={`${styles.tab} ${kind === 'all' ? styles.tabActive : ''}`} onClick={() => setKind('all')}>
          {t('libAll', 'Tous')} ({catalog.resources.length})
        </button>
        {facets.kinds.map((k) => (
          <button
            key={k.kind}
            type="button"
            role="tab"
            aria-selected={kind === k.kind}
            className={`${styles.tab} ${kind === k.kind ? styles.tabActive : ''}`}
            onClick={() => setKind(k.kind)}
          >
            {kindLabel(k.kind)} ({k.count})
          </button>
        ))}
      </div>

      {catalog.errors.length > 0 && (
        <div className={styles.notice} role="alert">
          {t('libErrors', '{{count}} source(s) du catalogue indisponible(s) : certaines ressources ne sont pas affichées.', { count: catalog.errors.length })}
          <ul className={styles.files}>
            {catalog.errors.map((e) => (
              <li key={e.source}>
                {e.source} — {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.grid} role="list" data-testid="resource-grid">
          {shown.length === 0 && <div className={styles.empty}>{t('libEmpty', 'Aucune ressource ne correspond.')}</div>}
          {shown.map((r) => {
            const thumb = thumbnailOf(r);
            const report = reports.get(r.id);
            return (
              <div key={r.id} role="listitem" className={styles.cell}>
              <button
                type="button"
                className={`${styles.card} ${r.id === selectedId ? styles.cardSelected : ''}`}
                onClick={() => setSelectedId(r.id)}
                aria-pressed={r.id === selectedId}
              >
                {thumb ? (
                  <img className={styles.thumb} src={thumb} alt="" loading="lazy" />
                ) : (
                  <div className={`${styles.thumb} ${styles.thumbEmpty}`}>{kindLabel(r.kind)}</div>
                )}
                <span className={styles.cardName}>{r.name}</span>
                <span className={styles.badge}>{kindLabel(r.kind)}</span>
                {report && <span className={styles.badge}>{verdictLabel(report.verdict)}</span>}
              </button>
              </div>
            );
          })}
        </div>

        <aside className={styles.detail} aria-label={t('libDetail', 'Fiche de la ressource')}>
          {!selected ? (
            <div className={styles.empty}>{t('libSelectHint', 'Sélectionnez une ressource pour voir sa fiche.')}</div>
          ) : (
            <>
              <h2>{selected.name}</h2>
              <dl>
                <dt>{t('libType', 'Type')}</dt>
                <dd>{kindLabel(selected.kind)}</dd>
                <dt>{t('libVersion', 'Version')}</dt>
                <dd>{selected.version}</dd>
                <dt>{t('libStatus', 'Statut')}</dt>
                <dd>{t(`status_${selected.status}`, STATUS_DEFAULTS[selected.status])}</dd>
                <dt>{t('libCollection', 'Collection')}</dt>
                <dd>{selected.collections.map(collectionName).join(', ') || '—'}</dd>
                <dt>{t('libTags', 'Étiquettes')}</dt>
                <dd>{selected.tags.join(', ') || '—'}</dd>
                <dt>{t('libSkeleton', 'Squelette')}</dt>
                <dd>{selected.compatibility.skeleton ?? '—'}</dd>
                <dt>{t('libSlots', 'Emplacements')}</dt>
                <dd>{selected.compatibility.slots.join(', ') || '—'}</dd>
                <dt>{t('libConstraints', 'Contraintes')}</dt>
                <dd>{selected.compatibility.constraints.join(', ') || '—'}</dd>
                <dt>{t('libSource', 'Source')}</dt>
                <dd>{selected.source.reference ?? selected.source.origin}</dd>
              </dl>

              {target && reports.get(selected.id) && (
                <div data-testid="compat-detail">
                  <strong>{t('libCompatSection', 'Compatibilité avec {{name}}', { name: target.name })}</strong> : {verdictLabel(reports.get(selected.id)!.verdict)}
                  <ul className={styles.files}>
                    {reports.get(selected.id)!.reasons.map((r) => (
                      <li key={r.code}>{t(`compat_${r.code}`, r.message)}</li>
                    ))}
                    {reports.get(selected.id)!.adaptations.map((a) => (
                      <li key={a.type}>{t('libAdaptation', 'Adaptation proposée')} : {a.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              {previewModels.length > 0 &&
                (showPreview ? (
                  <>
                    <ResourcePreview3D uris={previewModels} />
                    <button type="button" className={styles.button} onClick={() => setShowPreview(false)}>
                      {t('libHidePreview', "Masquer l'aperçu 3D")}
                    </button>
                  </>
                ) : (
                  <button type="button" className={styles.button} onClick={() => setShowPreview(true)}>
                    {t('libShowPreview', "Afficher l'aperçu 3D")}
                  </button>
                ))}

              <div>
                <strong>{t('libFiles', 'Fichiers')}</strong>
                <ul className={styles.files}>
                  {selected.files.length === 0 && <li>—</li>}
                  {selected.files.map((f) => (
                    <li key={`${f.role}-${f.uri}`}>
                      {f.role} · {f.format} · {f.uri}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
