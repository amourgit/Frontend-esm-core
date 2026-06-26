import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@egen/esm-framework';
import { type ConfigSchema } from '../../config-schema';
import styles from './hero.scss';

// =============================================================================
//  HERO — Section d'accroche principale
//  Fond animé avec orbs gradient, badge accent, headline, sous-titre, CTA.
//  100 % CSS vars du thème — zéro valeur codée en dur dans les composants.
// =============================================================================

const Hero: React.FC = () => {
  const { t } = useTranslation();
  const { productName, tagline, demoUrl, loginUrl } = useConfig<ConfigSchema>();
  const orbRef = useRef<HTMLDivElement>(null);

  // Parallaxe légère sur les orbs au mouvement de la souris
  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    let rafId: number;
    const onMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 30;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        orb.style.transform = `translate(${x}px, ${y}px)`;
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-heading">
      {/* ── Fond animé ── */}
      <div className={styles.bgLayer} aria-hidden="true">
        <div className={styles.orbsWrapper} ref={orbRef}>
          <div className={`${styles.orb} ${styles.orbPrimary}`} />
          <div className={`${styles.orb} ${styles.orbSecondary}`} />
          <div className={`${styles.orb} ${styles.orbAccent}`} />
        </div>
        <div className={styles.gridOverlay} />
        <div className={styles.noiseOverlay} />
      </div>

      {/* ── Contenu ── */}
      <div className={styles.content}>
        {/* Badge supérieur */}
        <div className={styles.badge} aria-label={t('newBadge', 'Nouveau')}>
          <span className={styles.badgeDot} />
          {t('heroSuperBadge', 'Plateforme nationale éducative · Gabon 2026')}
        </div>

        {/* Headline */}
        <h1 id="hero-heading" className={styles.headline}>
          <span className={styles.headlineHighlight}>{productName}</span>
          <br />
          <span className={styles.headlineSub}>
            {t('heroHeadline', "Transformez l'éducation gabonaise avec le numérique")}
          </span>
        </h1>

        {/* Tagline */}
        <p className={styles.tagline}>{tagline}</p>

        {/* Description */}
        <p className={styles.description}>
          {t(
            'heroDescription',
            'Une plateforme SaaS modulaire et sécurisée conçue pour connecter établissements, enseignants, apprenants et administrations au sein d\'un écosystème unifié.',
          )}
        </p>

        {/* CTA buttons */}
        <div className={styles.ctaRow}>
          <a href={demoUrl} className={styles.ctaPrimary}>
            <span>{t('requestDemo', 'Demander une démo')}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a href={loginUrl} className={styles.ctaSecondary}>
            {t('signIn', 'Se connecter')}
          </a>
        </div>

        {/* Badges de confiance */}
        <div className={styles.trustRow} aria-label={t('trustBadges', 'Garanties')}>
          {[
            t('trustSecurity', '🔒 Sécurité ISO 27001'),
            t('trustAvailability', '⚡ 99,9 % disponibilité'),
            t('trustSupport', '💬 Support 24/7'),
          ].map((badge) => (
            <span key={badge} className={styles.trustBadge}>
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* ── Illustration UI mockup ── */}
      <div className={styles.mockupWrapper} aria-hidden="true">
        <div className={styles.mockupFrame}>
          <div className={styles.mockupBar}>
            <span className={styles.mockupDot} style={{ background: '#ef4444' }} />
            <span className={styles.mockupDot} style={{ background: '#f59e0b' }} />
            <span className={styles.mockupDot} style={{ background: '#22c55e' }} />
            <span className={styles.mockupUrl}>eigen.gabon.gov.ga</span>
          </div>
          <div className={styles.mockupContent}>
            {/* Sidebar simulée */}
            <div className={styles.mockupSidebar}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`${styles.mockupSidebarItem} ${i === 0 ? styles.mockupSidebarItemActive : ''}`} />
              ))}
            </div>
            {/* Contenu principal simulé */}
            <div className={styles.mockupMain}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupHeaderTitle} />
                <div className={styles.mockupHeaderBadge} />
              </div>
              <div className={styles.mockupCards}>
                {[
                  { w: '100%', h: '56px', accent: true },
                  { w: '48%', h: '80px', accent: false },
                  { w: '48%', h: '80px', accent: false },
                  { w: '100%', h: '40px', accent: false },
                  { w: '100%', h: '40px', accent: false },
                ].map(({ w, h, accent }, i) => (
                  <div
                    key={i}
                    className={`${styles.mockupCard} ${accent ? styles.mockupCardAccent : ''}`}
                    style={{ width: w, height: h }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Floating badges */}
        <div className={`${styles.floatingBadge} ${styles.floatingBadge1}`}>
          <span className={styles.floatingIcon}>📊</span>
          <div>
            <div className={styles.floatingLabel}>{t('floatingUsers', 'Apprenants actifs')}</div>
            <div className={styles.floatingValue}>+12 480</div>
          </div>
        </div>
        <div className={`${styles.floatingBadge} ${styles.floatingBadge2}`}>
          <span className={styles.floatingIcon}>🏫</span>
          <div>
            <div className={styles.floatingLabel}>{t('floatingSchools', 'Établissements')}</div>
            <div className={styles.floatingValue}>340+</div>
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div className={styles.scrollIndicator} aria-hidden="true">
        <div className={styles.scrollMouse}>
          <div className={styles.scrollWheel} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
