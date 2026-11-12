import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DomainError, type Composition, type Resource } from '../../domain/types';
import { checkPair, type Verdict } from '../../domain/compatibility';
import { CompositionService } from '../../services/composition-service';
import { CompatibilityService, type CompositionCompatibility } from '../../services/compatibility-service';
import type { CompositionRepository, ResourceRepository } from '../../ports';
import { currentAssetBase } from '../../asset-base';
import { getCatalog, resourceRepositoryFor } from '../catalog-store';
import type { CatalogResult } from '../library/catalog';
import ResourcePreview3D from '../library/ResourcePreview3D';
import { candidatesForSlot, compositionPreviewUris, diffCompositions, latestPerComposition, slotsOf } from './composition-model';
import { createCompositionRepository } from './repositories';
import { VERDICT_DEFAULTS } from '../verdict-labels';
import styles from '../library/library.module.css';

const VERDICT_SYMBOL: Record<Verdict, string> = { compatible: '✓', adaptation: '⚠', incompatible: '✕' };
const STATUS_DEFAULTS = { draft: 'Brouillon', validated: 'Validé', published: 'Publié', deprecated: 'Déprécié' } as const;
const errorMessage = (e: unknown) => (e instanceof DomainError ? e.message : e instanceof Error ? e.message : String(e));

type View = { mode: 'list' } | { mode: 'edit'; id: string; version: number } | { mode: 'compare'; ids: string[] };

/**
 * Compositions (phase 10) : un personnage de base + des éléments par emplacement, enregistrés PAR RÉFÉRENCE.
 * Les invariants (versions immuables, variantes indépendantes, aucune copie de fichier) sont appliqués par
 * CompositionService ; cette page ne fait que les présenter.
 * Hors périmètre ici : couleurs, textures et morphologie fines (moteur historique, cf. roadmap F10.1).
 */
