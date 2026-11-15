// EGEN: CharacterStudio n'initialise plus sa propre instance i18next (ce qui aurait écrasé celle du shell
// via initReactI18next). Ses traductions sont enregistrées comme un espace de noms dédié dans l'instance
// i18n partagée du Core ; la langue suit donc celle du shell.
import translations from './translations.json'

export const STUDIO_NS = 'character-factory'

export function registerStudioTranslations(i18n) {
  Object.entries(translations).forEach(([lng, resource]) => {
    // deep=true, overwrite=false : idempotent, ne remplace pas ce qui existe déjà
    i18n.addResourceBundle(lng, STUDIO_NS, resource.translation, true, false)
  })
}
