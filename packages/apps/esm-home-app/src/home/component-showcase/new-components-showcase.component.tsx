import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Autocomplete,
  Combobox,
  isXboxAudioMuted,
  MORPH_SELECT_DEFAULT_TRANSITION,
  MorphSelect,
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
  playXboxSound,
  toggleXboxAudio,
  type AutocompleteItemData,
  type ComboboxItemData,
  type XboxSoundType,
} from '@egen-civitas/esm-framework';
import styles from './component-showcase.module.css';

// =============================================================================
//  Vitrine — composants ajoutés récemment au styleguide
//    • Sélections (Tailwind) : MorphSelect, Autocomplete, Combobox
//    • Sons d'interface : playXboxSound
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

/**
 * Isole chaque bloc de la vitrine : si un composant plante (ex. export absent du shell
 * chargé, donc `undefined`), seule sa section affiche l'erreur — le reste de la page
 * (et ses autres composants) continue de s'afficher.
 */
export class ShowcaseBoundary extends React.Component<
  { name: string; children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{this.props.name}</h2>
          <p className={styles.sectionDescription}>
            Ce bloc n&apos;a pas pu s&apos;afficher : {this.state.error.message}. Vérifie que le shell (esm-app-shell)
            et esm-styleguide sont à jour.
          </p>
        </section>
      );
    }
    return this.props.children;
  }
}

export const Variant: React.FC<{ label: string; children: React.ReactNode; tall?: boolean }> = ({
  label,
  children,
  tall,
}) => (
  <div className={`${styles.variantCard} ${tall ? styles.variantCardTall : ''}`}>
    <span className={styles.variantLabel}>{label}</span>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Sélections
// ─────────────────────────────────────────────────────────────────────────────
const SelectionsShowcaseContent: React.FC = () => {
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
        <p className={styles.variantOutput} style={{ marginBottom: '1rem' }}>
          MORPH_SELECT_DEFAULT_TRANSITION = <code>{JSON.stringify(MORPH_SELECT_DEFAULT_TRANSITION)}</code>
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
//  Sons d'interface
// ─────────────────────────────────────────────────────────────────────────────
const SoundsShowcaseContent: React.FC = () => {
  const { t } = useTranslation();
  const [muted, setMuted] = useState(isXboxAudioMuted());

  return (
    <>
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

export const SelectionsShowcase: React.FC = () => (
  <ShowcaseBoundary name="Sélections (MorphSelect · Autocomplete · Combobox)">
    <SelectionsShowcaseContent />
  </ShowcaseBoundary>
);

export const SoundsShowcase: React.FC = () => (
  <ShowcaseBoundary name="Sons d'interface (playXboxSound)">
    <SoundsShowcaseContent />
  </ShowcaseBoundary>
);
