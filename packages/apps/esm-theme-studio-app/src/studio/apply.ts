import { applyTweakcn, type TweakcnStyles } from '../core/tweakcn-adapter';
import type { ThemeRuntimePort } from '../core/runtime';
import type { ThemeDoc } from '../core/types';
import { GLOBAL_OVERRIDE_ID } from '../constants';

/**
 * Construit le JSON de thème EGEN à partir des styles édités dans l'éditeur (modèle TweakCN),
 * en le superposant au thème actif de l'environnement (rien n'est perdu de ce que TweakCN ne connaît pas).
 */
export const buildThemeDoc = (base: ThemeDoc | null, styles: TweakcnStyles): ThemeDoc =>
  applyTweakcn(base ?? {}, styles);

/** Applique le thème édité au projet via le moteur de thème (esm-theme aujourd'hui, TokiForge via `registerThemeRuntime`). */
export function applyToProject(runtime: ThemeRuntimePort, styles: TweakcnStyles, priority: number): ThemeDoc {
  const doc = buildThemeDoc(runtime.getActiveTheme(), styles);
  runtime.apply(doc, { priority, id: GLOBAL_OVERRIDE_ID });
  return doc;
}
