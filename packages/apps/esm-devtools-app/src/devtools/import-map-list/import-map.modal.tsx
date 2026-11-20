import React, { type FormEvent, useCallback, useState } from 'react';
import { Button, ModalBody, ModalFooter, ModalHeader, TextInput } from '@egen-civitas/esm-framework';
import { useTranslation } from 'react-i18next';
import {
  addImportMapOverride,
  addRouteMapOverride,
  enableImportMapOverride,
  getImportMapNextPageMap,
  isImportMapOverrideDisabled,
  removeImportMapOverride,
  removeRouteMapOverride,
} from '@egen-civitas/esm-framework/src/internal';
import type { Module } from './types';

type ImportMapModalProps = ({ module: Module; isNew: false } | { module: never; isNew: true }) & { close: () => void };

const isPortRegex = /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;

async function getUrlFromPort(moduleName: string, port: string) {
  const latestImportMap = await getImportMapNextPageMap();
  const moduleUrl = latestImportMap.imports[moduleName];

  if (!moduleUrl) {
    const fileName = moduleName.replace(/@/g, '').replace(/\//g, '-');
    return `${window.location.protocol}//localhost:${port}/${fileName}.js`;
  }

  if (moduleUrl.endsWith('/')) {
    return `${window.location.protocol}//localhost:${port}${moduleUrl}`;
  }

  return `${window.location.protocol}//localhost:${port}/${moduleUrl.substring(moduleUrl.lastIndexOf('/') + 1)}`;
}

const ImportMapModal: React.FC<ImportMapModalProps> = ({ module, isNew, close }) => {
  const { t } = useTranslation();
  const [moduleName, setModuleName] = useState<string | undefined>(module?.moduleName);
  const [overrideUrl, setOverrideUrl] = useState('');

  const handleSubmit = useCallback(
    async (evt: FormEvent<HTMLElement>) => {
      evt.preventDefault();

      if (!moduleName) {
        return;
      }

      if (isImportMapOverrideDisabled(moduleName)) {
        enableImportMapOverride(moduleName);
      }

      if (isNew) {
        let newUrl = overrideUrl || null;
        if (newUrl) {
          if (isPortRegex.test(newUrl)) {
            newUrl = await getUrlFromPort(moduleName, newUrl);
          }

          addImportMapOverride(moduleName, newUrl);
          const baseUrl = newUrl.substring(0, newUrl.lastIndexOf('/'));
          addRouteMapOverride(moduleName, new URL('routes.json', baseUrl));
        }
      } else {
        let newUrl = overrideUrl || null;
        if (newUrl === null) {
          removeImportMapOverride(moduleName);
          removeRouteMapOverride(moduleName);
        } else {
          if (isPortRegex.test(newUrl)) {
            newUrl = await getUrlFromPort(moduleName, newUrl);
          }

          addImportMapOverride(moduleName, newUrl);
          const baseUrl = newUrl.substring(0, newUrl.lastIndexOf('/'));
          addRouteMapOverride(moduleName, new URL('routes.json', baseUrl));
        }
      }

      close();
    },
    [moduleName, isNew, close],
  );

  return (
    <>
      <ModalHeader
        onClose={close}
        title={
          isNew
            ? t('addModule', 'Add Module')
            : t('editModule', 'Edit Module {{- moduleName}}', {
                moduleName: moduleName,
              })
        }
      />
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <div className="flex flex-col gap-4">
            {isNew && (
              <TextInput
                id="module-name"
                autoFocus
                onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                  evt.preventDefault();
                  setModuleName(evt.target.value);
                }}
                label={t('moduleName', 'Module Name')}
              />
            )}
            {!isNew && (
              <TextInput
                id="default-url"
                label={t('defaultUrl', 'Default URL')}
                value={module.defaultUrl}
                readOnly
              />
            )}
            <TextInput
              id="override-url"
              autoFocus={!isNew}
              value={overrideUrl}
              onChange={(evt: React.ChangeEvent<HTMLInputElement>) => setOverrideUrl(evt.target.value)}
              label={t('overrideUrl', 'Override URL')}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={close}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button type="submit">{t('apply', 'Apply')}</Button>
        </ModalFooter>
      </form>
    </>
  );
};

export default ImportMapModal;
