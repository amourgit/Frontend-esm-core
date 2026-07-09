import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnClickOutside } from '@egen/esm-framework';
import styles from './search-bar.scss';

// =============================================================================
//  SEARCH BAR — Barre de recherche animée de la topbar
//
//  Au repos : icône seule (32px). Au focus/clic : s'élargit vers un champ
//  texte. Escape ou clic extérieur sans valeur : referme.
// =============================================================================

const SearchIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="7.5" cy="7.5" r="5.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ClearIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SearchBar: React.FC = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const collapse = useCallback(() => {
    if (!value) setExpanded(false);
  }, [value]);

  const wrapperRef = useOnClickOutside<HTMLDivElement>(collapse, expanded);

  const expand = useCallback(() => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const clear = useCallback(() => {
    setValue('');
    setExpanded(false);
    inputRef.current?.blur();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setValue('');
      setExpanded(false);
      inputRef.current?.blur();
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${expanded || value ? styles.wrapperExpanded : ''}`}
      aria-label={t('searchBar', 'Barre de recherche')}
    >
      <button
        type="button"
        className={styles.iconBtn}
        onClick={expanded ? undefined : expand}
        onMouseEnter={!expanded ? expand : undefined}
        aria-label={t('openSearch', 'Ouvrir la recherche')}
        aria-expanded={expanded}
        tabIndex={expanded ? -1 : 0}
      >
        <SearchIcon />
      </button>

      <input
        ref={inputRef}
        className={styles.input}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={expand}
        onBlur={collapse}
        onKeyDown={handleKeyDown}
        placeholder={t('searchPlaceholder', 'Rechercher…')}
        aria-label={t('searchInput', 'Champ de recherche')}
        aria-hidden={!expanded}
        tabIndex={expanded ? 0 : -1}
      />

      {expanded && value && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={clear}
          aria-label={t('clearSearch', 'Effacer la recherche')}
        >
          <ClearIcon />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
