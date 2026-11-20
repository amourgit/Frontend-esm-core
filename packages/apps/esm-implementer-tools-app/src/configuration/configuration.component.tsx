import React, { useMemo, useState } from 'react';
import { Button, IconButton, Switch, TextInput } from '@egen-civitas/esm-framework';
import { useTranslation } from 'react-i18next';
import { cloneDeep, isEmpty } from 'lodash-es';
import type { Config } from '@egen-civitas/esm-framework/src/internal';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
  TrashCanIcon,
  clearConfigErrors,
  getExtensionInternalStore,
  implementerToolsConfigStore,
  temporaryConfigStore,
  useStore,
  useStoreWithActions,
} from '@egen-civitas/esm-framework/src/internal';
import { ConfigTree } from './interactive-editor/config-tree.component';
import { Description } from './interactive-editor/description.component';
import { implementerToolsStore, type ImplementerToolsStore } from '../store';
import styles from './configuration.styles.module.css';

const JsonEditor = React.lazy(() => import('./json-editor/json-editor.component'));

function isLeaf(configNode: Config) {
  return (
    configNode.hasOwnProperty('_default') ||
    configNode['_type'] ||
    configNode.hasOwnProperty('_value') ||
    configNode.hasOwnProperty('_source')
  );
}

const actions = {
  toggleIsUIEditorEnabled({ isUIEditorEnabled }: ImplementerToolsStore) {
    return { isUIEditorEnabled: !isUIEditorEnabled };
  },
  toggleIsToolbarOpen({ isConfigToolbarOpen }: ImplementerToolsStore) {
    return { isConfigToolbarOpen: !isConfigToolbarOpen };
  },
  toggleIsJsonModeEnabled({ isJsonModeEnabled }: ImplementerToolsStore) {
    return { isJsonModeEnabled: !isJsonModeEnabled };
  },
};

interface OpenOrCloseButtonProps {
  isConfigToolbarOpen: boolean;
  toggleIsToolbarOpen(): void;
}

const OpenOrCloseButton: React.FC<OpenOrCloseButtonProps> = ({ isConfigToolbarOpen, toggleIsToolbarOpen }) => (
  <IconButton icon={isConfigToolbarOpen ? <ChevronUpIcon /> : <ChevronDownIcon />} label={`${isConfigToolbarOpen ? 'Hide' : 'Show'} toolbar`} tooltipSide="left" onClick={toggleIsToolbarOpen} variant="ghost" size="icon-sm" />
);

export const Configuration: React.FC = () => {
  const { t } = useTranslation();
  const {
    isUIEditorEnabled,
    toggleIsUIEditorEnabled,
    isJsonModeEnabled,
    toggleIsJsonModeEnabled,
    isConfigToolbarOpen,
    toggleIsToolbarOpen,
  } = useStoreWithActions(implementerToolsStore, actions);
  const { config } = useStore(implementerToolsConfigStore);
  const extensionStore = useStore(getExtensionInternalStore());
  const tempConfigStore = useStore(temporaryConfigStore);
  const [filterText, setFilterText] = useState('');
  const tempConfig = tempConfigStore.config;
  const tempConfigObjUrl = new Blob([JSON.stringify(tempConfig, undefined, 2)], {
    type: 'application/json',
  });

  const combinedConfig = useMemo(() => {
    const result = cloneDeep(config);
    for (let slot of Object.values(extensionStore.slots)) {
      if (slot.moduleName) {
        // Un slot peut appartenir à un module sans schéma de configuration (ex. slots de la TopBar, des rails) :
        // on crée la branche au lieu de lire `undefined.extensionSlots` (ce qui faisait planter toute la zone).
        const moduleConfig = (result[slot.moduleName] ??= {});
        const slots = (moduleConfig.extensionSlots ??= {});
        slots[slot.name] ??= {};
      }
    }
    return result;
  }, [config, extensionStore]);

  const filteredConfig = useMemo(() => {
    function getRelatedBranches(inputTree: Config, filterText: string) {
      const result = {};
      for (let k of Object.keys(inputTree)) {
        if (k.includes(filterText)) {
          result[k] = cloneDeep(inputTree[k]);
        } else {
          if (!isLeaf(inputTree[k])) {
            const kSubtreeResult = getRelatedBranches(inputTree[k], filterText);
            if (!isEmpty(kSubtreeResult)) {
              result[k] = kSubtreeResult;
            }
          }
        }
      }
      return result;
    }
    return filterText ? getRelatedBranches(combinedConfig, filterText) : combinedConfig;
  }, [filterText, combinedConfig]);

  // La zone basse est redimensionnable par le shell : le contenu remplit l'espace restant (plus de hauteur en vh).
  const mainContentHeight = '100%';
  return (
    <div className={styles.root}>
      <div className={styles.tools}>
        <div className={styles.toggleToolbarButton}>
          <OpenOrCloseButton isConfigToolbarOpen={isConfigToolbarOpen} toggleIsToolbarOpen={toggleIsToolbarOpen} />
        </div>
        {isConfigToolbarOpen ? (
          <div style={{ padding: '0.5em 1.5em' }}>
            <div className={`${styles.row} flex flex-wrap items-center gap-4`}>
              <div className="min-w-48 flex-1">
                <TextInput
                  id="extensionSearch"
                  label={t('searchConfiguration', 'Search configuration')}
                  onChange={(e) => setFilterText(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className={`${styles.toggleButtons} flex items-center gap-4`}>
                <label className={`${styles.toggle} flex items-center gap-2 text-sm`} htmlFor="jsonModeSwitch">
                  <Switch id="jsonModeSwitch" checked={isJsonModeEnabled} onCheckedChange={toggleIsJsonModeEnabled} />
                  {t('jsonEditor', 'JSON editor')}
                </label>
                <label className={`${styles.toggle} flex items-center gap-2 text-sm`} htmlFor="uiEditorSwitch">
                  <Switch id="uiEditorSwitch" checked={isUIEditorEnabled} onCheckedChange={toggleIsUIEditorEnabled} />
                  {t('uiEditor', 'UI editor')}
                </label>
              </div>
              <div className={`${styles.actionButtons} flex items-center gap-4`}>
                <Button variant="destructive" onClick={() => { clearConfigErrors(); temporaryConfigStore.setState({ config: {} }); }}>
<TrashCanIcon size={16} />
                  {t('clearConfig', 'Clear local config')}
                </Button>
                <Button variant="secondary" onClick={(event: React.MouseEvent<HTMLButtonElement>) => { if ((event.target as HTMLAnchorElement).id != 'downloadConfigBtn') document.getElementById('downloadConfigBtn')?.click(); }}>
<DownloadIcon size={16} />
                  <a
                    id="downloadConfigBtn"
                    className={styles.downloadLink}
                    download="temporary_config.json"
                    href={window.URL.createObjectURL(tempConfigObjUrl)}
                  >
                    {t('downloadConfig', 'Download config')}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <div className={styles.mainContent}>
        {isJsonModeEnabled ? (
          <JsonEditor height={mainContentHeight} />
        ) : (
          <>
            <div className={styles.configTreePane}>
              <ConfigTree config={filteredConfig} />
            </div>
            <div className={styles.descriptionPane}>
              <Description />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
