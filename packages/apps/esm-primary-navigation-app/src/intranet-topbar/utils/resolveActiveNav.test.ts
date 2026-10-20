import { describe, it, expect } from 'vitest';
import { resolveActiveNav } from './resolveActiveNav';
import { type NavItem } from '../components/shell/DropdownNavigation';

const Icon = () => null;
const it_ = (label: string, route: string) => ({ label, icon: Icon, route });
const items: NavItem[] = [
  { id: 1, label: 'Informations', sectionKey: 'informations', subMenus: [
    { title: 'News', items: [it_('À la Une', 'informations/news'), it_('Dossiers', 'informations/news')] },
    { title: 'Agenda', items: [it_('Agenda', 'informations/agenda')] },
  ] },
  { id: 2, label: 'Annuaire', sectionKey: 'annuaire', route: 'annuaire', subMenus: [
    { title: 'Collab', items: [it_('Contacts', 'annuaire/contacts')] },
  ] },
  { id: 3, label: 'Recherche', sectionKey: 'recherche', route: 'recherche', entryName: 'r' },
];

describe('resolveActiveNav', () => {
  it('trouve section et entrée par la route la plus précise', () => {
    expect(resolveActiveNav(items, '/annuaire/contacts')).toMatchObject({ section: { label: 'Annuaire' }, entryLabel: 'Contacts', atSectionRoot: false });
  });
  it('reconnaît une sous-route d\'une entrée', () => {
    expect(resolveActiveNav(items, '/informations/agenda/42')?.entryLabel).toBe('Agenda');
  });
  it('plusieurs entrées sur la même page : utilise le titre de leur colonne', () => {
    expect(resolveActiveNav(items, '/informations/news')?.entryLabel).toBe('News');
  });
  it('détecte la racine d\'une section', () => {
    expect(resolveActiveNav(items, '/annuaire')).toMatchObject({ section: { label: 'Annuaire' }, atSectionRoot: true });
    expect(resolveActiveNav(items, '/recherche')?.atSectionRoot).toBe(true);
  });
  it('repli sur l\'identifiant de section pour une page non listée (ex. fiche collaborateur)', () => {
    expect(resolveActiveNav(items, '/annuaire/968579')).toMatchObject({ section: { label: 'Annuaire' }, entryLabel: undefined });
  });
  it('page inconnue : aucune option active', () => {
    expect(resolveActiveNav(items, '/inconnu')).toBeUndefined();
    expect(resolveActiveNav([], '/annuaire')).toBeUndefined();
  });
  it('ne confond pas deux routes qui partagent un préfixe de texte', () => {
    expect(resolveActiveNav(items, '/annuaire-externe')).toBeUndefined();
  });
});
