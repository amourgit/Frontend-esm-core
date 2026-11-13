import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button, Checkbox, Dropdown, InlineNotification, ProgressBar, RadioButton, RadioButtonGroup, Select, SelectItem, Slider, Tab, TabList, TabPanel, TabPanels, Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow, Tabs, Tag, TextArea, TextInput, Tile, Toggle,
} from '@carbon/react';
import { previewStyle } from '../core/carbon-scope';
import { generateScale, SCALE_STEPS } from '../core/color';
import { getIn } from '../core/path';
import { useServices, useStudio } from './studio-context';
import styles from './studio.scss';

// Prévisualisation avec les VRAIS composants Carbon/EGEN (aucun composant propre au Studio, cf. cahier §24).
// Les surcharges au niveau composant (`components.*`) seront visibles ici dès que les composants les consomment (lot TokiForge/composants).

const BUTTON_KINDS = ['primary', 'secondary', 'tertiary', 'ghost', 'danger', 'danger--tertiary', 'danger--ghost'] as const;
const TAG_TYPES = ['red', 'magenta', 'purple', 'blue', 'cyan', 'teal', 'green', 'gray', 'warm-gray'] as const;
const NOTIFS = ['info', 'success', 'warning', 'error'] as const;
const SCALES = ['primary', 'secondary', 'neutral', 'success', 'warning', 'error', 'info'];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className={styles.previewSection}>
    <h4>{title}</h4>
    {children}
  </section>
);

const ButtonsTab: React.FC = () => (
  <>
    <Section title="Button — kinds">
      <div className={styles.row}>{BUTTON_KINDS.map((k) => <Button key={k} kind={k}>{k}</Button>)}</div>
    </Section>
    <Section title="Button — tailles & état désactivé">
      <div className={styles.row}>
        {(['sm', 'md', 'lg'] as const).map((s) => <Button key={s} size={s}>{s}</Button>)}
        <Button disabled>disabled</Button>
      </div>
    </Section>
    <Section title="Tags">
      <div className={styles.row}>{TAG_TYPES.map((t) => <Tag key={t} type={t}>{t}</Tag>)}</div>
    </Section>
    <Section title="Notifications">
      {NOTIFS.map((k) => <InlineNotification key={k} kind={k} lowContrast hideCloseButton title={`Notification ${k}`} subtitle="Message d’exemple" />)}
    </Section>
  </>
);

const FormsTab: React.FC = () => (
  <div className={styles.formGrid}>
    <TextInput id="pv-text" labelText="Champ texte" placeholder="Saisir…" />
    <TextInput id="pv-invalid" labelText="Champ invalide" invalid invalidText="Valeur incorrecte" defaultValue="oops" />
    <Select id="pv-select" labelText="Liste">{['Option A', 'Option B'].map((o) => <SelectItem key={o} value={o} text={o} />)}</Select>
    <Dropdown id="pv-dropdown" titleText="Dropdown" label="Choisir" items={['Un', 'Deux', 'Trois']} itemToString={(i: string | null) => i ?? ''} />
    <TextArea id="pv-area" labelText="Zone de texte" rows={3} />
    <Slider id="pv-slider" labelText="Curseur" min={0} max={100} value={40} />
    <Checkbox id="pv-check" labelText="Case à cocher" defaultChecked />
    <RadioButtonGroup legendText="Boutons radio" name="pv-radio" defaultSelected="a">
      <RadioButton id="pv-ra" labelText="A" value="a" />
      <RadioButton id="pv-rb" labelText="B" value="b" />
    </RadioButtonGroup>
    <Toggle id="pv-toggle" labelText="Interrupteur" defaultToggled />
  </div>
);

const DataTab: React.FC = () => (
  <>
    <Section title="Tableau">
      <Table size="md" aria-label="Exemple">
        <TableHead><TableRow>{['Nom', 'Rôle', 'Statut'].map((h) => <TableHeader key={h}>{h}</TableHeader>)}</TableRow></TableHead>
        <TableBody>
          {[['Awa', 'Admin', 'Actif'], ['Marc', 'Membre', 'Invité'], ['Léa', 'Membre', 'Actif']].map((r) => <TableRow key={r[0]}>{r.map((c) => <TableCell key={c}>{c}</TableCell>)}</TableRow>)}
        </TableBody>
      </Table>
    </Section>
    <Section title="Tuiles & progression">
      <div className={styles.row}>
        <Tile>Tuile standard</Tile>
        <Tile>Autre tuile</Tile>
      </div>
      <ProgressBar label="Avancement" value={65} max={100} />
    </Section>
  </>
);

const TypographyTab: React.FC = () => (
  <div style={{ fontFamily: 'var(--typography-font-family-body)' }}>
    <h1 style={{ fontFamily: 'var(--typography-font-family-heading)' }}>Titre principal</h1>
    <h2 style={{ fontFamily: 'var(--typography-font-family-heading)' }}>Sous-titre</h2>
    <p>Corps de texte : la hiérarchie visuelle suit la typographie du thème édité.</p>
    <code style={{ fontFamily: 'var(--typography-font-family-mono)' }}>const theme = egen.studio();</code>
  </div>
);

const ColorsTab: React.FC = () => {
  const { doc, mode } = useStudio();
  return (
    <>
      {SCALES.map((family) => {
        const scale = getIn(doc, ['colors', family]) as Record<string, string> | undefined;
        if (!scale) return null;
        return (
          <Section key={family} title={family}>
            <div className={styles.scale}>{SCALE_STEPS.map((s) => <span key={s} title={`${family}-${s}`} style={{ background: `var(--colors-${family}-${s})` }}>{s}</span>)}</div>
          </Section>
        );
      })}
      <Section title={`Surfaces (${mode})`}>
        <div className={styles.scale}>
          {Object.keys((getIn(doc, ['colors', 'surface', mode]) as object) ?? {}).map((k) => (
            <span key={k} title={k} style={{ background: `var(--colors-surface-${k.replace(/([A-Z])/g, '-$1').toLowerCase()})`, color: 'var(--colors-surface-foreground)' }}>{k}</span>
          ))}
        </div>
      </Section>
    </>
  );
};

/** Conteneur de prévisualisation : variables du thème édité + pont Carbon scopés, indépendants du thème de l'application. */
export const Preview: React.FC = () => {
  const { runtime } = useServices();
  const { doc, mode } = useStudio();
  const { t } = useTranslation();
  const style = useMemo(() => previewStyle(runtime.previewVars(doc, mode)), [runtime, doc, mode]);
  void generateScale;
  return (
    <div className={styles.preview} data-theme={mode} data-carbon-theme={mode === 'dark' ? 'g100' : 'white'} data-testid="preview" style={style as React.CSSProperties}>
      <Tabs>
        <TabList aria-label={t('preview', 'Prévisualisation')} contained>
          <Tab>{t('pvComponents', 'Composants')}</Tab>
          <Tab>{t('pvForms', 'Formulaires')}</Tab>
          <Tab>{t('pvData', 'Données')}</Tab>
          <Tab>{t('typography', 'Typographie')}</Tab>
          <Tab>{t('pvColors', 'Couleurs')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel><ButtonsTab /></TabPanel>
          <TabPanel><FormsTab /></TabPanel>
          <TabPanel><DataTab /></TabPanel>
          <TabPanel><TypographyTab /></TabPanel>
          <TabPanel><ColorsTab /></TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};
