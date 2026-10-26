import React from 'react';
import { cx } from './card-utils';

export interface CardTitleButtonProps {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * Titre de carte = vrai `<button>` dont un pseudo-élément couvre TOUTE la carte
 * (patron « stretched link »). La carte entière est cliquable à la souris, le
 * clavier et les lecteurs d'écran voient un seul bouton nommé par le titre, et
 * la carte peut contenir d'autres liens/boutons sans imbrication interactive
 * invalide. La carte parente doit être `relative`.
 */
export function CardTitleButton({ onClick, className, children }: CardTitleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'block w-full cursor-pointer border-0 bg-transparent p-0 outline-none [color:inherit] [font:inherit] [text-align:inherit]',
        "after:absolute after:inset-0 after:content-['']",
        className,
      )}
    >
      {children}
    </button>
  );
}
