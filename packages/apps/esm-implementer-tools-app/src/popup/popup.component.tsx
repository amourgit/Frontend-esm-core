import React, { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@egen-civitas/esm-framework';
import { useTranslation } from 'react-i18next';
import { Configuration } from '../configuration/configuration.component';
import { FrontendModules } from '../frontend-modules/frontend-modules.component';
import { BackendDependencies } from '../backend-dependencies/backend-dependencies.component';
import { FeatureFlags } from '../feature-flags/feature-flags.component';
import type { FrontendModule } from '../types';
import type { ResolvedDependenciesModule } from '../backend-dependencies/egen-backend-dependencies';
import styles from './popup.styles.module.css';

interface DevToolsPopupProps {
  frontendModules: Array<FrontendModule>;
  backendDependencies: Array<ResolvedDependenciesModule>;
  visibleTabIndex?: number;
}

interface SwitcherItem {
  index: number;
  name: string;
  text: string;
}

export default function Popup({
  frontendModules,
  backendDependencies,
  visibleTabIndex = 0,
}: DevToolsPopupProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(visibleTabIndex ? visibleTabIndex : 0);
  const tabContent = useMemo(() => {
    if (activeTab == 0) {
      return <Configuration />;
    } else if (activeTab === 1) {
      return <FrontendModules frontendModules={frontendModules} />;
    } else if (activeTab === 2) {
      return <BackendDependencies backendDependencies={backendDependencies} />;
    } else {
      return <FeatureFlags />;
    }
  }, [activeTab, backendDependencies, frontendModules]);

  return (
    <div className={styles.popup}>
      <div className={styles.topBar}>
        <div className={styles.tabs}>
          <Tabs value={String(activeTab)} onValueChange={(value) => setActiveTab(Number(value))}>
            <TabsList className={styles.contentSwitcher}>
            <TabsTrigger value="0" className="darkThemeSwitch">{t('configuration', 'Configuration')}</TabsTrigger>
            <TabsTrigger value="1" className="darkThemeSwitch">{t('frontendModules', 'Frontend modules')}</TabsTrigger>
            <TabsTrigger value="2" className="darkThemeSwitch">{t('backendModules', 'Backend modules')}</TabsTrigger>
            <TabsTrigger value="3" className="darkThemeSwitch">{t('featureFlags', 'Feature flags')}</TabsTrigger>
          </TabsList>
          </Tabs>
        </div>
      </div>
      <div className={styles.content}>{tabContent}</div>
    </div>
  );
}
