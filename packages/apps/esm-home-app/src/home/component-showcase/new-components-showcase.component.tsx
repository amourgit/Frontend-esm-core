import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ASSISTANT_MODES,
  Autocomplete,
  Combobox,
  isXboxAudioMuted,
  LiveOrb,
  MorphSelect,
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
  playXboxSound,
  PromptInput,
  RECURSIVE_EROSION_DEFAULTS,
  RecursiveErosionBackground,
  SplineScene,
  toggleXboxAudio,
  WaterGlassModal,
  type AutocompleteItemData,
  type ComboboxItemData,
  type LiveOrbVariant,
  type XboxSoundType,
} from '@egen-civitas/esm-framework';
import styles from './component-showcase.scss';

// =============================================================================
//  Vitrine — composants ajoutés récemment au styleguide
//    • Sélections (Tailwind) : MorphSelect, Autocomplete, Combobox
//    • Assistant IA : LiveOrb, SplineScene, PromptInput, RecursiveErosionBackground,
//      WaterGlassModal, ASSISTANT_MODES, sons Xbox
//  Chaque composant est présenté avec ses variantes (une carte = une variante).
//  Ce fichier n'utilise que les classes SCSS de la vitrine (aucune classe Tailwind
//  propre) : le rendu des composants eux-mêmes vient du styleguide.
// =============================================================================

const PROVINCES: AutocompleteItemData[] = [
  { value: 'estuaire', label: 'Estuaire', description: 'Chef-lieu : Libreville', tag: 'Nord-Ouest' },
  { value: 'haut-ogooue', label: 'Haut-Ogooué', description: 'Chef-lieu : Franceville', tag: 'Sud-Est' },
  { value: 'moyen-ogooue', label: 'Moyen-Ogooué', description: 'Chef-lieu : Lambaréné', tag: 'Centre' },
  { value: 'ngounie', label: 'Ngounié', description: 'Chef-lieu : Mouila', tag: 'Sud' },
  { value: 'nyanga', label: 'Nyanga', description: 'Chef-lieu : Tchibanga', tag: 'Sud-Ouest' },
  { value: 'ogooue-ivindo', label: 'Ogooué-Ivindo', description: 'Chef-lieu : Makokou', tag: 'Nord-Est' },
  { value: 'ogooue-lolo', label: 'Ogooué-Lolo', description: 'Chef-lieu : Koulamoutou', tag: 'Centre-Sud' },
  { value: 'ogooue-maritime', label: 'Ogooué-Maritime', description: 'Chef-lieu : Port-Gentil', tag: 'Ouest' },
  { value: 'woleu-ntem', label: 'Woleu-Ntem', description: 'Chef-lieu : Oyem', tag: 'Nord' },
];

const ROLES: ComboboxItemData[] = [
  {
    value: 'admin',
    label: 'Administrateur',
    description: 'Gère le tenant',
    group: 'Gouvernance',
    icon: '🛡️',
    keywords: ['root'],
  },
  { value: 'directeur', label: "Directeur d'établissement", group: 'Gouvernance', icon: '🏛️' },
  {
    value: 'enseignant',
    label: 'Enseignant',
    description: 'Notes et emplois du temps',
    group: 'Pédagogie',
    icon: '🎓',
  },
  { value: 'surveillant', label: 'Surveillant général', group: 'Pédagogie', icon: '👁️', disabled: true },
  { value: 'secretaire', label: 'Secrétaire', group: 'Administration', icon: '🗂️' },
  { value: 'comptable', label: 'Comptable', group: 'Administration', icon: '💼' },
];

const MORPH_STATUSES = [
  { value: 'actif', label: 'Actif', description: 'Visible par les utilisateurs' },
  { value: 'brouillon', label: 'Brouillon', description: 'Visible par les administrateurs' },
  { value: 'archive', label: 'Archivé', description: 'Lecture seule' },
  { value: 'suspendu', label: 'Suspendu', description: 'Accès temporairement coupé' },
];

const ORB_VARIANTS: Array<{
  label: string;
  props: { variant: LiveOrbVariant; color?: string; eyeColor?: string; interactive?: boolean; blink?: boolean };
}> = [
  { label: 'white (défaut)', props: { variant: 'white' } },
  { label: 'black', props: { variant: 'black' } },
  { label: 'webgl (dégradé)', props: { variant: 'webgl' } },
  { label: 'custom (couleurs libres)', props: { variant: 'custom', color: '#0f766e', eyeColor: '#ecfeff' } },
  { label: 'sans suivi du pointeur', props: { variant: 'white', interactive: false } },
  { label: 'sans clignement', props: { variant: 'black', blink: false } },
];

