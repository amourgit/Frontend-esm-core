import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'lodash-es';
import { Button, TranslateIcon, useSession } from '@egen-civitas/esm-framework';
import { ChangeLanguageCardModal } from './change-language-card-modal.component';
import styles from './change-language-link.module.css';

/**
 * Normalizes an Egen locale string to a valid BCP 47 language tag.
 * Egen stores locales with underscores (e.g. "en_GB", "fr_FR") but the
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
  const [modalOpen, setModalOpen] = useState(false);

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
    <li
      role="none"
      className={`${styles.panelItemContainer} flex items-center justify-between gap-2 px-4 py-1 text-sm`}
      aria-label={t('changeLanguage', 'Change language')}
    >
      <div>
        <TranslateIcon size={20} />
        <p>{displayName}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setModalOpen(true)}>
        {t('change', 'Change')}
      </Button>
      <ChangeLanguageCardModal open={modalOpen} onOpenChange={setModalOpen} />
    </li>
  );
}

export default ChangeLanguageLink;
