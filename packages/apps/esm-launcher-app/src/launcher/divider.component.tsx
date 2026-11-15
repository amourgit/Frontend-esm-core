import React from 'react';

interface TopBarState {
  searchOpen?: boolean;
  isDesktop?: boolean;
}

/** Séparateur vertical entre les options de la TopBar. Masqué sur mobile et quand la recherche prend la place (tactile). */
const Divider: React.FC<TopBarState> = ({ searchOpen, isDesktop }) => {
  if (searchOpen && isDesktop === false) return null;
  return <div aria-hidden="true" className="h-4 w-px bg-white/20 mx-0.5 hidden sm:block" />;
};

export default Divider;
