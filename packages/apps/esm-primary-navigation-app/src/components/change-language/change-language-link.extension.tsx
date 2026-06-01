import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, SwitcherItem } from '@carbon/react';
import { capitalize } from 'lodash-es';
import { TranslateIcon, showModal, useSession } from '@openmrs/esm-framework';
import styles from './change-language-link.scss';

/**
 * Normalizes an OpenMRS locale string to a valid BCP 47 language tag.
 * OpenMRS stores locales with underscores (e.g. "en_GB", "fr_FR") but the
 * Web Intl API requires hyphens (e.g. "en-GB", "fr-FR"). Passing an underscore
 * form directly to `new Intl.DisplayNames(...)` throws a RangeError.
 */
function toBCP47(locale: string): string {
  return locale.replace(/_/g, '-');
}

/** The user menu item that shows the current language and has a button to change the language */
function ChangeLanguageLink() {
  const { t } = useTranslation();
  const session = useSession();

  const launchChangeLanguageModal = useCallback(() => {
    const dispose = showModal('change-language-modal', {
      closeModal: () => dispose(),
      size: 'sm',
    });
  }, []);

  const rawLocale = session?.locale;
  const bcp47Locale = rawLocale ? toBCP47(rawLocale) : 'en';

  let displayName: string;
  try {
    displayName = capitalize(new Intl.DisplayNames([bcp47Locale], { type: 'language' }).of(bcp47Locale) ?? bcp47Locale);
  } catch {
    // Fallback: show the raw locale string if Intl still rejects it
    displayName = rawLocale ?? 'en';
  }

  return (
    <SwitcherItem className={styles.panelItemContainer} aria-label={t('changeLanguage', 'Change language')}>
      <div>
        <TranslateIcon size={20} />
        <p>{displayName}</p>
      </div>
      <Button kind="ghost" onClick={launchChangeLanguageModal}>
        {t('change', 'Change')}
      </Button>
    </SwitcherItem>
  );
}

export default ChangeLanguageLink;
