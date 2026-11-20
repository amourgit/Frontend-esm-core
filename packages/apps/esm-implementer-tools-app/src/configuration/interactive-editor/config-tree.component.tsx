import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@egen-civitas/esm-framework';
import { ConfigTreeForModule } from './config-tree-for-module.component';
import { implementerToolsStore } from '../../store';
import { useStore } from 'zustand';
import styles from './config-tree.styles.module.css';

export interface ConfigTreeProps {
  config: Record<string, any>;
}

export function ConfigTree({ config }: ConfigTreeProps) {
  const { uiSelectedPath } = useStore(implementerToolsStore);
  const focusedModule = uiSelectedPath?.[0];

  return (
    <Accordion type="multiple" defaultValue={focusedModule ? [focusedModule] : []} key={focusedModule ?? 'none'}>
      {config &&
        Object.keys(config)
          .sort()
          .map((moduleName) => {
            const moduleConfig = config[moduleName];
            return Object.keys(moduleConfig).length ? (
              <AccordionItem value={moduleName} className={styles.fullWidthAccordion} key={`accordion-${moduleName}`}>
                <AccordionTrigger>
                  <h6>{moduleName}</h6>
                </AccordionTrigger>
                <AccordionContent forceMount className="data-[state=closed]:hidden">
                  <ConfigTreeForModule config={moduleConfig} moduleName={moduleName} key={`${moduleName}-config`} />
                </AccordionContent>
              </AccordionItem>
            ) : null;
          })}
    </Accordion>
  );
}
