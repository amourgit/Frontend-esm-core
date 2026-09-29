import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { showModal, useSession } from '@egen-civitas/esm-framework';
import { TopBarOptionButton } from './TopBarOptionButton';

// Bascule de langue — service réel : ouvre `change-language-modal`
// (voir change-language-link.extension.tsx). Affiche le drapeau de la locale.

const FLAG_BY_LOCALE: Record<string, string> = {
  am: '🇪🇹', ar: '🇸🇦', ar_SY: '🇸🇾', bn: '🇧🇩', cs: '🇨🇿', de: '🇩🇪', en: '🇬🇧', en_US: '🇺🇸',
  es: '🇪🇸', es_MX: '🇲🇽', fr: '🇫🇷', he: '🇮🇱', hi: '🇮🇳', hi_IN: '🇮🇳', id: '🇮🇩', it: '🇮🇹',
  ka: '🇬🇪', km: '🇰🇭', ku: '🇮🇶', lg: '🇺🇬', ne: '🇳🇵', pl: '🇵🇱', pt: '🇵🇹', pt_BR: '🇧🇷',
  qu: '🇵🇪', ro_RO: '🇷🇴', ru_RU: '🇷🇺', si: '🇱🇰', sq: '🇦🇱', sw: '🇰🇪', sw_KE: '🇰🇪', tr: '🇹🇷',
  tr_TR: '🇹🇷', uk: '🇺🇦', uz: '🇺🇿', uz_UZ: '🇺🇿', vi: '🇻🇳', zh: '🇨🇳', zh_CN: '🇨🇳', zh_TW: '🇹🇼',
};

const LanguageOption: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();
  const session = useSession();
  const locale = session?.locale ?? 'en';
  const flag = useMemo(() => FLAG_BY_LOCALE[locale] ?? '🌐', [locale]);

  const launchChangeLanguageModal = useCallback(() => {
    const dispose = showModal('change-language-modal', {
      closeModal: () => dispose(),
      size: 'sm',
    });
  }, []);

  return (
    <div className={`relative overflow-visible items-center ${className || 'flex'}`}>
      <TopBarOptionButton
        label={t('changeLanguage', 'Changer de langue')}
        onClick={launchChangeLanguageModal}
        icon={
          <span className="text-[1.05rem] leading-none" aria-hidden="true">
            {flag}
          </span>
        }
      />
    </div>
  );
};

export default LanguageOption;
