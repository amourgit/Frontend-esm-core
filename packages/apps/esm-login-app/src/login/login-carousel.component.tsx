import React, { useEffect, useState, useCallback, useRef } from 'react';
import styles from './login-carousel.module.scss';

export interface CarouselSlide {
  headline: string;
  body: string;
  accent?: string;
}

interface LoginCarouselProps {
  slides: CarouselSlide[];
  intervalMs?: number;
}

const LoginCarousel: React.FC<LoginCarouselProps> = ({ slides, intervalMs = 5000 }) => {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const goTo = useCallback(
    (index: number) => {
      if (animating || index === active) return;
      setAnimating(true);
      setTimeout(() => {
        setActive(index);
        setAnimating(false);
      }, 400);
    },
    [active, animating],
  );

  const next = useCallback(() => {
    goTo((active + 1) % slides.length);
  }, [active, goTo, slides.length]);

  useEffect(() => {
    timerRef.current = setTimeout(next, intervalMs);
    return () => clearTimeout(timerRef.current);
  }, [next, intervalMs]);

  if (!slides.length) return null;

  const slide = slides[active];

  return (
    <div className={styles.carousel} aria-live="polite">
      {/* Contenu textuel */}
      <div className={`${styles.slide} ${animating ? styles.exit : styles.enter}`}>
        {slide.accent && <span className={styles.accent}>{slide.accent}</span>}
        <h2 className={styles.headline}>{slide.headline}</h2>
        <p className={styles.body}>{slide.body}</p>
      </div>

      {/* Indicateurs (dots) */}
      <div className={styles.dots} role="tablist">
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            aria-label={`Slide ${i + 1}`}
            className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default LoginCarousel;
