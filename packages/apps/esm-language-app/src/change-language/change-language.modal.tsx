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
  RadioGroup,
  RadioGroupItem,
  showSnackbar,
  useAbortController,
  useSession,
} from '@egen-civitas/esm-framework';
import { updateSessionLocale, updateUserProperties } from './change-language.resource';
import styles from './change-language.module.css';

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

  const handleSubmit = useCallback(async () => {
    if (!selectedLocale || selectedLocale === session?.locale) {
      return;
    }

    setIsChangingLanguage(true);
    const formattedLocale = selectedLocale.replace(/-/gi, '_');

    try {
      if (shouldChangeDefaultLocale) {
        await updateUserProperties(
          user?.uuid,
          {
            ...(user?.userProperties ?? {}),
            defaultLocale: formattedLocale,
          },
          ac,
        );
      } else {
        await updateSessionLocale(formattedLocale, ac);
      }
      // Succès : la ressource recharge la page pour que toutes les données reviennent dans la nouvelle langue.
    } catch (error) {
      if (ac.signal.aborted) {
        return;
      }
      // Échec : sans ceci le bouton restait indéfiniment en chargement et l'utilisateur n'avait aucun retour.
      setIsChangingLanguage(false);
      showSnackbar({
        kind: 'error',
        isLowContrast: false,
        title: t('changeLanguageError', 'Could not change the language'),
        subtitle: error instanceof Error && error.message ? error.message : t('tryAgain', 'Please try again'),
      });
    }
  }, [ac, selectedLocale, session?.locale, shouldChangeDefaultLocale, t, user?.userProperties, user?.uuid]);

  const languageNames = useMemo(
    () => Object.fromEntries(allowedLocales.map((locale) => [locale, capitalize(getDisplayName(locale))])),
    [allowedLocales],
  );

  return (
    <>
      <ModalHeader onClose={close} title={t('changeLanguage', 'Change language')} />
      <ModalBody>
        <div className={styles.languageOptionsContainer}>
          <RadioGroup
            value={selectedLocale}
            aria-label={t('languageOptions', 'Language options')}
            onValueChange={(locale) => setSelectedLocale(locale)}
            className="gap-3"
          >
            {allowedLocales.map((locale, i) => (
              <div key={`locale-option-${locale}-${i}`} className={`${styles.languageRadioButton} flex items-center gap-2`}>
                <RadioGroupItem id={`locale-option-${locale}-${i}`} value={locale} />
                <label htmlFor={`locale-option-${locale}-${i}`} className="cursor-pointer text-sm">
                  {languageNames[locale]}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </ModalBody>
      <div className={classNames(styles.updateDefaultLocaleContainer, 'flex flex-col gap-2')} role="region">
        <label htmlFor="change-default-locale" className="flex items-center gap-2 text-sm">
          <Checkbox
            id="change-default-locale"
            checked={shouldChangeDefaultLocale}
            onCheckedChange={(checked) => setShouldChangeDefaultLocale(checked === true)}
          />
          {t('changeDefaultLocale', 'Save as my default language')}
        </label>
        <p className={classNames(styles.updateDefaultLocaleExplainer)}>
          {t('changeDefaultLocaleExplanation', 'Leave this unchecked to change language for this session only')}
        </p>
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={close}>
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
