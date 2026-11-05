import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRANSIENT_DATE_RULES,
  offsetMinutes,
  parseInstant,
  parseIsoInstant,
  resolveWindow,
  type TransientDateRules,
} from './transient-time';

const T = (iso: string) => Date.parse(iso);
const lenient: TransientDateRules = { requireOffset: false, defaultOffset: '+01:00' };

describe('offsetMinutes', () => {
  it('Z et ±HH:MM ; refuse le reste', () => {
    expect(offsetMinutes('Z')).toBe(0);
    expect(offsetMinutes('+01:00')).toBe(60);
    expect(offsetMinutes('-05:30')).toBe(-330);
    expect(offsetMinutes('+14:00')).toBe(840);
    expect(offsetMinutes('+15:00')).toBeNull();
    expect(offsetMinutes('+01:60')).toBeNull();
    expect(offsetMinutes('+0100')).toBeNull();
    expect(offsetMinutes('')).toBeNull();
  });
});

describe('parseIsoInstant (règles par défaut : décalage exigé)', () => {
  it('lit date + heure avec décalage (Libreville = +01:00) et Z', () => {
    expect(parseIsoInstant('2026-11-06T09:00:00+01:00')).toEqual({ ok: true, value: T('2026-11-06T08:00:00Z') });
    expect(parseIsoInstant('2026-11-06T08:00Z')).toEqual({ ok: true, value: T('2026-11-06T08:00:00Z') });
    expect(parseIsoInstant('2026-11-06T03:00:00-05:00')).toEqual({ ok: true, value: T('2026-11-06T08:00:00Z') });
  });

  it('secondes et millisecondes optionnelles', () => {
    expect(parseIsoInstant('2026-11-06T09:00:30.250+01:00')).toEqual({ ok: true, value: T('2026-11-06T08:00:30.250Z') });
    expect(parseIsoInstant('2026-11-06T09:00:30.5+01:00')).toEqual({ ok: true, value: T('2026-11-06T08:00:30.500Z') });
  });

  it('refuse une chaîne sans décalage (ambiguë)', () => {
    expect(parseIsoInstant('2026-11-06T09:00:00')).toEqual({ ok: false, reason: 'offset-required' });
  });

  it('refuse date seule, séparateur espace, texte libre', () => {
    expect(parseIsoInstant('2026-11-06')).toEqual({ ok: false, reason: 'format' });
    expect(parseIsoInstant('2026-11-06 09:00:00+01:00')).toEqual({ ok: false, reason: 'format' });
    expect(parseIsoInstant('demain 9h')).toEqual({ ok: false, reason: 'format' });
    expect(parseIsoInstant('')).toEqual({ ok: false, reason: 'format' });
  });

  it('refuse les dates et heures impossibles, et un décalage invalide', () => {
    expect(parseIsoInstant('2026-02-30T10:00:00+01:00')).toEqual({ ok: false, reason: 'invalid-date' });
    expect(parseIsoInstant('2026-13-01T10:00:00+01:00')).toEqual({ ok: false, reason: 'invalid-date' });
    expect(parseIsoInstant('2026-11-06T24:00:00+01:00')).toEqual({ ok: false, reason: 'invalid-date' });
    expect(parseIsoInstant('2026-11-06T10:61:00+01:00')).toEqual({ ok: false, reason: 'invalid-date' });
    expect(parseIsoInstant('2026-11-06T10:00:00+99:00')).toEqual({ ok: false, reason: 'invalid-offset' });
  });

  it('accepte le 29 février d’une année bissextile seulement', () => {
    expect(parseIsoInstant('2028-02-29T10:00:00Z').ok).toBe(true);
    expect(parseIsoInstant('2026-02-29T10:00:00Z')).toEqual({ ok: false, reason: 'invalid-date' });
  });
});

