import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { showModal, TopBarIconButton, useSession } from '@egen-civitas/esm-framework';

// =============================================================================
//  LANGUAGE BUTTON — Bascule rapide de langue (icône drapeau)
//
//  Réutilise le service RÉEL déjà branché ailleurs dans l'app
//  (`change-language-modal`, voir change-language-link.extension.tsx) :
//  aucune nouvelle logique métier, juste un point d'accès direct depuis
//  la topbar plutôt que de devoir ouvrir le menu utilisateur.
// =============================================================================

/** Emoji drapeau approximatif par locale EGEN (couvre les langues de /translations). */
const FLAG_BY_LOCALE: Record<string, string> = {
  am: '🇪🇹',
  ar: '🇸🇦',
  ar_SY: '🇸🇾',
  bn: '🇧🇩',
  cs: '🇨🇿',
  de: '🇩🇪',
  en: '🇬🇧',
  en_US: '🇺🇸',
  es: '🇪🇸',
  es_MX: '🇲🇽',
  fr: '🇫🇷',
  he: '🇮🇱',
  hi: '🇮🇳',
  hi_IN: '🇮🇳',
  id: '🇮🇩',
  it: '🇮🇹',
  ka: '🇬🇪',
  km: '🇰🇭',
  ku: '🇮🇶',
  lg: '🇺🇬',
  ne: '🇳🇵',
  pl: '🇵🇱',
  pt: '🇵🇹',
  pt_BR: '🇧🇷',
  qu: '🇵🇪',
  ro_RO: '🇷🇴',
  ru_RU: '🇷🇺',
  si: '🇱🇰',
  sq: '🇦🇱',
  sw: '🇰🇪',
  sw_KE: '🇰🇪',
  tr: '🇹🇷',
  tr_TR: '🇹🇷',
  uk: '🇺🇦',
  uz: '🇺🇿',
  uz_UZ: '🇺🇿',
  vi: '🇻🇳',
  zh: '🇨🇳',
  zh_CN: '🇨🇳',
  zh_TW: '🇹🇼',
};

const LanguageButton: React.FC = () => {
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
    <TopBarIconButton
      label={t('changeLanguage', 'Changer de langue')}
      onClick={launchChangeLanguageModal}
      icon={
        <span className="text-[1.05rem] leading-none" aria-hidden="true">
          {flag}
        </span>
      }
    />
  );
};

export default LanguageButton;
