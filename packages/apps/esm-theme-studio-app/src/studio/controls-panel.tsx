import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionItem, Button, InlineNotification, Select, SelectItem, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Toggle } from '@carbon/react';
import { buildCatalog, readControl, resolveTemplate, visibleAt, type ControlDef } from '../core/catalog';
import { COMPONENTS, getComponent, resolveComponentToken, STATES } from '../core/components';
import { isColor } from '../core/color';
import { getIn } from '../core/path';
import { controlsForPage } from '../page-controls';
import type { StudioPage } from '../pages';
import { ContrastBadge, ControlInput } from './controls';
import { useServices, useStudio } from './studio-context';
import styles from './studio.scss';

export const ControlRow: React.FC<{ def: ControlDef; perMode?: boolean }> = ({ def, perMode }) => {
  const { store } = useServices();
  const { doc, base, mode } = useStudio();
  const { t } = useTranslation();
  const value = readControl(doc, def, mode);
  const path = resolveTemplate(def.template, mode);
  const modified = JSON.stringify(getIn(doc, path)) !== JSON.stringify(getIn(base, path));
  const inherited = def.component ? resolveComponentToken(doc, mode, def.component.id, def.component.variant, def.component.state, def.component.prop) : null;

  return (
    <div className={styles.controlRow} data-modified={modified} data-testid={`control-${def.id}`}>
      <ControlInput def={def} value={value} placeholder={inherited?.value} onChange={(v) => (def.kind === 'scale' && def.scaleFamily ? store.setScale(def.scaleFamily, v) : store.setValue(def, v, { perMode }))} />
      <div className={styles.controlMeta}>
        {def.component && value === '' && <small>{inherited?.source ? t('inheritedFrom', 'Hérité de {{path}}', { path: inherited.source.slice(2).join(' › ') }) : t('inheritedGlobal', 'Token global')}</small>}
        {def.id === 'colors.surface.{mode}.foreground' && <ContrastBadge foreground={value} background={readControl(doc, { ...def, template: ['colors', 'surface', '{mode}', 'background'] }, mode)} />}
        {modified && (
          <Button kind="ghost" size="sm" onClick={() => store.resetValue(def)}>
            {t('reset', 'Réinitialiser {{label}}', { label: def.label })}
          </Button>
        )}
      </div>
    </div>
  );
};

const groupBy = (defs: ControlDef[]): [string, ControlDef[]][] => {
  const m = new Map<string, ControlDef[]>();
  defs.forEach((d) => m.set(d.group, [...(m.get(d.group) ?? []), d]));
  return [...m.entries()];
};

const Groups: React.FC<{ defs: ControlDef[]; perMode?: boolean }> = ({ defs, perMode }) => (
  <Accordion size="sm" isFlush>
    {groupBy(defs).map(([group, list]) => (
      <AccordionItem key={group} title={group} open>
        {list.map((d) => (
          <ControlRow key={d.id} def={d} perMode={perMode} />
        ))}
      </AccordionItem>
    ))}
  </Accordion>
);

/** Page d'édition d'une ou plusieurs catégories de tokens (Essentiels, Couleurs, Typographie, Formes…). */
export const CategoryPage: React.FC<{ page: StudioPage }> = ({ page }) => {
  const { doc, level } = useStudio();
  const { store } = useServices();
  const { t } = useTranslation();
  const catalog = useMemo(() => buildCatalog(doc), [doc]);
  const defs = controlsForPage(catalog, page, level);
  if (defs.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{t('nothingHere', 'Rien à régler à ce niveau.')}</p>
        {level !== 'expert' && (
          <Button kind="tertiary" size="sm" onClick={() => store.setLevel('expert')}>
            {t('switchToExpert', 'Passer en mode Expert')}
          </Button>
        )}
      </div>
    );
  }
  return <Groups defs={defs} />;
};

/** Page « Composants » : composant → variante → état, avec l'origine de chaque valeur (cascade). */
export const ComponentsPage: React.FC = () => {
  const { doc, level, mode, selection } = useStudio();
  const { store } = useServices();
  const { t } = useTranslation();
  const [perMode, setPerMode] = useState(false);
  const catalog = useMemo(() => buildCatalog(doc), [doc]);

  if (level === 'simple') {
    return (
      <div className={styles.empty}>
        <InlineNotification kind="info" lowContrast hideCloseButton title={t('componentsNeedAdvanced', 'La personnalisation des composants est disponible en mode Avancé.')} />
        <Button kind="tertiary" size="sm" onClick={() => store.setLevel('advanced')}>
          {t('switchToAdvanced', 'Passer en mode Avancé')}
        </Button>
      </div>
    );
  }

  const spec = getComponent(selection.component ?? '') ?? COMPONENTS[0];
  const variant = spec.variants.includes(selection.variant ?? '') ? (selection.variant as string) : spec.variants[0];
  const stateOptions = spec.states.filter((s) => s === 'default' || level === 'expert');
  const state = stateOptions.includes((selection.state ?? 'default') as never) ? (selection.state ?? 'default') : 'default';
  const defs = catalog.filter((d) => d.component?.id === spec.id && d.component.variant === variant && d.component.state === state && visibleAt(d, level));

  return (
    <>
      <div className={styles.pickers}>
        <Select id="studio-pick-component" size="sm" labelText={t('component', 'Composant')} value={spec.id} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { const c = getComponent(e.target.value)!; store.select({ component: c.id, variant: c.variants[0], state: 'default' }); }}>
          {COMPONENTS.map((c) => <SelectItem key={c.id} value={c.id} text={c.label} />)}
        </Select>
        <Select id="studio-pick-variant" size="sm" labelText={t('variant', 'Variante')} value={variant} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => store.select({ component: spec.id, variant: e.target.value, state })}>
          {spec.variants.map((v) => <SelectItem key={v} value={v} text={v} />)}
        </Select>
        <Select id="studio-pick-state" size="sm" labelText={t('state', 'État')} value={state} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => store.select({ component: spec.id, variant, state: e.target.value })}>
          {stateOptions.map((s) => <SelectItem key={s} value={s} text={s} />)}
        </Select>
      </div>
      <Toggle id="studio-per-mode" size="sm" labelText={t('perMode', 'Valeur distincte clair / sombre')} labelA={mode} labelB={mode} toggled={perMode} onToggle={setPerMode} />
      {defs.map((d) => <ControlRow key={d.id} def={d} perMode={perMode} />)}

      <h4 className={styles.subtitle}>{t('resolved', 'Valeurs résolues')} — {spec.label} › {variant} › {state}</h4>
      <Table size="sm" aria-label={t('resolved', 'Valeurs résolues')}>
        <TableHead>
          <TableRow>
            <TableHeader>{t('property', 'Propriété')}</TableHeader>
            <TableHeader>{t('value', 'Valeur')}</TableHeader>
            <TableHeader>{t('origin', 'Origine')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {spec.props.map((p) => {
            const r = resolveComponentToken(doc, mode, spec.id, variant, state, p.id);
            return (
              <TableRow key={p.id}>
                <TableCell>{p.label}</TableCell>
                <TableCell>{p.kind === 'color' && isColor(r.value) && <i className={styles.dot} style={{ background: r.value }} />}{r.value}</TableCell>
                <TableCell>{r.source ? r.source.slice(2).join(' › ') : t('inheritedGlobal', 'Token global')}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export { STATES };
