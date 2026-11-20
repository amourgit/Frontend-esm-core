import React, { Fragment, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@egen-civitas/esm-framework';
import { useTranslation } from 'react-i18next';
import type { ResolvedDependenciesModule } from './egen-backend-dependencies';
import styles from './backend-dependencies.styles.module.css';

export interface BackendDependencies {
  backendDependencies: Array<ResolvedDependenciesModule>;
}

export const BackendDependencies: React.FC<BackendDependencies> = ({ backendDependencies }) => {
  const { t } = useTranslation();

  const headers = useMemo(
    () => [
      {
        key: 'name',
        header: t('moduleName', 'Module Name'),
      },
      {
        key: 'installedVersion',
        header: t('installedVersion', 'Installed version'),
      },
      {
        key: 'requiredVersion',
        header: t('requiredVersion', 'Required version'),
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
                {backendDependencies.map((esm) => (
                  <Fragment key={esm.name}>
                    <TableRow>
                      <TableCell>
                        <span className={styles.moduleHeader}>{esm.name}</span>
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {esm.dependencies.map((dep) => (
                      <TableRow key={dep.name}>
                        <TableCell>{dep.name}</TableCell>
                        <TableCell>
                          {dep.type === 'missing' ? (
                            <span style={{ color: 'red' }}>{t('missing', 'Missing')}</span>
                          ) : dep.type === 'version-mismatch' ? (
                            <span style={{ color: 'red' }}>{dep.installedVersion}</span>
                          ) : (
                            <span>{dep.installedVersion}</span>
                          )}
                        </TableCell>
                        <TableCell>{dep.requiredVersion}</TableCell>
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
