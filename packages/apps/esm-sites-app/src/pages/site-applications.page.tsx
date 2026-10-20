import React from 'react';
import { useNavigate } from 'react-router-dom';
import { playXboxSound, SiteApplicationsPanel } from '@egen-civitas/esm-framework';
import { SITE_APPLICATIONS } from '../data/sites-data';

/** `/sites/:siteId/applications` */
const SiteApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <SiteApplicationsPanel
      applications={SITE_APPLICATIONS}
      onOpen={(app) => {
        playXboxSound('select');
        navigate(`/${app.link}`);
      }}
    />
  );
};

export default SiteApplicationsPage;
