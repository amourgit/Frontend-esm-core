import React, { Fragment, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useStore } from '@egen-civitas/esm-framework';
import { featureFlagsStore, setFeatureFlag } from '@egen-civitas/esm-framework/src/internal';
import styles from './feature-flags.module.css';

export function FeatureFlags() {
  const { flags } = useStore(featureFlagsStore);
  const { t } = useTranslation();

  const headers = useMemo(
    () => [
      {
        key: 'label',
        header: t('featureFlag', 'Feature Flag'),
      },
      {
        key: 'description',
        header: t('description', 'Description'),
      },
      {
        key: 'enabled',
        header: t('enabled', 'Enabled'),
      },
    ],
    [t],
  );

  const rows = useMemo(() => {
    return Object.entries(flags)
      .sort(([ka, va], [kb, vb]) => {
        return (va.label ?? ka).localeCompare(vb.label || kb);
      })
      .map(([name, { enabled, label, description }]) => ({
        name,
        enabled,
        label,
        description,
      }));
  }, [flags]);

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
                {rows.map((flag) => (
                  <Fragment key={flag.name}>
                    <TableRow>
                      <TableCell>
                        <div id={`flag-label-${flag.name}`} className={styles.header}>
                          {flag.label}
                        </div>
                        <div className={styles.helper}>{flag.name}</div>
                      </TableCell>
                      <TableCell>
                        <span>{flag.description}</span>
                      </TableCell>
                      <TableCell>
                        <Switch
                          id={`feature-flag-${flag.name}-toggle`}
                          aria-labelledby={`flag-label-${flag.name}`}
                          checked={flag.enabled}
                          onCheckedChange={() => setFeatureFlag(flag.name, !flag.enabled)}
                        />
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
    </div>
  );
}
