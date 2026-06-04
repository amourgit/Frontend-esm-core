import { createGlobalStore } from '@egen/esm-framework';

export interface ImplementerToolsStore {
  activeItemDescription: null | ActiveItemDescription;
  configPathBeingEdited: null | Array<string>;
  isOpen: boolean;
  hasAlert: boolean;
  openTabIndex: number;
  isConfigToolbarOpen: boolean;
  isUIEditorEnabled: boolean;
  isJsonModeEnabled: boolean;
  uiSelectedPath: null | Array<string>;
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
  isOpen: getIsImplementerToolsOpen(),
  hasAlert: false,
  openTabIndex: 0,
  isConfigToolbarOpen: getIsConfigToolbarOpen(),
  isUIEditorEnabled: getIsUIEditorEnabled(),
  isJsonModeEnabled: getIsJsonModeEnabled(),
  uiSelectedPath: null,
});

export const setHasAlert = (value: boolean) =>
  implementerToolsStore.setState((state) => ({
    ...state,
    hasAlert: value,
  }));

export const togglePopup = () =>
  implementerToolsStore.setState((state) => ({
    ...state,
    isOpen: !state.isOpen,
    openTabIndex: 0,
  }));

export const showModuleDiagnostics = () =>
  implementerToolsStore.setState((state) => ({
    ...state,
    isOpen: true,
    openTabIndex: 2,
  }));

/* Set up localStorage-serialized state elements */

let lastValueOfIsOpen = getIsImplementerToolsOpen();
let lastValueOfConfigToolbarOpen = getIsConfigToolbarOpen();
let lastValueOfIsUiEditorEnabled = getIsUIEditorEnabled();
let lastValueOfIsJsonModeEnabled = getIsJsonModeEnabled();

implementerToolsStore.subscribe((state) => {
  if (state.isOpen != lastValueOfIsOpen) {
    setIsImplementerToolsOpen(state.isOpen);
    lastValueOfIsOpen = state.isOpen;
  }
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

function getIsImplementerToolsOpen(): boolean {
  return JSON.parse(localStorage.getItem('egen:egenImplementerToolsAreOpen') || 'false') ?? false;
}

function setIsImplementerToolsOpen(value: boolean): void {
  localStorage.setItem('egen:egenImplementerToolsAreOpen', JSON.stringify(value));
}

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
