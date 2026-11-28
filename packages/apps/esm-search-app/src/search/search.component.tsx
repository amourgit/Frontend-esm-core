import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { interpolateUrl, navigate, useConfig } from '@egen-civitas/esm-framework';
import { type ConfigSchema } from '../config-schema';
import { GooeyInput } from './gooey-input.component';

/**
 * État de la TopBar reçu en props (extension du slot `topbar-slot`). Chaque prop est facultative :
 * sans TopBar, le champ garde son propre état d'ouverture et la recherche fonctionne quand même.
 */
export interface SearchProps {
  searchOpen?: boolean;
  setSearchOpen?: (open: boolean) => void;
  closePanels?: () => void;
  isMobile?: boolean;
  isDesktop?: boolean;
}

/** Destination d'une requête : `<search.path>?q=<requête encodée>`. */
export function buildSearchUrl(path: string, query: string): string {
  return `${interpolateUrl(path)}?q=${encodeURIComponent(query)}`;
}

const Search: React.FC<SearchProps> = ({ searchOpen, setSearchOpen, closePanels, isMobile, isDesktop = true }) => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const [query, setQuery] = useState('');
  const [localOpen, setLocalOpen] = useState(false);

  const controlled = typeof searchOpen === 'boolean';
  const open = controlled ? searchOpen : localOpen;
  const setOpen = (value: boolean) => (setSearchOpen ? setSearchOpen(value) : setLocalOpen(value));
  const takeRoom = open && Boolean(isMobile);

  return (
    <div
      className={`relative overflow-visible flex items-center gap-2 ${takeRoom ? 'w-full justify-between' : 'justify-start'}`}
    >
      <GooeyInput
        placeholder={t('search', 'Rechercher...')}
        collapsedWidth={115}
        expandedWidth={220}
        expandedOffset={40}
        value={query}
        onValueChange={setQuery}
        expanded={open}
        onOpenChange={setOpen}
        onClick={() => closePanels?.()}
        onSubmit={(value) => {
          const q = value.trim();
          if (!q) return;
          navigate({ to: buildSearchUrl(config.search.path, q) });
        }}
      />
      {open && !isDesktop && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setOpen(false);
          }}
          className="text-xs text-(--primary) hover:text-(--foreground) font-semibold px-3.5 py-1.5 rounded-full backdrop-blur-md bg-(--foreground)/8 hover:bg-(--foreground)/16 border border-(--border) hover:border-(--primary)/40 shadow-(--shadow-sm) transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
          title={t('cancelSearch', 'Annuler la recherche')}
        >
          {t('cancel', 'Annuler')}
        </button>
      )}
    </div>
  );
};

export default Search;
