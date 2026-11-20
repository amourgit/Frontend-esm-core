import React, { Fragment, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@egen-civitas/esm-framework';
import { useTranslation } from 'react-i18next';
import type { FrontendModule } from '../types';
import styles from './frontend-modules.module.css';

export interface FrontendModulesProps {
  frontendModules: Array<FrontendModule>;
}

export const FrontendModules: React.FC<FrontendModulesProps> = ({ frontendModules }) => {
  const { t } = useTranslation();

  const headers = useMemo(
    () => [
      {
        key: 'name',
        header: t('moduleName', 'Module Name'),
      },
      {
        key: 'installedVersion',
        header: t('installedVersion', 'Installed Version'),
      },
    ],
    [t],
  );

  return (
    <div className={styles.container}>
                <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header.key}>{header.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {frontendModules.map((esm) => (
                  <Fragment key={esm.name}>
                    <TableRow>
                      <TableCell>
                        <span className={styles.moduleHeader}>{esm.name}</span>
                      </TableCell>
                      <TableCell>{esm.version ?? t('unknownVersion', 'unknown')}</TableCell>
                    </TableRow>
                    {Boolean(esm.extensions) ? (
                      <TableRow key={`${esm.name}-extensions-header`}>
                        <TableCell>
                          <span className={styles.moduleComponentHeader}>{t('extensions', 'Extensions')}</span>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    ) : null}
                    {(esm.extensions ?? []).map((extension, i) => (
                      <TableRow key={`${esm.name}-page-${i}`}>
                        <TableCell>{extension.name}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
    </div>
  );
};
