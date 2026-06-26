import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { interpolateUrl, useConfig } from '@egen/esm-framework';
import { type ConfigSchema } from '../../config-schema';
import styles from './navbar.scss';

// =============================================================================
//  NAVBAR — Barre de navigation publique de la page d'accueil
//  Glass sticky header, menu hamburger mobile, ancres de section.
//  Aucune variable codée en dur : 100 % CSS vars du thème.
// =============================================================================

const NAV_LINKS = [
  { label: 'features', href: '#features' },
  { label: 'useCases', href: '#use-cases' },
  { label: 'pricing', href: '#pricing' },
  { label: 'testimonials', href: '#testimonials' },
] as const;

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { productName, logo, loginUrl, demoUrl } = useConfig<ConfigSchema>();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Détecte le scroll pour amplifier l'effet glass
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Ferme le menu au clic extérieur
  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (href.startsWith('#')) {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setMenuOpen(false);
      }
    },
    [],
  );

  const resolvedLoginUrl = interpolateUrl(loginUrl);

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`} role="banner">
      <div className={styles.inner}>
        {/* ── Logo ── */}
        <a href="#hero" className={styles.logoLink} onClick={(e) => handleAnchorClick(e, '#hero')} aria-label={t('home', 'Accueil')}>
          {logo.src ? (
            <img src={logo.src} alt={logo.alt} className={styles.logoImg} />
          ) : (
            <span className={styles.logoText}>{productName}</span>
          )}
        </a>

        {/* ── Nav links desktop ── */}
        <nav className={styles.navLinks} aria-label={t('mainNav', 'Navigation principale')}>
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className={styles.navLink}
              onClick={(e) => handleAnchorClick(e, href)}
            >
              {t(label, label)}
            </a>
          ))}
        </nav>

        {/* ── CTA desktop ── */}
        <div className={styles.ctaGroup}>
          <a href={resolvedLoginUrl} className={styles.btnGhost}>
            {t('signIn', 'Se connecter')}
          </a>
          <a href={demoUrl} className={styles.btnPrimary}>
            {t('requestDemo', 'Demander une démo')}
          </a>
        </div>

        {/* ── Hamburger mobile ── */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          aria-label={t('toggleMenu', 'Ouvrir / fermer le menu')}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* ── Menu mobile ── */}
      {menuOpen && (
        <div className={styles.mobileMenu} ref={menuRef} role="dialog" aria-label={t('mobileNav', 'Menu mobile')}>
          <nav className={styles.mobileLinks}>
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className={styles.mobileLink}
                onClick={(e) => handleAnchorClick(e, href)}
              >
                {t(label, label)}
              </a>
            ))}
          </nav>
          <div className={styles.mobileCta}>
            <a href={resolvedLoginUrl} className={styles.btnGhostMobile}>
              {t('signIn', 'Se connecter')}
            </a>
            <a href={demoUrl} className={styles.btnPrimaryMobile}>
              {t('requestDemo', 'Demander une démo')}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