const XBOX_SOUNDS: XboxSoundType[] = [
  'hover',
  'select',
  'back',
  'modalOpen',
  'folderOpen',
  'scroll',
  'boundary',
  'notification',
  'achievement',
  'toastSuccess',
  'toastInfo',
  'toastWarning',
  'toastError',
  'toggle',
];

const SPLINE_SCENE = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

type Modal = 'right' | 'left' | 'center' | 'rich';

const Variant: React.FC<{ label: string; children: React.ReactNode; tall?: boolean }> = ({ label, children, tall }) => (
  <div className={`${styles.variantCard} ${tall ? styles.variantCardTall : ''}`}>
    <span className={styles.variantLabel}>{label}</span>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Sélections
// ─────────────────────────────────────────────────────────────────────────────
export const SelectionsShowcase: React.FC = () => {
  const { t } = useTranslation();

  // MorphSelect
  const [morphValue, setMorphValue] = useState('actif');

  // Autocomplete
  const [acSingle, setAcSingle] = useState('estuaire');
  const [acMulti, setAcMulti] = useState<string[]>(['estuaire', 'nyanga']);
  const [acCreatable, setAcCreatable] = useState<string[]>([]);
  const [acCreatableItems, setAcCreatableItems] = useState<AutocompleteItemData[]>(PROVINCES.slice(0, 3));
  const [acRemote, setAcRemote] = useState('');
  const [acRemoteItems, setAcRemoteItems] = useState<AutocompleteItemData[]>([]);
  const [acRemoteLoading, setAcRemoteLoading] = useState(false);
  const remoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Combobox
  const [cbBasic, setCbBasic] = useState('');
  const [cbGrouped, setCbGrouped] = useState('enseignant');
  const [cbKeep, setCbKeep] = useState('admin');
  const [cbRemote, setCbRemote] = useState('');
  const [cbQuery, setCbQuery] = useState('');

  useEffect(
    () => () => {
      if (remoteTimer.current) clearTimeout(remoteTimer.current);
    },
    [],
  );

  const handleRemoteSearch = (query: string) => {
    if (remoteTimer.current) clearTimeout(remoteTimer.current);
    if (!query.trim()) {
      setAcRemoteItems([]);
      setAcRemoteLoading(false);
      return;
    }
    setAcRemoteLoading(true);
    remoteTimer.current = setTimeout(() => {
      setAcRemoteItems(PROVINCES.filter((p) => p.label.toLowerCase().includes(query.trim().toLowerCase())));
      setAcRemoteLoading(false);
    }, 700);
  };

  const cbRemoteItems = ROLES.filter((r) => r.label.toLowerCase().includes(cbQuery.trim().toLowerCase()));

  return (
    <>
      {/* ── MorphSelect ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>MorphSelect</h2>
        <p className={styles.sectionDescription}>
          {t(
            'showcaseMorphSelectDescription',
            'Select dont le déclencheur se morphe en panneau (layout partagé) — composable : MorphSelectTrigger / Value / Content / Item.',
          )}
        </p>
        <div className={styles.variantsGrid}>
          <Variant label="Défaut" tall>
            <MorphSelect value={morphValue} onValueChange={setMorphValue}>
              <MorphSelectTrigger>
                <MorphSelectValue placeholder="Choisir un statut" />
              </MorphSelectTrigger>
              <MorphSelectContent>
                {MORPH_STATUSES.map((s) => (
                  <MorphSelectItem key={s.value} value={s.value}>
                    {s.label}
                  </MorphSelectItem>
                ))}
              </MorphSelectContent>
            </MorphSelect>
            <span className={styles.variantOutput}>Valeur : {morphValue}</span>
          </Variant>

          <Variant label="Sans valeur (placeholder)" tall>
            <MorphSelect>
              <MorphSelectTrigger>
                <MorphSelectValue placeholder="Aucun statut choisi" />
              </MorphSelectTrigger>
              <MorphSelectContent>
                {MORPH_STATUSES.map((s) => (
                  <MorphSelectItem key={s.value} value={s.value}>
                    {s.label}
                  </MorphSelectItem>
                ))}
              </MorphSelectContent>
            </MorphSelect>
          </Variant>

          <Variant label="Rayon 24 · ressort lent · stagger 0,08 s" tall>
            <MorphSelect
              defaultValue="brouillon"
              radius={24}
              stagger={0.08}
              staggerDelay={0.15}
              transition={{ type: 'spring', duration: 0.9, bounce: 0.4 }}
            >
              <MorphSelectTrigger>
                <MorphSelectValue placeholder="Statut" />
              </MorphSelectTrigger>
              <MorphSelectContent>
                {MORPH_STATUSES.map((s) => (
                  <MorphSelectItem key={s.value} value={s.value}>
                    {s.label}
                  </MorphSelectItem>
                ))}
              </MorphSelectContent>
            </MorphSelect>
          </Variant>

          <Variant label="Items riches + icône et indicateur custom" tall>
            <MorphSelect defaultValue="actif">
              <MorphSelectTrigger icon={<span aria-hidden>▾</span>}>
                <MorphSelectValue placeholder="Statut" />
              </MorphSelectTrigger>
              <MorphSelectContent icon={<span aria-hidden>▾</span>}>
                {MORPH_STATUSES.map((s) => (
                  <MorphSelectItem key={s.value} value={s.value} label={s.label} indicator={<span aria-hidden>●</span>}>
                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{s.label}</strong>
                      <small style={{ opacity: 0.6 }}>{s.description}</small>
                    </span>
                  </MorphSelectItem>
                ))}
              </MorphSelectContent>
            </MorphSelect>
          </Variant>

          <Variant label="Item désactivé" tall>
            <MorphSelect defaultValue="actif">
              <MorphSelectTrigger>
                <MorphSelectValue placeholder="Statut" />
              </MorphSelectTrigger>
              <MorphSelectContent>
                {MORPH_STATUSES.map((s) => (
                  <MorphSelectItem key={s.value} value={s.value} disabled={s.value === 'suspendu'}>
                    {s.label}
                  </MorphSelectItem>
                ))}
              </MorphSelectContent>
            </MorphSelect>
          </Variant>

          <Variant label="Composant désactivé">
            <MorphSelect defaultValue="archive" disabled>
              <MorphSelectTrigger>
                <MorphSelectValue placeholder="Statut" />
              </MorphSelectTrigger>
              <MorphSelectContent>
                {MORPH_STATUSES.map((s) => (
                  <MorphSelectItem key={s.value} value={s.value}>
                    {s.label}
                  </MorphSelectItem>
                ))}
              </MorphSelectContent>
            </MorphSelect>
          </Variant>
        </div>
      </section>

      {/* ── Autocomplete ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Autocomplete</h2>
        <p className={styles.sectionDescription}>
          {t(
            'showcaseAutocompleteDescription',
            'Capsule Material 3 — sélection simple ou multiple (chips), création à la volée, chargement, rendu et textes personnalisables.',
          )}
        </p>
        <div className={styles.variantsGrid}>
          <Variant label="Sélection simple" tall>
            <Autocomplete
              items={PROVINCES}
              value={acSingle}
              onValueChange={setAcSingle}
              placeholder="Province…"
              emptyMessage="Aucune province"
            />
            <span className={styles.variantOutput}>Valeur : {acSingle || '—'}</span>
          </Variant>

          <Variant label="Multi-sélection (chips)" tall>
            <Autocomplete
              items={PROVINCES}
              value={acMulti}
              onValueChange={setAcMulti}
              placeholder="Provinces…"
              labels={{ clear: 'Tout effacer', empty: 'Aucun résultat' }}
            />
            <span className={styles.variantOutput}>{acMulti.length} sélectionnée(s)</span>
          </Variant>

          <Variant label="Multi · min 1 · max 3" tall>
            <Autocomplete
              items={PROVINCES}
              value={acMulti}
              onValueChange={setAcMulti}
              placeholder="Entre 1 et 3 provinces"
              minOptions={1}
              maxOptions={3}
            />
          </Variant>

          <Variant label="Création à la volée (isCreatable)" tall>
            <Autocomplete
              items={acCreatableItems}
              value={acCreatable}
              onValueChange={setAcCreatable}
              placeholder="Tape un nom inexistant…"
              isCreatable
              onCreate={(v) => {
                const created = { value: v.toLowerCase().replace(/\s+/g, '-'), label: v };
                setAcCreatableItems((prev) => [...prev, created]);
                setAcCreatable((prev) => [...prev, created.value]);
              }}
              labels={{ create: (input) => `Ajouter « ${input} »` }}
            />
          </Variant>

          <Variant label="Recherche distante (filterFn=false + loading)" tall>
            <Autocomplete
              items={acRemoteItems}
              value={acRemote}
              onValueChange={setAcRemote}
              onInputChange={handleRemoteSearch}
              filterFn={false}
              loading={acRemoteLoading}
              placeholder="Tape « es », « og »…"
              labels={{ loading: 'Recherche en cours…', empty: 'Aucun résultat' }}
            />
          </Variant>

          <Variant label="Rendu d'option personnalisé (renderItem)" tall>
            <Autocomplete
              items={PROVINCES}
              value={acSingle}
              onValueChange={setAcSingle}
              placeholder="Province…"
              maxListHeight={180}
              renderItem={(item, state) => (
                <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 12 }}>
                  <span>
                    {state.isSelected ? '✓ ' : ''}
                    {item.label}
                  </span>
                  <small style={{ opacity: 0.6 }}>{item.tag}</small>
                </span>
              )}
            />
          </Variant>

          <Variant label="Désactivé">
            <Autocomplete items={PROVINCES} value="nyanga" disabled />
          </Variant>
        </div>
      </section>

      {/* ── Combobox ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Combobox</h2>
        <p className={styles.sectionDescription}>
          {t(
            'showcaseComboboxDescription',
            'Déclencheur + recherche dans un popover (design shadcn sans Radix/cmdk) — groupes, icônes, filtre personnalisable, placement configurable.',
          )}
        </p>
        <div className={styles.variantsGrid}>
          <Variant label="Défaut (recherche)">
            <Combobox
              items={ROLES}
              value={cbBasic}
              onValueChange={setCbBasic}
              placeholder="Choisir un rôle…"
              searchPlaceholder="Rechercher un rôle…"
              emptyMessage="Aucun rôle trouvé."
            />
            <span className={styles.variantOutput}>Valeur : {cbBasic || '—'}</span>
          </Variant>

          <Variant label="Groupes + icônes + descriptions">
            <Combobox items={ROLES} value={cbGrouped} onValueChange={setCbGrouped} placeholder="Rôle" />
          </Variant>

          <Variant label="Sans recherche (searchable=false)">
            <Combobox items={ROLES} defaultValue="secretaire" searchable={false} placeholder="Rôle" />
          </Variant>

          <Variant label="allowDeselect=false · closeOnSelect=false">
            <Combobox
              items={ROLES}
              value={cbKeep}
              onValueChange={setCbKeep}
              allowDeselect={false}
              closeOnSelect={false}
              placeholder="Rôle"
            />
          </Variant>

          <Variant label="Rendu personnalisé (renderItem / renderValue)">
            <Combobox
              items={ROLES}
              defaultValue="comptable"
              renderValue={(selected) => (selected ? `${selected.icon} ${selected.label}` : 'Aucun rôle')}
              renderItem={(item, state) => (
                <span style={{ fontWeight: state.isSelected ? 700 : 400 }}>
                  {item.icon} {item.label}
                </span>
              )}
            />
          </Variant>

          <Variant label="Recherche côté serveur (filterFn=false)">
            <Combobox
              items={cbRemoteItems}
              value={cbRemote}
              onValueChange={setCbRemote}
              filterFn={false}
              onSearchChange={setCbQuery}
              placeholder="Rôle (filtre externe)"
            />
          </Variant>

          <Variant label="side=top · align=end">
            <Combobox items={ROLES} side="top" align="end" placeholder="S'ouvre vers le haut" />
          </Variant>

          <Variant label="Désactivé">
            <Combobox items={ROLES} defaultValue="admin" disabled />
          </Variant>
        </div>
      </section>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Assistant IA
// ─────────────────────────────────────────────────────────────────────────────
export const AssistantShowcase: React.FC = () => {
  const { t } = useTranslation();

  const [splineOn, setSplineOn] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [controlledPrompt, setControlledPrompt] = useState('');
  const [erosionMode, setErosionMode] = useState<'dark' | 'light'>(RECURSIVE_EROSION_DEFAULTS.mode);
  const [hue, setHue] = useState<number>(RECURSIVE_EROSION_DEFAULTS.hue);
  const [saturation, setSaturation] = useState<number>(RECURSIVE_EROSION_DEFAULTS.saturation);
  const [brightness, setBrightness] = useState<number>(RECURSIVE_EROSION_DEFAULTS.brightness);
  const [modals, setModals] = useState<Record<Modal, boolean>>({
    right: true,
    left: false,
    center: false,
    rich: false,
  });
  const [muted, setMuted] = useState(isXboxAudioMuted());

  const toggleModal = (key: Modal) => setModals((prev) => ({ ...prev, [key]: !prev[key] }));

  const modalLabels: Record<Modal, string> = {
    right: 'align="right"',
    left: 'align="left"',
    center: 'align="center"',
    rich: 'header + footer',
  };

  return (
    <>
      {/* ── LiveOrb ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>LiveOrb</h2>
        <p className={styles.sectionDescription}>
          {t(
            'showcaseLiveOrbDescription',
            'Sphère 3D dont les yeux suivent le pointeur (WebGL, repli CSS sans GPU) — variantes de matière, couleurs libres, suivi et clignement désactivables.',
          )}
        </p>
        <div className={styles.variantsGrid}>
          {ORB_VARIANTS.map((orb) => (
            <Variant key={orb.label} label={orb.label}>
              <div className={styles.stageCenter}>
                <LiveOrb size={140} {...orb.props} />
              </div>
            </Variant>
          ))}
        </div>
      </section>

      {/* ── SplineScene ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>SplineScene</h2>
        <p className={styles.sectionDescription}>
          {t(
            'showcaseSplineSceneDescription',
            'Scène 3D Spline plein cadre (prop scene = URL .splinecode) — chargée à la demande car la scène pèse ~1,3 Mo.',
          )}
        </p>
        <button type="button" className={styles.controlButton} onClick={() => setSplineOn((v) => !v)}>
          {splineOn ? 'Décharger la scène' : 'Charger la scène 3D'}
        </button>
        {splineOn && (
          <div className={styles.stageDark} style={{ height: 340, marginTop: '1rem' }}>
            <SplineScene scene={SPLINE_SCENE} />
          </div>
        )}
      </section>

      {/* ── PromptInput ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>PromptInput</h2>
        <p className={styles.sectionDescription}>
          {t(
            'showcasePromptInputDescription',
            "Zone de saisie de l'assistant — choix du modèle et de l'effort, pièces jointes, envoi avec Entrée. Le callback onSubmit reçoit le texte et les métadonnées.",
          )}
        </p>
        <div className={styles.variantsStack}>
          <Variant label="Défaut">
            <PromptInput
              onSubmit={(value, meta) =>
                setLastPrompt(`${value} — ${meta.model} / ${meta.effort} / ${meta.attachments.length} pièce(s)`)
              }
            />
            <span className={styles.variantOutput}>Dernier envoi : {lastPrompt || '—'}</span>
          </Variant>
          <Variant label="Modèles, efforts et placeholder personnalisés · 1 pièce jointe max">
            <PromptInput
              placeholder="Pose une question sur tes documents GED…"
              models={['EGEN Rapide', 'EGEN Expert']}
              efforts={['Standard', 'Approfondi']}
              maxAttachments={1}
              onSubmit={(value, meta) => setLastPrompt(`${value} — ${meta.model} / ${meta.effort}`)}
            />
          </Variant>
          <Variant label="Contrôlé (value / onChange)">
            <PromptInput
              value={controlledPrompt}
              onChange={setControlledPrompt}
              onSubmit={() => setControlledPrompt('')}
            />
            <span className={styles.variantOutput}>{controlledPrompt.length} caractère(s) saisi(s)</span>
          </Variant>
        </div>
      </section>

      {/* ── RecursiveErosionBackground ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>RecursiveErosionBackground</h2>
        <p className={styles.sectionDescription}>
          {t(
            'showcaseRecursiveErosionDescription',
            'Fond animé « sphère de particules » (iframe sandboxée) — mode clair/sombre, teinte, saturation et luminosité réglables.',
          )}
        </p>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={() => setErosionMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          >
            Mode : {erosionMode}
          </button>
          <label className={styles.controlLabel}>
            Teinte {hue}°
            <input type="range" min={-180} max={180} value={hue} onChange={(e) => setHue(Number(e.target.value))} />
          </label>
          <label className={styles.controlLabel}>
            Saturation {saturation.toFixed(1)}
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
            />
          </label>
          <label className={styles.controlLabel}>
            Luminosité {brightness.toFixed(2)}
            <input
              type="range"
              min={0.35}
              max={1.65}
              step={0.05}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            className={styles.controlButton}
            onClick={() => {
              setErosionMode(RECURSIVE_EROSION_DEFAULTS.mode);
              setHue(RECURSIVE_EROSION_DEFAULTS.hue);
              setSaturation(RECURSIVE_EROSION_DEFAULTS.saturation);
              setBrightness(RECURSIVE_EROSION_DEFAULTS.brightness);
            }}
          >
            Réinitialiser
          </button>
        </div>
        <div className={styles.stageDark} style={{ height: 300 }}>
          <RecursiveErosionBackground mode={erosionMode} hue={hue} saturation={saturation} brightness={brightness} />
        </div>
      </section>

      {/* ── WaterGlassModal ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>WaterGlassModal</h2>
        <p className={styles.sectionDescription}>
          {t(
            'showcaseWaterGlassDescription',
            "Panneau « verre d'eau » pour menus et popovers — alignement, largeur, slots header/footer. Se positionne par rapport au parent relatif.",
          )}
        </p>
        <div className={styles.controls}>
          {(Object.keys(modalLabels) as Modal[]).map((key) => (
            <button key={key} type="button" className={styles.controlButton} onClick={() => toggleModal(key)}>
              {modals[key] ? 'Masquer' : 'Afficher'} · {modalLabels[key]}
            </button>
          ))}
        </div>
        <div className={styles.stageDark} style={{ height: 300, position: 'relative', overflow: 'visible' }}>
          {modals.right && (
            <WaterGlassModal align="right" className="absolute" style={{ top: 8, width: 224 }}>
              <div style={{ padding: 8 }}>align="right"</div>
            </WaterGlassModal>
          )}
          {modals.left && (
            <WaterGlassModal align="left" className="absolute" style={{ top: 8, width: 224 }}>
              <div style={{ padding: 8 }}>align="left"</div>
            </WaterGlassModal>
          )}
          {modals.center && (
            <WaterGlassModal align="center" className="absolute" style={{ top: 96, width: 224 }}>
              <div style={{ padding: 8 }}>align="center"</div>
            </WaterGlassModal>
          )}
          {modals.rich && (
            <WaterGlassModal
              align="center"
              className="absolute"
              style={{ bottom: 12, width: 288 }}
              header={<strong>Actions rapides</strong>}
              footer={<small>Échap pour fermer</small>}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 6 }}>
                <span>Nouveau dossier</span>
                <span>Téléverser un fichier</span>
                <span>Ouvrir la recherche GED</span>
              </div>
            </WaterGlassModal>
          )}
        </div>
      </section>

      {/* ── ASSISTANT_MODES ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ASSISTANT_MODES</h2>
        <p className={styles.sectionDescription}>
          {t(
            'showcaseAssistantModesDescription',
            "Les 4 modes de l'assistant (données du styleguide : nom, accroche, principe, exemple, classes de couleur).",
          )}
        </p>
        <div className={styles.variantsGrid}>
          {Object.values(ASSISTANT_MODES).map((mode) => (
            <Variant key={mode.id} label={`${mode.number} · ${mode.id}`}>
              <strong>
                {mode.emoji} {mode.name}
              </strong>
              <span className={styles.variantOutput}>{mode.tagline}</span>
              <span>{mode.principle}</span>
              <em className={styles.variantOutput}>Ex. : {mode.example}</em>
            </Variant>
          ))}
        </div>
      </section>

      {/* ── Sons Xbox ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>playXboxSound</h2>
        <p className={styles.sectionDescription}>
          {t(
            'showcaseXboxSoundsDescription',
            "Effets sonores de l'interface (Web Audio, aucun fichier) — clique un bouton pour jouer le son ; le mode muet est mémorisé.",
          )}
        </p>
        <div className={styles.controls}>
          <button type="button" className={styles.controlButton} onClick={() => setMuted(toggleXboxAudio())}>
            {muted ? '🔇 Son coupé' : '🔊 Son actif'}
          </button>
        </div>
        <div className={styles.controls}>
          {XBOX_SOUNDS.map((sound) => (
            <button key={sound} type="button" className={styles.controlButton} onClick={() => playXboxSound(sound)}>
              {sound}
            </button>
          ))}
        </div>
      </section>
    </>
  );
};
