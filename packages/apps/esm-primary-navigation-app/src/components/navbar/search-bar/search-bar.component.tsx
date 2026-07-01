import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './search-bar.scss';

// =============================================================================
//  SEARCH BAR — Barre de recherche animée
//
//  Au repos : icône seule (24px).
//  Au clic / focus : s'élargit avec animation fluide vers un champ de texte.
//  Escape ou blur (sans valeur) : referme avec animation.
// =============================================================================

const SearchIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="7.5" cy="7.5" r="5.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ClearIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SearchBar: React.FC = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const expand = useCallback(() => {
    setExpanded(true);
    // Focus après l'animation CSS (150ms)
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const collapse = useCallback(() => {
    if (!value) {
      setExpanded(false);
    }
  }, [value]);

  const clear = useCallback(() => {
    setValue('');
    setExpanded(false);
    inputRef.current?.blur();
  }, []);

  // Escape ferme et vide
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setValue('');
      setExpanded(false);
      inputRef.current?.blur();
    }
  }, []);

  // Clic extérieur sans valeur → fermer
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        collapse();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded, collapse]);

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${expanded ? styles.wrapperExpanded : ''}`}
      aria-label={t('searchBar', 'Barre de recherche')}
    >
      {/* Icône / bouton d'ouverture */}
      <button
        className={styles.iconBtn}
        onClick={expanded ? undefined : expand}
        onMouseEnter={!expanded ? expand : undefined}
        aria-label={t('openSearch', 'Ouvrir la recherche')}
        aria-expanded={expanded}
        tabIndex={expanded ? -1 : 0}
      >
        <SearchIcon />
      </button>

      {/* Champ de saisie (visible seulement si expanded) */}
      <input
        ref={inputRef}
        className={styles.input}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={collapse}
        onKeyDown={handleKeyDown}
        placeholder={t('searchPlaceholder', 'Rechercher…')}
        aria-label={t('searchInput', 'Champ de recherche')}
        aria-hidden={!expanded}
        tabIndex={expanded ? 0 : -1}
      />

      {/* Bouton clear (visible si valeur présente) */}
      {expanded && value && (
        <button
          className={styles.clearBtn}
          onClick={clear}
          aria-label={t('clearSearch', 'Effacer la recherche')}
          tabIndex={0}
        >
          <ClearIcon />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
