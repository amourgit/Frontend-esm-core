import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigurableLink, useConfig, useSession } from '@egen/esm-framework';
import { type ConfigSchema, type FooterLink } from '../../config-schema';
import styles from './footer.scss';

// =============================================================================
//  FOOTER — Pied de page minimaliste EGEN
//
//  Rôle unique : afficher les informations de l'entreprise à l'origine du
//  projet (nom, accroche, copyright, liens secondaires optionnels).
//
//  Présence : mêmes pages authentifiées que la TopBar (voir root.component.tsx
//  — même liste de routes publiques exclues). Aucune logique de session ici,
//  la garde d'authentification vit dans `FooterGuard` ci-dessous, à l'identique
//  du patron déjà établi par `TopBar` dans esm-primary-navigation-app.
// =============================================================================

const isExternalLink = (url: string): boolean => /^https?:\/\//i.test(url);

const FooterExternalLink: React.FC<{ link: FooterLink }> = ({ link }) => (
  <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
    {link.title}
  </a>
);

const FooterInternalLink: React.FC<{ link: FooterLink }> = ({ link }) => (
  <ConfigurableLink to={link.url} className={styles.footerLink}>
    {link.title}
  </ConfigurableLink>
);

const FooterContent: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const { company, copyright, links } = config;
  const hasCompanyUrl = Boolean(company.url);
  const hasLinks = links.length > 0;

  return (
    <footer className={styles.footerWrapper} aria-label={t('appFooter', 'Pied de page de l’application')}>
      <div className={styles.footerInner}>
        {/* ── GAUCHE — Identité de l'entreprise ── */}
        <div className={styles.companySection}>
          {hasCompanyUrl ? (
            <a href={company.url} target="_blank" rel="noopener noreferrer" className={styles.companyName}>
              {company.name}
            </a>
          ) : (
            <span className={styles.companyName}>{company.name}</span>
          )}

          {company.tagline && (
            <>
              <span className={styles.dot} aria-hidden="true">
                ·
              </span>
              <span className={styles.tagline}>{company.tagline}</span>
            </>
          )}
        </div>

        {/* ── DROITE — Liens secondaires + copyright ── */}
        <div className={styles.metaSection}>
          {hasLinks && (
            <nav className={styles.linksNav} aria-label={t('footerLinks', 'Liens du pied de page')}>
              {links.map((link) =>
                isExternalLink(link.url) ? (
                  <FooterExternalLink key={`${link.title}-${link.url}`} link={link} />
                ) : (
                  <FooterInternalLink key={`${link.title}-${link.url}`} link={link} />
                ),
              )}
            </nav>
          )}

          <span className={styles.copyright}>
            {copyright.showYear ? t('footerCopyright', '© {{year}} {{company}}', {
              year: currentYear,
              company: company.name,
            }) : company.name}
            {copyright.text ? ` — ${copyright.text}` : ''}
          </span>
        </div>
      </div>
    </footer>
  );
};

// =============================================================================
//  FOOTER — Garde d'authentification (même règle que TopBar)
//
//  RESPONSABILITÉ :
//    • N'affiche rien tant que l'utilisateur n'est pas connecté.
//    • Aucune redirection ici : ce rôle appartient déjà à TopBar / aux guards
//      de tenant. Le footer reste un composant purement passif, jamais un
//      point de décision de navigation — défense en profondeur uniquement.
// =============================================================================
const Footer: React.FC = () => {
  const session = useSession();

  if (session?.authenticated && session?.user?.person) {
    return <FooterContent />;
  }

  return null;
};

export default Footer;
