import { describe, expect, it } from 'vitest';
import { inDays } from './dates';

// Lundi 26 octobre 2026
const BASE = new Date(2026, 9, 26);

describe('inDays', () => {
  it('décrit le jour même', () => {
    expect(inDays(0, BASE)).toEqual({ month: 'Oct', day: '26', weekday: 'Lun', label: 'Lun 26 oct' });
  });

  it('passe correctement au mois suivant', () => {
    expect(inDays(10, BASE)).toEqual({ month: 'Nov', day: '05', weekday: 'Jeu', label: 'Jeu 5 nov' });
  });

  it('gère les offsets négatifs (passé) et le changement d’année', () => {
    expect(inDays(-3, BASE)).toMatchObject({ month: 'Oct', day: '23', weekday: 'Ven' });
    expect(inDays(66, BASE)).toMatchObject({ month: 'Déc', day: '31', weekday: 'Jeu' });
    expect(inDays(67, BASE)).toMatchObject({ month: 'Jan', day: '01', weekday: 'Ven' });
  });
});
