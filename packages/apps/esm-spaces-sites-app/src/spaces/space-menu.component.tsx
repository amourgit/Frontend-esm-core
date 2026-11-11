import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  MorphSelect,
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
} from '@egen-civitas/esm-framework';
import { setActiveSpace, useSpacesSites } from '../store/spaces-sites.store';
import { useSpacesFromConfig } from './use-spaces-config';

/** Props transmises par le panneau latéral à ses extensions. */
interface SpaceMenuProps {
  closeMenu?: () => void;
}

/**
 * Choix de l'Espace dans le panneau latéral (extension de `staggered-menu-slot`) : sur mobile, le sélecteur de la TopBar
 * est masqué et c'est ici qu'on change d'Espace. L'Espace actif est partagé avec la TopBar par le store.
 */
const SpaceMenu: React.FC<SpaceMenuProps> = ({ closeMenu }) => {
  const { t } = useTranslation();
  useSpacesFromConfig();
  const { spaces, spaceId } = useSpacesSites();

  if (spaces.length === 0 || !spaceId) return null;

  const handleChange = (id: string) => {
    if (id === spaceId) return;
    setActiveSpace(id);
    // Le panneau recouvre la page en mobile : on le referme pour montrer l'Espace activé.
    closeMenu?.();
  };

  return (
    <MorphSelect value={spaceId} onValueChange={handleChange} className="w-full">
      <MorphSelectTrigger>
        <MorphSelectValue placeholder={t('space', 'Space')} />
      </MorphSelectTrigger>
      <MorphSelectContent>
        {spaces.map((space) => (
          <MorphSelectItem key={space.id} value={space.id} label={space.name}>
            {space.name}
          </MorphSelectItem>
        ))}
      </MorphSelectContent>
    </MorphSelect>
  );
};

export default SpaceMenu;