describe('parseIsoInstant (requireOffset désactivé)', () => {
  it('applique le décalage par défaut aux chaînes sans décalage', () => {
    expect(parseIsoInstant('2026-11-06T09:00:00', lenient)).toEqual({ ok: true, value: T('2026-11-06T08:00:00Z') });
    expect(parseIsoInstant('2026-11-06T09:00:00', { requireOffset: false, defaultOffset: '-05:00' })).toEqual({
      ok: true,
      value: T('2026-11-06T14:00:00Z'),
    });
  });

  it('un décalage explicite l’emporte sur le décalage par défaut', () => {
    expect(parseIsoInstant('2026-11-06T09:00:00Z', lenient)).toEqual({ ok: true, value: T('2026-11-06T09:00:00Z') });
  });

  it('un décalage par défaut invalide est refusé plutôt que deviné', () => {
    expect(parseIsoInstant('2026-11-06T09:00:00', { requireOffset: false, defaultOffset: 'Paris' })).toEqual({
      ok: false,
      reason: 'invalid-offset',
    });
  });
});

describe('parseInstant', () => {
  it('nombre (epoch) et Date : non ambigus, toujours acceptés', () => {
    expect(parseInstant(1234)).toEqual({ ok: true, value: 1234 });
    expect(parseInstant(new Date(5000))).toEqual({ ok: true, value: 5000 });
  });
  it('refuse NaN, Date invalide, types inattendus', () => {
    expect(parseInstant(Number.NaN).ok).toBe(false);
    expect(parseInstant(new Date('nope')).ok).toBe(false);
    expect(parseInstant({}).ok).toBe(false);
    expect(parseInstant(null).ok).toBe(false);
  });
});

describe('resolveWindow', () => {
  const opened = T('2026-11-05T10:00:00Z');
  const rules = DEFAULT_TRANSIENT_DATE_RULES;

  it('sans dates : immédiat et illimité', () => {
    expect(resolveWindow({ openedAt: opened }, rules)).toEqual({ ok: true, start: opened, end: null });
  });

  it('ttl : compté depuis l’ouverture quand il n’y a pas de début programmé', () => {
    expect(resolveWindow({ openedAt: opened, ttl: 10_000 }, rules)).toEqual({ ok: true, start: opened, end: opened + 10_000 });
  });

  it('ttl : compté depuis le DÉBUT programmé, pas depuis l’ouverture', () => {
    const start = T('2026-11-06T08:00:00Z');
    expect(resolveWindow({ openedAt: opened, startsAt: '2026-11-06T09:00:00+01:00', ttl: 10_000 }, rules)).toEqual({
      ok: true,
      start,
      end: start + 10_000,
    });
  });

  it('la fin la plus proche de expiresAt et start + ttl gagne', () => {
    const start = T('2026-11-06T08:00:00Z');
    const both = (expiresAt: string) =>
      resolveWindow({ openedAt: opened, startsAt: start, ttl: 60_000, expiresAt }, rules);
    expect(both('2026-11-06T08:00:30Z')).toMatchObject({ end: start + 30_000 });
    expect(both('2026-11-06T09:00:00Z')).toMatchObject({ end: start + 60_000 });
  });

  it('un début passé (avant l’ouverture) équivaut à immédiat, et reste stable dans le temps', () => {
    expect(resolveWindow({ openedAt: opened, startsAt: opened - 5_000, ttl: 1_000 }, rules)).toEqual({
      ok: true,
      start: opened,
      end: opened + 1_000,
    });
  });

  it('fin ≤ début programmé : fenêtre invalide', () => {
    const w = resolveWindow({ openedAt: opened, startsAt: '2026-11-06T09:00:00+01:00', expiresAt: '2026-11-06T08:00:00Z' }, rules);
    expect(w).toEqual({ ok: false, field: 'window', reason: 'ends-before-start' });
  });

  it('une fin déjà dépassée à l’ouverture reste valide (le niveau est juste déjà expiré)', () => {
    expect(resolveWindow({ openedAt: opened, expiresAt: opened - 1 }, rules)).toEqual({ ok: true, start: opened, end: opened - 1 });
  });

  it('signale le champ fautif', () => {
    expect(resolveWindow({ openedAt: opened, startsAt: '2026-11-06T09:00:00' }, rules)).toEqual({
      ok: false,
      field: 'startsAt',
      reason: 'offset-required',
    });
    expect(resolveWindow({ openedAt: opened, expiresAt: 'bientôt' }, rules)).toEqual({ ok: false, field: 'expiresAt', reason: 'format' });
  });
});
