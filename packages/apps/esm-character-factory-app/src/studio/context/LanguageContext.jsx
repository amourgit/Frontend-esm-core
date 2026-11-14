import React, { createContext } from "react"
import { useTranslation } from "react-i18next"
import { STUDIO_NS } from "../lib/localization/i18n"

export const LanguageContext = createContext()

export const LanguageProvider = (props) => {
  const { t } = useTranslation(STUDIO_NS)

  return (
    <LanguageContext.Provider
      value={{
        t,
      }}
    >
      {props.children}
    </LanguageContext.Provider>
  )
}
