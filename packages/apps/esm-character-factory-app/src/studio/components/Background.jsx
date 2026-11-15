import React from "react"

import styles from "./Background.module.css"
import { SceneContext } from "../context/SceneContext"
export default function Background() {
  const {
    debugMode,
  } = React.useContext(SceneContext)
  // EGEN: le fond est fourni par le système d'arrière-plan du shell (voir src/shell-background.tsx).
  // Le fond noir plein écran d'origine masquait celui du shell ; on ne le garde qu'en mode debug.
  if (!debugMode) return null
  return (
    <div className={debugMode ? styles["darkBackground"] : styles["backgroundImg"]}>
      <div className={styles["backgroundBlur"]}></div>
      <div className={styles["Background"]}>
      </div>
    </div>
  )
}
