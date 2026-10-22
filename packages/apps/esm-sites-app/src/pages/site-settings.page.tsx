import React from 'react';
import { playXboxSound, SiteSettingsPanel } from '@egen-civitas/esm-framework';
import { notify } from '../utils/notify';
import { useSiteOutlet } from './site-context';

/** `/sites/:siteId/parametres` — `key` : le formulaire repart des valeurs du site à chaque changement de site. */
const SiteSettingsPage: React.FC = () => {
  const { site } = useSiteOutlet();
  return (
    <SiteSettingsPanel
      key={site.uuid}
      siteName={site.name}
      siteUuid={site.uuid}
      storage={{ usedLabel: '42,4 Go', quotaLabel: '250 Go (17%)', percent: 17 }}
      initialValue={{
        title: site.name,
        description: site.description,
        visibility: 'MODERATED',
        allowMemberInvites: true,
        notifyOnUpload: true,
        notifyOnValidation: true,
      }}
      onSave={() => {
        playXboxSound('achievement');
        notify('Paramètres du site enregistrés', 'success');
      }}
    />
  );
};

export default SiteSettingsPage;
