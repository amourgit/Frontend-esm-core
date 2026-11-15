import { describe, expect, it, vi } from 'vitest';
import { buildBreadcrumbModel } from './buildBreadcrumbModel';
import { type NavItem } from '../components/shell/DropdownNavigation';

const Icon = () => null;
const click = vi.fn();
const entry = (label: string, route: string) => ({ label, icon: Icon, route, onClick: () => click(route) });
const items: NavItem[] = [
  { id: 0, label: 'Accueil', route: 'home' },
  {
    id: 1, label: 'Informations', sectionKey: 'informations', subMenus: [
      { title: 'News', items: [entry('À la Une', 'informations/news')] },
      { title: 'Agenda', items: [entry('Agenda', 'informations/agenda')] },
    ],
  },
  { id: 2, label: 'Annuaire', sectionKey: 'annuaire', route: 'annuaire', onClick: () => click('annuaire'), subMenus: [
    { title: '', items: [entry('Contacts', 'annuaire/contacts'), entry('Organigramme', 'annuaire/organigramme')] },
  ] },
  { id: 3, label: 'Recherche', sectionKey: 'recherche', route: 'recherche', onClick: () => click('recherche') },
];
const goHome = vi.fn();

describe('buildBreadcrumbModel', () => {
  it('section : les alternatives sont les autres sections (hors accueil), la courante est cochée', () => {
    const m = buildBreadcrumbModel(items, '/annuaire/contacts', { goHome });
    expect(m.section?.label).toBe('Annuaire');
    expect(m.section?.options.map((o) => o.label)).toEqual(['Informations', 'Annuaire', 'Recherche']);
    expect(m.section?.options.filter((o) => o.current).map((o) => o.label)).toEqual(['Annuaire']);
  });
  it('entrée : les alternatives sont les entrées de la MÊME section', () => {
    const m = buildBreadcrumbModel(items, '/annuaire/contacts', { goHome });
    expect(m.entry?.label).toBe('Contacts');
    expect(m.entry?.options.map((o) => o.label)).toEqual(['Contacts', 'Organigramme']);
    expect(m.entry?.options.find((o) => o.current)?.label).toBe('Contacts');
  });
  it('une section sans route propre pointe vers sa première entrée', () => {
    click.mockClear();
    const m = buildBreadcrumbModel(items, '/annuaire/contacts', { goHome });
    m.section?.options[0].onSelect?.();
    expect(click).toHaveBeenCalledWith('informations/news');
  });
  it('à la racine d\'une section : pas d\'entrée, mais un maillon « Sélectionner… » qui liste ses entrées', () => {
    const m = buildBreadcrumbModel(items, '/annuaire', { goHome });
    expect(m.entry).toBeUndefined();
    expect(m.atSectionRoot).toBe(true);
    expect(m.next?.options.map((o) => o.label)).toEqual(['Contacts', 'Organigramme']);
  });
  it('section à entrée unique : aucun niveau « entrée »', () => {
    const m = buildBreadcrumbModel(items, '/recherche', { goHome });
    expect(m.entry).toBeUndefined();
    expect(m.next).toBeUndefined();
  });
  it('page inconnue : seulement l\'accueil', () => {
    const m = buildBreadcrumbModel(items, '/inconnu', { goHome });
    expect(m.section).toBeUndefined();
    expect(m.home.label).toBe('Accueil');
  });
});
