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
import { thumbnailOf } from '../library/library-model';
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
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [baseId, setBaseId] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const base = characters.find((c) => c.id === baseId);
  const nameOfId = (id: string) => latest.find((c) => c.id === id)?.name ?? id;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p));
  const missing = [!name.trim() && t('cmpMissingName', 'un nom'), !base && t('cmpMissingBase', 'un personnage de base')].filter(Boolean) as string[];
  const open = () => setCreating(true);
  const cancel = () => {
    setCreating(false);
    setName('');
    setBaseId('');
  };

  return (
    <>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('cmpTitle', 'Mes compositions')}</h2>
        <div className={styles.actions}>
          {latest.length >= 2 && (
            <>
              <button type="button" className={styles.button} disabled={picked.length < 2} onClick={() => onCompare(picked)}>
                {t('cmpCompareSelected', 'Comparer la sélection ({{count}}/3)', { count: picked.length })}
              </button>
              {picked.length < 2 && <span className={styles.hint}>{t('cmpCompareHint', 'Cochez 2 ou 3 compositions pour les comparer.')}</span>}
            </>
          )}
          {!creating && (
            <button type="button" className={styles.primary} onClick={open}>
              ＋ {t('cmpNew', 'Nouvelle composition')}
            </button>
          )}
        </div>
      </div>

      {creating && (
        <section className={styles.panel} aria-label={t('cmpCreateTitle', 'Créer une composition')}>
          <h3>{t('cmpCreateTitle', 'Créer une composition')}</h3>
          <label className={styles.field}>
            <strong>{t('cmpStep1', '1. Donnez-lui un nom')}</strong>
            <input className={styles.search} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('cmpNamePlaceholder', 'Ex. : Tenue de réception')} aria-label={t('cmpName', 'Nom de la composition')} autoFocus />
          </label>
          <div className={styles.field}>
            <strong>{t('cmpStep2', '2. Choisissez le personnage de base')}</strong>
            {characters.length === 0 ? (
              <p className={styles.hint} role="status">
                {t('cmpNoCharacters', "Aucun personnage disponible : le catalogue n'a pas pu être chargé. Ouvrez la bibliothèque pour voir quelles sources sont indisponibles.")}
              </p>
            ) : (
              <div className={styles.charGrid}>
                {characters.map((c) => {
                  const thumb = thumbnailOf(c);
                  return (
                    <button key={c.id} type="button" aria-pressed={c.id === baseId} className={`${styles.charCard} ${c.id === baseId ? styles.charCardSelected : ''}`} onClick={() => setBaseId(c.id)}>
                      {thumb ? <img className={styles.thumb} src={thumb} alt="" loading="lazy" /> : <div className={`${styles.thumb} ${styles.thumbEmpty}`}>{t('kind_character', 'Personnage')}</div>}
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} disabled={missing.length > 0} onClick={() => base && onCreate(name.trim(), base)}>
              {t('cmpCreate', 'Créer la composition')}
            </button>
            <button type="button" className={styles.button} onClick={cancel}>
              {t('cmpCancel', 'Annuler')}
            </button>
            {missing.length > 0 && <span className={styles.hint}>{t('cmpMissingWhat', 'Il manque : {{what}}.', { what: missing.join(', ') })}</span>}
          </div>
        </section>
      )}

      <div className={styles.body}>
        <div className={styles.grid} role="list" data-testid="composition-list">
          {latest.length === 0 && !creating && (
            <div className={styles.empty} style={{ gridColumn: '1 / -1' }}>
              <p>
                <strong>{t('cmpEmptyTitle', "Vous n'avez pas encore de composition.")}</strong>
              </p>
              <ol className={styles.steps} style={{ textAlign: 'left', display: 'inline-flex' }}>
                <li>{t('cmpEmptyStep1', 'Créez une composition : un nom et un personnage de base.')}</li>
                <li>{t('cmpEmptyStep2', 'Choisissez un élément pour chaque emplacement.')}</li>
                <li>{t('cmpEmptyStep3', 'Vérifiez la compatibilité, enregistrez, puis publiez (la version devient immuable).')}</li>
              </ol>
              <p>
                <button type="button" className={styles.primary} onClick={open}>
                  {t('cmpFirst', 'Créer ma première composition')}
                </button>
              </p>
            </div>
          )}
          {latest.map((c) => (
            <div key={c.id} role="listitem" className={styles.cell}>
              <div className={styles.card}>
                <span className={styles.cardName}>{c.name}</span>
                <span className={styles.badge}>
                  v{c.version} · {t(`status_${c.status}`, STATUS_DEFAULTS[c.status])}
                </span>
                {c.variantOf && <span className={styles.badge}>{t('cmpVariantOf', 'variante de {{name}}', { name: nameOfId(c.variantOf.id) })}</span>}
                <button type="button" className={styles.primary} onClick={() => onOpen(c)} aria-label={`${t('cmpOpen', 'Ouvrir')} ${c.name}`}>
                  {t('cmpOpen', 'Ouvrir')}
                </button>
                {latest.length >= 2 && (
                  <label>
                    <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} aria-label={`${t('cmpSelect', 'Sélectionner')} ${c.name}`} /> {t('cmpToCompare', 'Comparer')}
                  </label>
                )}
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
  const baseThumb = base ? thumbnailOf(base) : null;
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
  const incompatible = !!compat && compat.verdict === 'incompatible';
  const canPublish = !readOnly && !dirty && !!compat && !incompatible;
  const publishHint = dirty
    ? t('cmpHintPublishSave', 'Enregistrez vos modifications pour pouvoir publier.')
    : incompatible
      ? t('cmpHintPublishIncompat', 'Corrigez les incompatibilités (section 3) pour pouvoir publier.')
      : t('cmpHintPublishOk', 'Publier rend cette version immuable : pour la modifier ensuite, créez une nouvelle version.');

  return (
    <div className={styles.editorBody}>
      <div className={styles.statusLine} style={{ paddingTop: '1rem' }}>
        <button type="button" className={styles.button} onClick={onBack}>
          ← {t('cmpBack', 'Mes compositions')}
        </button>
        <select className={styles.select} value={composition.version} onChange={(e) => onOpenVersion(Number(e.target.value))} aria-label={t('cmpVersion', 'Version')}>
          {versions.map((v) => (
            <option key={v.version} value={v.version}>
              v{v.version} — {t(`status_${v.status}`, STATUS_DEFAULTS[v.status])}
            </option>
          ))}
        </select>
        <span className={styles.badge}>{t(`status_${composition.status}`, STATUS_DEFAULTS[composition.status])}</span>
        {dirty && <span className={styles.dirty}>● {t('cmpDirty', 'Modifications non enregistrées')}</span>}
      </div>

      <label className={styles.field}>
        <strong>{t('cmpNameLabel', 'Nom')}</strong>
        <input className={styles.search} value={draft.name} disabled={readOnly} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} aria-label={t('cmpName', 'Nom de la composition')} />
      </label>

      {readOnly && (
        <div className={styles.notice} role="status" style={{ margin: 0 }}>
          {t('cmpImmutable', 'Cette version est « {{status}} » : elle est immuable. Créez une nouvelle version pour la modifier.', { status: t(`status_${composition.status}`, STATUS_DEFAULTS[composition.status]) })}
        </div>
      )}

      <div className={styles.cols}>
        <section className={styles.section} aria-label={t('cmpSec1', '1. Personnage de base')}>
          <h3>{t('cmpSec1', '1. Personnage de base')}</h3>
          <div className={styles.statusLine}>
            {baseThumb && <img className={styles.thumb} style={{ width: '4rem' }} src={baseThumb} alt="" />}
            <strong>{base?.name ?? draft.base.id}</strong>
          </div>
          <p className={styles.hint}>{t('cmpBaseLocked', 'Le personnage de base ne peut pas être changé : créez une nouvelle composition pour en utiliser un autre.')}</p>
        </section>

        <section className={styles.section} aria-label={t('cmpSec2', '2. Éléments par emplacement')}>
          <h3>{t('cmpSec2', '2. Éléments par emplacement')}</h3>
          <p className={styles.hint}>{t('cmpSlotsHint', "Choisissez un élément par emplacement. « Par défaut » garde l'élément d'origine du personnage. ✓ compatible · ⚠ adaptation requise · ✕ incompatible.")}</p>
          {slotsOf(base).map((slot) => {
            const chosen = draft.items.find((i) => i.slot === slot);
            return (
              <label key={slot} className={styles.field}>
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
      </div>

      <div className={styles.cols}>
        <section className={styles.section} aria-label={t('cmpSec3', '3. Vérification')}>
          <h3>{t('cmpSec3', '3. Vérification')}</h3>
          <div>
            <strong>{t('cmpCompat', 'Compatibilité')}</strong> : <span data-testid="compat-verdict">{compat ? t(`verdict_${compat.verdict}`, VERDICT_DEFAULTS[compat.verdict]) : '…'}</span>
          </div>
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
            {compat && compat.verdict === 'compatible' && !compat.items.some((i) => i.report.reasons.length) && <li>{t('cmpAllGood', 'Aucun problème détecté.')}</li>}
          </ul>
        </section>

        <section className={styles.section} aria-label={t('cmpSec4', '4. Aperçu 3D')}>
          <h3>{t('cmpSec4', '4. Aperçu 3D')}</h3>
          {previewModels.length === 0 ? (
            <p className={styles.hint}>{t('cmpNoPreview', "Aucun modèle 3D à afficher pour cette composition.")}</p>
          ) : showPreview ? (
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
          )}
        </section>
      </div>

      <section className={styles.section} aria-label={t('cmpActions', 'Actions')}>
        <h3>{t('cmpActions', 'Actions')}</h3>
        {!readOnly && (
          <div className={styles.actions}>
            <button type="button" className={styles.primary} disabled={!dirty} onClick={() => onSave({ name: draft.name, items: draft.items })}>
              {t('cmpSave', 'Enregistrer')}
            </button>
            <button type="button" className={styles.button} disabled={!canPublish} onClick={onPublish}>
              {t('cmpPublish', 'Publier cette version')}
            </button>
            <span className={styles.hint}>{publishHint}</span>
          </div>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={onNewVersion}>
            {t('cmpNewVersion', 'Nouvelle version')}
          </button>
          <span className={styles.hint}>{t('cmpHintNewVersion', 'Crée un brouillon à partir de cette version ; la version actuelle reste inchangée.')}</span>
        </div>
        <div className={styles.actions}>
          <input className={styles.search} style={{ flex: '0 1 16rem' }} value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder={t('cmpVariantName', 'Nom de la variante')} aria-label={t('cmpVariantName', 'Nom de la variante')} />
          <button type="button" className={styles.button} disabled={!variantName.trim()} onClick={() => onVariant(variantName.trim())}>
            {t('cmpVariant', 'Créer une variante')}
          </button>
          <span className={styles.hint}>{t('cmpHintVariant', 'Une variante est une nouvelle composition indépendante, qui part des mêmes éléments.')}</span>
        </div>
      </section>
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
          ← {t('cmpBack', 'Mes compositions')}
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
