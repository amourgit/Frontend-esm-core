import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Newspaper, BellRing, CalendarDays } from 'lucide-react';
import { playXboxSound, useConfig } from '@egen-civitas/esm-framework';
import type { ConfigSchema } from '../config-schema';
import { TabsContent } from '../components/ui/animated-tabs.component';
import { TabbedViewLayout } from '../components/layout/tabbed-view-layout.component';
import { AudienceSwitch } from '../audience/audience-switch.component';
import { type AudienceFilter, isAudienceFilter, matchesAudience } from '../audience/audience';
import { AnnouncementsView } from '../announcements/announcements-view.component';
import { ALL_ANNOUNCEMENTS } from '../announcements/announcements-data';
import { EventsSection } from '../events/events-section.component';
import { ALL_EVENTS } from '../data/events-mock-data';
import { NewsFeedView, ALL_NEWS_ARTICLES } from '../news/news-feed-view.component';

type InformationsTab = 'news' | 'annonces' | 'agenda';

interface InformationsPageProps {
  initialTab?: InformationsTab;
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const BASE_PATH = '/informations';

function getTabFromPath(pathname: string): InformationsTab {
  const path = pathname.toLowerCase();
  if (path.startsWith(`${BASE_PATH}/annonces`)) return 'annonces';
  if (path.startsWith(`${BASE_PATH}/agenda`)) return 'agenda';
  return 'news';
}

/**
 * Page « Informations » : News & Publications, Annonces & Flash Info et Agenda,
 * pour les trois audiences (interne, extranet, public). Un onglet = une sous-route.
 */
export function InformationsPage({ initialTab = 'news', onShowNotification }: InformationsPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { defaultAudience } = useConfig<ConfigSchema>();

  const [activeTab, setActiveTab] = useState<InformationsTab>(
    location.pathname === BASE_PATH || location.pathname === `${BASE_PATH}/`
      ? initialTab
      : getTabFromPath(location.pathname),
  );
  const [audience, setAudience] = useState<AudienceFilter>(isAudienceFilter(defaultAudience) ? defaultAudience : 'all');

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const tabs = useMemo(
    () => [
      {
        id: 'news' as const,
        label: t('tabNews', 'News & Publications'),
        path: `${BASE_PATH}/news`,
        icon: <Newspaper className="w-4 h-4" />,
      },
      {
        id: 'annonces' as const,
        label: t('tabAnnouncements', 'Announcements & Flash News'),
        path: `${BASE_PATH}/annonces`,
        icon: <BellRing className="w-4 h-4" />,
      },
      {
        id: 'agenda' as const,
        label: t('tabAgenda', 'Agenda & Calendar'),
        path: `${BASE_PATH}/agenda`,
        icon: <CalendarDays className="w-4 h-4" />,
      },
    ],
    [t],
  );

  const counts = useMemo(() => {
    const all = [...ALL_NEWS_ARTICLES, ...ALL_ANNOUNCEMENTS, ...ALL_EVENTS];
    const count = (a: AudienceFilter) => all.filter((item) => matchesAudience(item, a)).length;
    return { all: count('all'), interne: count('interne'), extranet: count('extranet'), public: count('public') };
  }, []);

  const handleTabChange = (tab: InformationsTab, path: string) => {
    playXboxSound('select');
    setActiveTab(tab);
    navigate(path);
  };

  return (
    <TabbedViewLayout
      activeTab={activeTab}
      onTabChange={(value, option) => handleTabChange(value, option?.path ?? `${BASE_PATH}/${value}`)}
      tabs={tabs}
      mainHeader={<AudienceSwitch value={audience} onChange={setAudience} counts={counts} className="pb-4" />}
    >
      <TabsContent value="news" className="flex-1 min-h-0 flex flex-col">
        <NewsFeedView onShowNotification={onShowNotification} audience={audience} />
      </TabsContent>

      <TabsContent value="annonces" className="flex-1 min-h-0 flex flex-col">
        <AnnouncementsView audience={audience} />
      </TabsContent>

      <TabsContent value="agenda" className="flex-1 min-h-0 flex flex-col">
        <EventsSection onShowNotification={onShowNotification} audience={audience} />
      </TabsContent>
    </TabbedViewLayout>
  );
}
