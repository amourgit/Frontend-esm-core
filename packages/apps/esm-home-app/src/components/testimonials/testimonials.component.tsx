import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type TestimonialItem } from '../../types';
import styles from './testimonials.scss';

// =============================================================================
//  TESTIMONIALS — Carrousel de témoignages
// =============================================================================

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't1',
    quote: 'testimonialT1Quote',
    author: 'Dr. Alphonse Mba',
    role: 'testimonialT1Role',
    organization: 'testimonialT1Org',
  },
  {
    id: 't2',
    quote: 'testimonialT2Quote',
    author: 'Marie-Claire Nzoghe',
    role: 'testimonialT2Role',
    organization: 'testimonialT2Org',
  },
  {
    id: 't3',
    quote: 'testimonialT3Quote',
    author: 'Jean-Baptiste Ondo',
    role: 'testimonialT3Role',
    organization: 'testimonialT3Org',
  },
  {
    id: 't4',
    quote: 'testimonialT4Quote',
    author: 'Prudence Essono',
    role: 'testimonialT4Role',
    organization: 'testimonialT4Org',
  },
];

const Stars: React.FC = () => (
  <div className={styles.stars} aria-label="5 étoiles sur 5">
    {[...Array(5)].map((_, i) => (
      <span key={i} className={styles.star} aria-hidden="true">★</span>
    ))}
  </div>
);

const Testimonials: React.FC = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const goTo = useCallback(
    (index: number) => {
      if (animating || index === active) return;
      setAnimating(true);
      clearTimeout(timerRef.current);
      setTimeout(() => {
        setActive(index);
        setAnimating(false);
      }, 320);
    },
    [active, animating],
  );

  const next = useCallback(() => {
    goTo((active + 1) % TESTIMONIALS.length);
  }, [active, goTo]);

  const prev = useCallback(() => {
    goTo((active - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, [active, goTo]);

  useEffect(() => {
    timerRef.current = setTimeout(next, 6000);
    return () => clearTimeout(timerRef.current);
  }, [next]);

  const current = TESTIMONIALS[active];

  return (
    <section id="testimonials" className={styles.section} aria-labelledby="testimonials-heading">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>{t('testimonialsSectionLabel', 'Témoignages')}</span>
          <h2 id="testimonials-heading" className={styles.sectionTitle}>
            {t('testimonialsSectionTitle', 'Ce que disent nos partenaires')}
          </h2>
        </div>

        {/* Carrousel */}
        <div className={styles.carousel} aria-live="polite">
          <button
            className={`${styles.arrowBtn} ${styles.arrowBtnPrev}`}
            onClick={prev}
            aria-label={t('prev', 'Précédent')}
          >
            ‹
          </button>

          <div className={`${styles.card} ${animating ? styles.cardExit : styles.cardEnter}`}>
            <Stars />
            <blockquote className={styles.quote}>
              "{t(current.quote, current.quote)}"
            </blockquote>
            <div className={styles.author}>
              <div className={styles.authorAvatar} aria-hidden="true">
                {current.author.charAt(0)}
              </div>
              <div className={styles.authorInfo}>
                <div className={styles.authorName}>{current.author}</div>
                <div className={styles.authorRole}>
                  {t(current.role, current.role)} · {t(current.organization, current.organization)}
                </div>
              </div>
            </div>
          </div>

          <button
            className={`${styles.arrowBtn} ${styles.arrowBtnNext}`}
            onClick={next}
            aria-label={t('next', 'Suivant')}
          >
            ›
          </button>
        </div>

        {/* Dots */}
        <div className={styles.dots} role="tablist" aria-label={t('testimonialsDots', 'Aller au témoignage')}>
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Témoignage ${i + 1}`}
              className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