export default function CompositionsPage({ repository: injected }: { repository?: CompositionRepository }) {
  const { t } = useTranslation();
  const { repository, persistent } = useMemo(() => (injected ? { repository: injected, persistent: true } : createCompositionRepository()), [injected]);
  const [catalog, setCatalog] = useState<CatalogResult | null>(null);
  const [all, setAll] = useState<Composition[]>([]);
  const [view, setView] = useState<View>({ mode: 'list' });
  const [error, setError] = useState<string | null>(null);

  const resourceRepo = useMemo(() => (catalog ? resourceRepositoryFor(catalog) : null), [catalog]);
  const service = useMemo(() => (resourceRepo ? new CompositionService(repository, resourceRepo) : null), [repository, resourceRepo]);
  const resources = catalog?.resources ?? [];

  const reload = useCallback(async () => setAll(await repository.list()), [repository]);
  useEffect(() => {
    let cancelled = false;
    getCatalog(currentAssetBase()).then((c) => !cancelled && setCatalog(c));
    reload();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  if (!catalog || !service || !resourceRepo) return <div className={styles.empty}>{t('libLoading', 'Chargement du catalogue…')}</div>;

  const run = async (action: () => Promise<Composition | void>, then?: (c: Composition) => void) => {
    setError(null);
    try {
      const result = await action();
      await reload();
      if (result && then) then(result);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const latest = latestPerComposition(all);
  const current = view.mode === 'edit' ? all.find((c) => c.id === view.id && c.version === view.version) : undefined;

  return (
    <div className={styles.page}>
      {error && (
        <div className={styles.notice} role="alert">
          {error}
        </div>
      )}
      {!persistent && (
        <div className={styles.notice} role="status">
          {t('cmpNotPersistent', 'Stockage local indisponible : les compositions seront perdues au rechargement.')}
        </div>
      )}

      {view.mode === 'list' && (
        <CompositionList
          latest={latest}
          resources={resources}
          onCreate={(name, base) => run(() => service.create({ name, base: { id: base.id, version: base.version } }), (c) => setView({ mode: 'edit', id: c.id, version: c.version }))}
          onOpen={(c) => setView({ mode: 'edit', id: c.id, version: c.version })}
          onCompare={(ids) => setView({ mode: 'compare', ids })}
        />
      )}

      {view.mode === 'edit' && current && (
        <CompositionEditor
          key={`${current.id}@${current.version}`}
          composition={current}
          versions={all.filter((c) => c.id === current.id).sort((a, b) => a.version - b.version)}
          resources={resources}
          resourceRepo={resourceRepo}
          onBack={() => setView({ mode: 'list' })}
          onOpenVersion={(version) => setView({ mode: 'edit', id: current.id, version })}
          onSave={(patch) => run(() => service.update(current.id, current.version, patch))}
          onPublish={() => run(() => service.promote(current.id, current.version, 'published'))}
          onNewVersion={() => run(() => service.createVersion(current.id, current.version), (c) => setView({ mode: 'edit', id: c.id, version: c.version }))}
          onVariant={(name) => run(() => service.createVariant(current.id, current.version, name), (c) => setView({ mode: 'edit', id: c.id, version: c.version }))}
        />
      )}

      {view.mode === 'compare' && (
        <CompareView compositions={view.ids.flatMap((id) => latest.filter((c) => c.id === id))} resources={resources} resourceRepo={resourceRepo} onBack={() => setView({ mode: 'list' })} />
      )}
    </div>
  );
}

function CompositionList({
  latest,
  resources,
  onCreate,
  onOpen,
  onCompare,
}: {
  latest: Composition[];
  resources: Resource[];
  onCreate: (name: string, base: Resource) => void;
  onOpen: (c: Composition) => void;
  onCompare: (ids: string[]) => void;
}) {
  const { t } = useTranslation();
  const characters = resources.filter((r) => r.kind === 'character');
  const [name, setName] = useState('');
  const [baseId, setBaseId] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const base = characters.find((c) => c.id === baseId);
  const nameOfId = (id: string) => latest.find((c) => c.id === id)?.name ?? id;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p));

  return (
    <>
      <div className={styles.toolbar}>
        <input className={styles.search} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('cmpName', 'Nom de la composition')} aria-label={t('cmpName', 'Nom de la composition')} />
        <select className={styles.select} value={baseId} onChange={(e) => setBaseId(e.target.value)} aria-label={t('cmpBase', 'Personnage de base')}>
          <option value="">{t('cmpChooseBase', 'Choisir un personnage de base…')}</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="button" className={styles.button} disabled={!name.trim() || !base} onClick={() => base && onCreate(name.trim(), base)}>
          {t('cmpNew', 'Nouvelle composition')}
        </button>
        <button type="button" className={styles.button} disabled={picked.length < 2} onClick={() => onCompare(picked)}>
          {t('cmpCompare', 'Comparer')} ({picked.length}/3)
        </button>
      </div>
      <div className={styles.body}>
        <div className={styles.grid} role="list" data-testid="composition-list">
          {latest.length === 0 && <div className={styles.empty}>{t('cmpEmpty', 'Aucune composition. Choisissez un personnage de base et donnez un nom pour commencer.')}</div>}
          {latest.map((c) => (
            <div key={c.id} role="listitem" className={styles.cell}>
              <div className={styles.card}>
                <span className={styles.cardName}>{c.name}</span>
                <span className={styles.badge}>
                  v{c.version} · {t(`status_${c.status}`, STATUS_DEFAULTS[c.status])}
                </span>
                {c.variantOf && <span className={styles.badge}>{t('cmpVariantOf', 'variante de {{name}}', { name: nameOfId(c.variantOf.id) })}</span>}
                <label>
                  <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} aria-label={`${t('cmpSelect', 'Sélectionner')} ${c.name}`} /> {t('cmpSelect', 'Sélectionner')}
                </label>
                <button type="button" className={styles.button} onClick={() => onOpen(c)} aria-label={`${t('cmpOpen', 'Ouvrir')} ${c.name}`}>
                  {t('cmpOpen', 'Ouvrir')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CompositionEditor({
  composition,
  versions,
  resources,
  resourceRepo,
  onBack,
  onOpenVersion,
  onSave,
  onPublish,
  onNewVersion,
  onVariant,
}: {
  composition: Composition;
  versions: Composition[];
  resources: Resource[];
  resourceRepo: ResourceRepository;
  onBack: () => void;
  onOpenVersion: (version: number) => void;
  onSave: (patch: Pick<Composition, 'name' | 'items'>) => void;
  onPublish: () => void;
  onNewVersion: () => void;
  onVariant: (name: string) => void;
}) {
  const { t } = useTranslation();
  const readOnly = composition.status !== 'draft';
  const [draft, setDraft] = useState(composition);
  const [compat, setCompat] = useState<CompositionCompatibility | null>(null);
  const [variantName, setVariantName] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const base = resources.find((r) => r.id === draft.base.id && r.version === draft.base.version);
  const dirty = JSON.stringify({ name: draft.name, items: draft.items }) !== JSON.stringify({ name: composition.name, items: composition.items });
  const previewModels = useMemo(() => compositionPreviewUris(draft, resources), [draft, resources]);
  const nameOf = (ref: { id: string }) => resources.find((r) => r.id === ref.id)?.name ?? ref.id;

  useEffect(() => {
    let cancelled = false;
    new CompatibilityService(resourceRepo).checkComposition(draft).then((r) => !cancelled && setCompat(r));
    return () => {
      cancelled = true;
    };
  }, [draft, resourceRepo]);

  const setSlot = (slot: string, resourceId: string) => {
    const resource = resources.find((r) => r.id === resourceId);
    setDraft((d) => ({
      ...d,
      items: [...d.items.filter((i) => i.slot !== slot), ...(resource ? [{ slot, ref: { id: resource.id, version: resource.version } }] : [])],
    }));
  };
  const canPublish = !readOnly && !dirty && !!compat && compat.verdict !== 'incompatible';

  return (
    <div className={styles.body} style={{ flexDirection: 'column' }}>
      <div className={styles.toolbar} style={{ padding: 0 }}>
        <button type="button" className={styles.button} onClick={onBack}>
          ← {t('cmpBack', 'Compositions')}
        </button>
        <input
          className={styles.search}
          value={draft.name}
          disabled={readOnly}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          aria-label={t('cmpName', 'Nom de la composition')}
        />
        <select className={styles.select} value={composition.version} onChange={(e) => onOpenVersion(Number(e.target.value))} aria-label={t('cmpVersion', 'Version')}>
          {versions.map((v) => (
            <option key={v.version} value={v.version}>
              v{v.version} — {t(`status_${v.status}`, STATUS_DEFAULTS[v.status])}
            </option>
          ))}
        </select>
      </div>

      {readOnly && (
        <div className={styles.notice} role="status">
          {t('cmpImmutable', 'Cette version est « {{status}} » : elle est immuable. Créez une nouvelle version pour la modifier.', { status: t(`status_${composition.status}`, STATUS_DEFAULTS[composition.status]) })}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <section style={{ flex: '1 1 18rem' }} aria-label={t('cmpSlots', 'Emplacements')}>
          <p>
            <strong>{t('cmpBase', 'Personnage de base')}</strong> : {base?.name ?? draft.base.id}
          </p>
          {slotsOf(base).map((slot) => {
            const chosen = draft.items.find((i) => i.slot === slot);
            return (
              <label key={slot} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
                {slot}
                <select className={styles.select} value={chosen?.ref.id ?? ''} disabled={readOnly} onChange={(e) => setSlot(slot, e.target.value)}>
                  <option value="">{t('cmpDefault', '— par défaut —')}</option>
                  {candidatesForSlot(slot, resources).map((r) => (
                    <option key={r.id} value={r.id}>
                      {base ? VERDICT_SYMBOL[checkPair(r, base).verdict] : ''} {r.name}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </section>

        <section style={{ flex: '1 1 18rem' }} aria-label={t('cmpCompat', 'Compatibilité')}>
          <strong>{t('cmpCompat', 'Compatibilité')}</strong> :{' '}
          <span data-testid="compat-verdict">{compat ? t(`verdict_${compat.verdict}`, VERDICT_DEFAULTS[compat.verdict]) : '…'}</span>
          <ul className={styles.files}>
            {compat?.items.flatMap((i) => i.report.reasons.map((r) => <li key={`${i.slot}-${r.code}`}>{i.slot} — {t(`compat_${r.code}`, r.message)}</li>))}
            {compat?.conflicts.map((c) => (
              <li key={`${c.a.id}-${c.b.id}`}>
                {nameOf(c.a)} ↔ {nameOf(c.b)} — {c.report.reasons.map((r) => t(`compat_${r.code}`, r.message)).join(' ; ')}
              </li>
            ))}
            {compat?.missing.map((m) => (
              <li key={m.id}>{t('cmpMissing', 'Ressource introuvable')} : {m.id}</li>
            ))}
          </ul>
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
        </section>
      </div>

      <div className={styles.toolbar} style={{ padding: 0 }}>
        {!readOnly && (
          <>
            <button type="button" className={styles.button} disabled={!dirty} onClick={() => onSave({ name: draft.name, items: draft.items })}>
              {t('cmpSave', 'Enregistrer')}
            </button>
            <button type="button" className={styles.button} disabled={!canPublish} onClick={onPublish} title={dirty ? t('cmpSaveFirst', "Enregistrez d'abord") : undefined}>
              {t('cmpPublish', 'Publier cette version')}
            </button>
          </>
        )}
        <button type="button" className={styles.button} onClick={onNewVersion}>
          {t('cmpNewVersion', 'Nouvelle version')}
        </button>
        <input className={styles.search} value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder={t('cmpVariantName', 'Nom de la variante')} aria-label={t('cmpVariantName', 'Nom de la variante')} />
        <button type="button" className={styles.button} disabled={!variantName.trim()} onClick={() => onVariant(variantName.trim())}>
          {t('cmpVariant', 'Créer une variante')}
        </button>
      </div>
    </div>
  );
}

function CompareView({ compositions, resources, resourceRepo, onBack }: { compositions: Composition[]; resources: Resource[]; resourceRepo: ResourceRepository; onBack: () => void }) {
  const { t } = useTranslation();
  const rows = useMemo(() => diffCompositions(compositions, resources), [compositions, resources]);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  useEffect(() => {
    let cancelled = false;
    const service = new CompatibilityService(resourceRepo);
    Promise.all(compositions.map(async (c) => [c.id, (await service.checkComposition(c)).verdict] as const)).then((entries) => !cancelled && setVerdicts(Object.fromEntries(entries)));
    return () => {
      cancelled = true;
    };
  }, [compositions, resourceRepo]);

  return (
    <div className={styles.body} style={{ flexDirection: 'column' }}>
      <div>
        <button type="button" className={styles.button} onClick={onBack}>
          ← {t('cmpBack', 'Compositions')}
        </button>
      </div>
      <div style={{ overflow: 'auto' }}>
        <table data-testid="compare-table" style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              <th />
              {compositions.map((c) => (
                <th key={c.id} style={{ textAlign: 'left', padding: '0.4rem' }}>
                  {c.name} (v{c.version})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} data-different={!row.same}>
                <th scope="row" style={{ textAlign: 'left', padding: '0.4rem' }}>
                  {!row.same && <span aria-label={t('cmpDifferent', 'différent')}>≠ </span>}
                  {row.label}
                </th>
                {row.values.map((v, i) => (
                  <td key={i} style={{ padding: '0.4rem' }}>
                    {v ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" style={{ textAlign: 'left', padding: '0.4rem' }}>
                {t('cmpCompat', 'Compatibilité')}
              </th>
              {compositions.map((c) => (
                <td key={c.id} style={{ padding: '0.4rem' }}>
                  {verdicts[c.id] ? t(`verdict_${verdicts[c.id]}`, VERDICT_DEFAULTS[verdicts[c.id]]) : '…'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
