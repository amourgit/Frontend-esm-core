import { createGlobalStore, openToolWindow } from '@egen-civitas/esm-framework';

export interface ImplementerToolsStore {
  activeItemDescription: null | ActiveItemDescription;
  configPathBeingEdited: null | Array<string>;
  hasAlert: boolean;
  openTabIndex: number;
  isConfigToolbarOpen: boolean;
  isUIEditorEnabled: boolean;
  isJsonModeEnabled: boolean;
  uiSelectedPath: null | Array<string>;
  isOpen: boolean;
}

export interface ActiveItemDescription {
  path: Array<string>;
  description?: string;
  value?: string | Array<string>;
  source?: string;
}

export const implementerToolsStore = createGlobalStore<ImplementerToolsStore>('implementer-tools', {
  activeItemDescription: null,
  configPathBeingEdited: null,
  hasAlert: false,
  openTabIndex: 0,
  isConfigToolbarOpen: getIsConfigToolbarOpen(),
  isUIEditorEnabled: getIsUIEditorEnabled(),
  isJsonModeEnabled: getIsJsonModeEnabled(),
  uiSelectedPath: null,
  isOpen: false,
});

export const setHasAlert = (value: boolean) =>
  implementerToolsStore.setState((state) => ({
    ...state,
    hasAlert: value,
  }));

/** Nom de la fenêtre d'outils (routes.json) : sert à l'ouvrir par le code dans la zone basse. */
export const IMPLEMENTER_TOOLS_WINDOW = 'implementer-tools';

export const showModuleDiagnostics = () => {
  implementerToolsStore.setState((state) => ({ ...state, openTabIndex: 2 }));
  openToolWindow('bottom', IMPLEMENTER_TOOLS_WINDOW);
};

/* Set up localStorage-serialized state elements */

let lastValueOfConfigToolbarOpen = getIsConfigToolbarOpen();
let lastValueOfIsUiEditorEnabled = getIsUIEditorEnabled();
let lastValueOfIsJsonModeEnabled = getIsJsonModeEnabled();

implementerToolsStore.subscribe((state) => {
  if (state.isUIEditorEnabled != lastValueOfIsUiEditorEnabled) {
    setIsUIEditorEnabled(state.isUIEditorEnabled);
    lastValueOfIsUiEditorEnabled = state.isUIEditorEnabled;
  }
  if (state.isConfigToolbarOpen != lastValueOfConfigToolbarOpen) {
    setIsConfigToolbarOpen(state.isConfigToolbarOpen);
    lastValueOfConfigToolbarOpen = state.isConfigToolbarOpen;
  }
  if (state.isJsonModeEnabled != lastValueOfIsJsonModeEnabled) {
    setIsJsonModeEnabled(state.isJsonModeEnabled);
    lastValueOfIsJsonModeEnabled = state.isJsonModeEnabled;
  }
});

function getIsConfigToolbarOpen(): boolean {
  return JSON.parse(localStorage.getItem('egen:egenImplementerToolsConfigOpen') || 'true') ?? true;
}

function setIsConfigToolbarOpen(value: boolean): void {
  localStorage.setItem('egen:egenImplementerToolsConfigOpen', JSON.stringify(value));
}

function getIsUIEditorEnabled(): boolean {
  return JSON.parse(localStorage.getItem('egen:isUIEditorEnabled') || 'false') ?? false;
}

function setIsUIEditorEnabled(enabled: boolean) {
  localStorage.setItem('egen:isUIEditorEnabled', JSON.stringify(enabled));
}

function getIsJsonModeEnabled(): boolean {
  return JSON.parse(localStorage.getItem('egen:getIsJsonModeEnabled') || 'false') ?? false;
}

function setIsJsonModeEnabled(enabled: boolean) {
  localStorage.setItem('egen:getIsJsonModeEnabled', JSON.stringify(enabled));
}
