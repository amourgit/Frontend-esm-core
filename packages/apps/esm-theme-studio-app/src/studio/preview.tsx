import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { componentStyle } from '../core/component-style';
import { COMPONENTS, getComponent } from '../core/components';
import { useServices, useStudio } from './studio-context';
import styles from './studio.scss';

type Tag = 'div' | 'button' | 'span' | 'input' | 'th' | 'td';

/** Élément stylé par le registre : le Studio ne crée aucun composant spécifique, il habille des éléments neutres avec les tokens. */
const Styled: React.FC<{ c: string; v?: string; s?: string; as?: Tag; children?: React.ReactNode; extra?: React.CSSProperties; label?: string }> = ({ c, v, s = 'default', as: Tag = 'div', children, extra, label }) => {
  const variant = v ?? getComponent(c)?.variants[0] ?? 'base';
  const style = { ...componentStyle(c, variant, s), ...extra } as React.CSSProperties;
  const props = { style, 'data-component': c, 'data-variant': variant, 'data-state': s, 'aria-label': label } as Record<string, unknown>;
  if (Tag === 'input') return <input {...props} readOnly value={String(children ?? '')} disabled={s === 'disabled'} />;
  return React.createElement(Tag, props, children);
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className={styles.previewSection}>
    <h4>{title}</h4>
    {children}
  </section>
);

/** Vitrine du Design System : tout ce qui est dans le registre est visible, variante × état. */
export const Showcase: React.FC = () => {
  const { t } = useTranslation();
  const button = getComponent('button')!;
  const input = getComponent('input')!;
  return (
    <>
      <Section title={t('typography', 'Typographie')}>
        <h1 style={{ fontFamily: 'var(--typography-font-family-heading)', fontSize: 'var(--typography-font-size-3xl-size, 1.875rem)', margin: 0 }}>Titre principal</h1>
        <h2 style={{ fontFamily: 'var(--typography-font-family-heading)', fontSize: 'var(--typography-font-size-xl-size, 1.25rem)', margin: '0.5rem 0' }}>Sous-titre</h2>
        <p style={{ fontFamily: 'var(--typography-font-family-body)', fontSize: 'var(--typography-font-size-base-size, 1rem)' }}>Corps de texte : la hiérarchie visuelle évolue avec la typographie du thème.</p>
        <code style={{ fontFamily: 'var(--typography-font-family-mono)' }}>const theme = egen.studio();</code>
      </Section>

      <Section title="Button — variantes × états">
        <div className={styles.matrix}>
          {button.variants.map((variant) => (
            <div key={variant} className={styles.matrixRow}>
              <span className={styles.matrixLabel}>{variant}</span>
              {button.states.map((s) => (
                <Styled key={s} c="button" v={variant} s={s} as="button">
                  {s}
                </Styled>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Champs">
        <div className={styles.row}>
          {input.states.map((s) => (
            <Styled key={s} c="input" v="outline" s={s} as="input">
              {s}
            </Styled>
          ))}
        </div>
        <div className={styles.row}>
          <Styled c="select" as="div" extra={{ minWidth: '8rem' }}>
            Sélection ▾
          </Styled>
          <Styled c="checkbox" as="span" extra={{ display: 'inline-block' }} />
          <Styled c="radio" as="span" extra={{ display: 'inline-block', borderRadius: '9999px' }} />
          <Styled c="switch" as="span" extra={{ display: 'inline-block', height: '1.25rem' }} />
        </div>
      </Section>

      <Section title="Cartes">
        <div className={styles.row}>
          {getComponent('card')!.variants.map((v) => (
            <Styled key={v} c="card" v={v} extra={{ flex: '1 1 10rem' }}>
              <strong>{v}</strong>
              <p style={{ margin: '0.25rem 0 0' }}>Contenu de carte</p>
            </Styled>
          ))}
        </div>
      </Section>

      <Section title="Badges, alertes, notifications">
        <div className={styles.row}>
          {getComponent('badge')!.variants.map((v) => (
            <Styled key={v} c="badge" v={v} as="span">
              {v}
            </Styled>
          ))}
        </div>
        {getComponent('alert')!.variants.map((v) => (
          <Styled key={v} c="alert" v={v} extra={{ marginTop: '0.5rem' }}>
            Alerte {v}
          </Styled>
        ))}
        <div className={styles.row} style={{ marginTop: '0.5rem' }}>
          {getComponent('toast')!.variants.map((v) => (
            <Styled key={v} c="toast" v={v}>
              Toast {v}
            </Styled>
          ))}
        </div>
      </Section>

      <Section title="Tableau">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nom', 'Rôle', 'Statut'].map((h) => (
                <Styled key={h} c="table" as="th" extra={{ background: 'var(--components-table-base-default-header-background, var(--colors-surface-muted))', textAlign: 'left' }}>
                  {h}
                </Styled>
              ))}
            </tr>
          </thead>
          <tbody>
            {(['default', 'hover', 'selected'] as const).map((s, i) => (
              <tr key={s}>
                {[`Ligne ${i + 1}`, 'Membre', s].map((cell) => (
                  <Styled key={cell} c="table" s={s} as="td">
                    {cell}
                  </Styled>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Navigation, onglets, menus">
        <div className={styles.row}>
          {getComponent('tabs')!.states.map((s) => (
            <Styled key={s} c="tabs" v="pill" s={s} as="span">
              Onglet {s}
            </Styled>
          ))}
        </div>
        <div className={styles.row}>
          {getComponent('navigation')!.states.map((s) => (
            <Styled key={s} c="navigation" s={s} as="span">
              Lien {s}
            </Styled>
          ))}
        </div>
        <Styled c="dropdown" extra={{ display: 'inline-block', marginTop: '0.5rem' }}>
          {(['default', 'hover', 'selected'] as const).map((s) => (
            <Styled key={s} c="dropdown" s={s}>
              Entrée {s}
            </Styled>
          ))}
        </Styled>
      </Section>

      <Section title="Dialogues, infobulles, panneaux">
        <div className={styles.row}>
          <Styled c="dialog" extra={{ flex: '1 1 14rem' }}>
            <strong>Confirmer l’action</strong>
            <p>Voulez-vous vraiment continuer ?</p>
            <div className={styles.row}>
              <Styled c="button" v="primary" as="button">
                Confirmer
              </Styled>
              <Styled c="button" v="outline" as="button">
                Annuler
              </Styled>
            </div>
          </Styled>
          <Styled c="tooltip" extra={{ alignSelf: 'start' }}>
            Infobulle
          </Styled>
        </div>
      </Section>

      <Section title="Disposition (sidebar + header)">
        <div className={styles.miniLayout}>
          <Styled c="sidebar" extra={{ width: '6rem', padding: '0.5rem' }}>
            Sidebar
          </Styled>
          <div style={{ flex: 1 }}>
            <Styled c="header" extra={{ height: '2.5rem', padding: '0 0.75rem', display: 'flex', alignItems: 'center' }}>
              Header
            </Styled>
            <p style={{ padding: '0.75rem' }}>Contenu ({COMPONENTS.length} composants au registre)</p>
          </div>
        </div>
      </Section>
    </>
  );
};

/** Conteneur de prévisualisation : variables CSS scopées, indépendantes du mode de l'application. */
export const Preview: React.FC = () => {
  const { runtime } = useServices();
  const { doc, mode } = useStudio();
  const vars = useMemo(() => runtime.previewVars(doc, mode), [runtime, doc, mode]);
  return (
    <div className={styles.preview} data-theme={mode} data-testid="preview" style={vars as React.CSSProperties}>
      <Showcase />
    </div>
  );
};
