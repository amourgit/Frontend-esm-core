import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@egen-civitas/esm-framework';
import { ChangeLanguageCardModal } from '../change-language/change-language-card-modal.component';
import { FLAG_BY_LOCALE } from './locale-flags';
import { OptionButton } from './option-button.component';

// =============================================================================
//  BOUTON DE LANGUE — extension de la TopBar
//
//  Affiche le drapeau de la locale de la session et ouvre `change-language-modal` (voir change-language/). La TopBar lui
//  passe un `state` (reçu ici comme props) : recherche ouverte, type d'écran. Sur écran tactile, la place revient à la
//  recherche quand elle s'ouvre.
// =============================================================================

interface TopBarState {
  searchOpen?: boolean;
  isDesktop?: boolean;
  isMobile?: boolean;
}

const LanguageSwitcher: React.FC<TopBarState> = ({ searchOpen, isDesktop, isMobile }) => {
  const { t } = useTranslation();
  const session = useSession();
  const locale = session?.locale ?? 'en';
  const flag = useMemo(() => FLAG_BY_LOCALE[locale] ?? '', [locale]);
  const [modalOpen, setModalOpen] = useState(false);

  if (isMobile) return null;
  if (searchOpen && isDesktop === false) return null;

  return (
    <div className="relative flex items-center overflow-visible">
      <OptionButton
        label={t('changeLanguage', 'Changer de langue')}
        onClick={() => setModalOpen(true)}
        icon={
          <span className="text-[1.05rem] leading-none" aria-hidden="true">
            {flag}
          </span>
        }
      />
      <ChangeLanguageCardModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default LanguageSwitcher;
