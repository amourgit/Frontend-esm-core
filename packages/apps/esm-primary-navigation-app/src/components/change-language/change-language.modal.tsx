import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'lodash-es';
import {
  Button,
  Checkbox,
  InlineLoading,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RadioButton,
  RadioButtonGroup,
} from '@carbon/react';
import { useAbortController, useSession } from '@egen-civitas/esm-framework';
import { updateSessionLocale, updateUserProperties } from './change-language.resource';
import styles from './change-language.scss';

interface ChangeLanguageModalProps {
  close(): void;
}

/**
 * Normalizes an Egen locale string to a valid BCP 47 language tag.
 * Egen stores locales with underscores (e.g. "en_GB", "fr_FR") but the
 * Web Intl API requires hyphens (e.g. "en-GB", "fr-FR"). Passing an underscore
 * form directly to `new Intl.DisplayNames(...)` throws a RangeError.
 */
function toBCP47(locale: string): string {
  return locale.replace(/_/g, '-');
}

/**
 * Safely resolves the display name for a locale using Intl.DisplayNames.
 * Falls back to the raw locale string if the tag is still unrecognized.
 */
function getDisplayName(locale: string): string {
  const tag = toBCP47(locale);
  try {
    return new Intl.DisplayNames([tag], { type: 'language' }).of(tag) ?? locale;
  } catch {
    return locale;
  }
}

export default function ChangeLanguageModal({ close }: ChangeLanguageModalProps) {
  const { t } = useTranslation();
  const session = useSession();
  const user = session?.user;
  const allowedLocales = session?.allowedLocales ?? [];
  const [selectedLocale, setSelectedLocale] = useState(session?.locale);
  const [shouldChangeDefaultLocale, setShouldChangeDefaultLocale] = useState(true);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const ac = useAbortController();

  const handleSubmit = useCallback(() => {
    setIsChangingLanguage(true);

    if (selectedLocale && selectedLocale !== session?.locale) {
      const formattedLocale = selectedLocale.replace(/-/gi, '_');
      if (shouldChangeDefaultLocale) {
        updateUserProperties(
          user.uuid,
          {
            ...(user.userProperties ?? {}),
            defaultLocale: formattedLocale,
          },
          ac,
        );
      } else {
        updateSessionLocale(formattedLocale, ac);
      }
    }
  }, [user.userProperties, user.uuid, selectedLocale, shouldChangeDefaultLocale]);

  const languageNames = useMemo(
    () =>
      Object.fromEntries(
        allowedLocales.map((locale) => [locale, capitalize(getDisplayName(locale))]),
      ),
    [allowedLocales],
  );

  return (
    <>
      <ModalHeader closeModal={close} title={t('changeLanguage', 'Change language')} />
      <ModalBody>
        <div className={styles.languageOptionsContainer}>
          <RadioButtonGroup
            valueSelected={selectedLocale}
            orientation="vertical"
            name="Language options"
            onChange={(locale) => setSelectedLocale(locale.toString())}
          >
            {allowedLocales.map((locale, i) => (
              <RadioButton
                className={styles.languageRadioButton}
                key={`locale-option-${locale}-${i}`}
                id={`locale-option-${locale}-${i}`}
                name={locale}
                labelText={languageNames[locale]}
                value={locale}
              />
            ))}
          </RadioButtonGroup>
        </div>
      </ModalBody>
      <div className={classNames('cds--layer-two', styles.updateDefaultLocaleContainer)} role="region">
        <Checkbox
          id={`change-default-locale`}
          labelText={t('changeDefaultLocale', 'Save as my default language')}
          checked={shouldChangeDefaultLocale}
          onChange={(_, { checked }) => setShouldChangeDefaultLocale(checked)}
        />
        <p className={classNames(styles.updateDefaultLocaleExplainer)}>
          {t('changeDefaultLocaleExplanation', 'Leave this unchecked to change language for this session only')}
        </p>
      </div>
      <ModalFooter>
        <Button kind="secondary" onClick={close}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button
          className={styles.submitButton}
          disabled={isChangingLanguage || selectedLocale === session?.locale}
          type="submit"
          onClick={handleSubmit}
        >
          {isChangingLanguage ? (
            <InlineLoading description={t('changingLanguage', 'Changing language') + '...'} />
          ) : (
            <span>{t('change', 'Change')}</span>
          )}
        </Button>
      </ModalFooter>
    </>
  );
}
