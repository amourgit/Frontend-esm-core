import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  BackgroundsShowcase,
  ContentShowcase,
  FormsShowcase,
  IconsShowcase,
  NotificationsShowcase,
  SitesShowcase,
} from './framework-components-showcase.component';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

// Le framework complet n'est pas chargeable sous vitest (esm-offline → workbox-window, WebGL…).
// Chaque composant est remplacé par une balise `data-stub` ; les API impératives par des espions.
// Les noms ci-dessous sont les imports réels de la vitrine : un export oublié ferait échouer le test.
const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  showNotification: vi.fn(),
  showActionableNotification: vi.fn(),
  showSnackbar: vi.fn(),
}));

vi.mock('@egen-civitas/esm-framework', () => {
  const stub = (name: string) => {
    const Stub = ({ children }: { children?: React.ReactNode }) => <div data-stub={name}>{children}</div>;
    Stub.displayName = name;
    return Stub;
  };
  const components = {
    AnimatedHomeBackground: stub('AnimatedHomeBackground'),
    AsyncSelect: stub('AsyncSelect'),
    CalendarIcon: stub('CalendarIcon'),
    CardHeader: stub('CardHeader'),
    ClassificationTags: stub('ClassificationTags'),
    ContentSection: stub('ContentSection'),
    CustomOverflowMenu: stub('CustomOverflowMenu'),
    CustomOverflowMenuItem: stub('CustomOverflowMenuItem'),
    DefaultPageBackground: stub('DefaultPageBackground'),
    DocumentToolbar: stub('DocumentToolbar'),
    DocumentIcon: stub('DocumentIcon'),
    EgenDatePicker: stub('EgenDatePicker'),
    EgenDateRangePicker: stub('EgenDateRangePicker'),
    EmptyCard: stub('EmptyCard'),
    EmptyCardIllustration: stub('EmptyCardIllustration'),
    ErrorCard: stub('ErrorCard'),
    ErrorState: stub('ErrorState'),
    FilterBarDemo: stub('FilterBarDemo'),
    GradientBlur: stub('GradientBlur'),
    GradientWave: stub('GradientWave'),
    HeroMosaic: stub('HeroMosaic'),
    HomePictogram: stub('HomePictogram'),
    Icon: stub('Icon'),
    NumericDataPoint: stub('NumericDataPoint'),
    PageHeader: stub('PageHeader'),
    PageHeaderContent: stub('PageHeaderContent'),
    Pagination: stub('Pagination'),
    Pictogram: stub('Pictogram'),
    ResponsiveWrapper: stub('ResponsiveWrapper'),
    SearchIcon: stub('SearchIcon'),
    SiteActivityPanel: stub('SiteActivityPanel'),
    SiteApplicationsPanel: stub('SiteApplicationsPanel'),
    SiteBanner: stub('SiteBanner'),
    SiteCarousel: stub('SiteCarousel'),
    SiteMembersPanel: stub('SiteMembersPanel'),
    SitePanelHeader: stub('SitePanelHeader'),
    SiteResourcesPanel: stub('SiteResourcesPanel'),
    SiteSearchBar: stub('SiteSearchBar'),
    SiteSettingsPanel: stub('SiteSettingsPanel'),
    SiteTabbedLayout: stub('SiteTabbedLayout'),
    SiteTasksPanel: stub('SiteTasksPanel'),
    TopBarAvatar: stub('TopBarAvatar'),
    TopBarDivider: stub('TopBarDivider'),
    TopBarIconButton: stub('TopBarIconButton'),
    UserIcon: stub('UserIcon'),
  };
  return {
    ...components,
    iconIds: ['egen-icon-calendar', 'egen-icon-search', 'egen-icon-user'],
    pictogramIds: ['egen-pict-home', 'egen-pict-laboratory'],
    showActionableNotification: mocks.showActionableNotification,
    showNotification: mocks.showNotification,
    showSnackbar: mocks.showSnackbar,
    showToast: mocks.showToast,
  };
});

describe('Composants du styleguide ajoutés à la vitrine', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche les icônes et pictogrammes du registre, filtrables', () => {
    render(<IconsShowcase />);
    expect(screen.getAllByText('calendar').length).toBeGreaterThan(0);
    expect(screen.getByText('laboratory')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'search' } });
    expect(screen.queryByText('calendar')).not.toBeInTheDocument();
    expect(screen.getByText('search')).toBeInTheDocument();
    expect(screen.queryByText('laboratory')).not.toBeInTheDocument();
  });

  it.each([
    ['cartes et états', <ContentShowcase key="c" />, 'CardHeader · EmptyCard · ErrorState', 'HeroMosaic'],
    ['formulaires et filtres', <FormsShowcase key="f" />, 'EgenDatePicker · EgenDateRangePicker', 'AsyncSelect'],
    ['fonds de page', <BackgroundsShowcase key="b" />, 'Fonds de page', 'GradientBlur'],
    ['sites', <SitesShowcase key="s" />, 'SiteTabbedLayout + panneaux de site', 'SiteTabbedLayout'],
  ])('monte la section %s', (_label, ui, title, text) => {
    render(ui);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(text)).length).toBeGreaterThan(0);
  });

  it("déclenche les API impératives d'alertes", () => {
    render(<NotificationsShowcase />);
    // Un bouton « success » par API, dans l'ordre : showNotification, showActionableNotification, showSnackbar.
    const [notification, actionable, snackbar] = screen.getAllByRole('button', { name: 'success' });
    fireEvent.click(notification);
    expect(mocks.showNotification).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
    fireEvent.click(actionable);
    expect(mocks.showActionableNotification).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
    fireEvent.click(snackbar);
    expect(mocks.showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
  });
});
