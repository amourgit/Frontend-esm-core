import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('@egen-civitas/esm-framework', async () => (await import('../test-utils/framework-mock')).frameworkMock());

import { getGlobalStore } from '@egen-civitas/esm-framework';
import {
  ANNOUNCEMENT_EXTENSION,
  ANNOUNCEMENT_LEVEL_ID,
  TOPBAR_TRANSIENT_STORE,
  formatAnnouncement,
  openAnnouncementLevel,
} from './announcement';
import WelcomeBanner from './welcome-banner.component';
import { WelcomeAnnouncement } from './welcome-announcement.component';

const levels = () => (getGlobalStore(TOPBAR_TRANSIENT_STORE, { levels: [] }) as any).getState().levels as any[];
const reset = () => (getGlobalStore(TOPBAR_TRANSIENT_STORE, { levels: [] }) as any).setState({ levels: [] });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-05T10:00:00Z'));
  reset();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('formatAnnouncement', () => {
  it('remplace {name} et {role}', () => {
    expect(formatAnnouncement('Bienvenue à {name}, {role} !', { name: 'Awa', role: 'Juriste' })).toBe('Bienvenue à Awa, Juriste !');
  });
  it('retire proprement le poste quand il est vide', () => {
    expect(formatAnnouncement('Bienvenue à {name}, {role} !', { name: 'Awa', role: '' })).toBe('Bienvenue à Awa !');
  });
});

describe('openAnnouncementLevel', () => {
  it('ajoute un niveau éphémère rouge, avec une durée de vie de 10 s', () => {
    const id = openAnnouncementLevel({ text: 'Salut', ttl: 10_000, background: '#dc2626', textColor: '#fff' });
    expect(id).toBe(ANNOUNCEMENT_LEVEL_ID);
    expect(levels()).toHaveLength(1);
    expect(levels()[0]).toMatchObject({
      extension: ANNOUNCEMENT_EXTENSION,
      background: '#dc2626',
      closing: false,
      expiresAt: Date.now() + 10_000,
      props: { text: 'Salut', textColor: '#fff' },
    });
  });

  it('rouvrir met à jour le même niveau sans en empiler un second', () => {
    openAnnouncementLevel({ text: 'A', ttl: 10_000 });
    openAnnouncementLevel({ text: 'B', ttl: 10_000 });
    expect(levels()).toHaveLength(1);
    expect(levels()[0].props.text).toBe('B');
  });

  it("s'empile après un niveau existant (n'écrase pas les niveaux des autres apps)", () => {
    openAnnouncementLevel({ text: 'Autre', id: 'autre-app', ttl: 5_000 });
    openAnnouncementLevel({ text: 'Annuaire', ttl: 10_000 });
    expect(levels().map((l) => l.id)).toEqual(['autre-app', ANNOUNCEMENT_LEVEL_ID]);
  });

  it('accepte une date de fin précise ; la plus proche de ttl et expiresAt gagne ; passée → rien', () => {
    openAnnouncementLevel({ text: 'x', ttl: 60_000, expiresAt: '2026-11-05T10:00:30Z' });
    expect(levels()[0].expiresAt).toBe(Date.parse('2026-11-05T10:00:30Z'));
    reset();
    expect(openAnnouncementLevel({ text: 'x', expiresAt: '2026-11-05T09:00:00Z' })).toBeNull();
    expect(levels()).toHaveLength(0);
  });
});

describe('<WelcomeBanner />', () => {
  it('affiche le texte, en blanc par défaut', () => {
    render(<WelcomeBanner text="Bienvenue !" />);
    expect(screen.getByTestId('annuaire-welcome-banner')).toHaveTextContent('Bienvenue !');
    expect(screen.getByTestId('annuaire-welcome-banner')).toHaveStyle({ color: '#ffffff' });
  });
  it('ne rend rien sans texte', () => {
    const { container } = render(<WelcomeBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('<WelcomeAnnouncement /> (déclencheur)', () => {
  it("ouvre à l'arrivée un niveau rouge de 10 s annonçant le dernier collaborateur de l'annuaire", () => {
    render(<WelcomeAnnouncement />);
    expect(levels()).toHaveLength(1);
    const [level] = levels();
    expect(level.background).toBe('#dc2626');
    expect(level.expiresAt - level.openedAt).toBe(10_000);
    expect(level.props.text).toMatch(/nouveau collaborateur rejoint l’entreprise/);
  });
});
