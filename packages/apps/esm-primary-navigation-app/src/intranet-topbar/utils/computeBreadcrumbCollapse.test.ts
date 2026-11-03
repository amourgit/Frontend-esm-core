import { describe, expect, it } from 'vitest';
import { computeBreadcrumbCollapse } from './computeBreadcrumbCollapse';

describe('computeBreadcrumbCollapse', () => {
  const widths = [60, 100, 100, 100]; // Accueil, A, B, C
  it('ne replie rien quand tout tient', () => {
    expect(computeBreadcrumbCollapse(widths, 20, 20, 1000)).toBe(0);
  });
  it('replie à partir du maillon qui suit l\'Accueil', () => {
    // plein = 60+3*(20+100)=420 ; avec k=1 : 60+(20+20)+2*(120)=340
    expect(computeBreadcrumbCollapse(widths, 20, 20, 400)).toBe(1);
    expect(computeBreadcrumbCollapse(widths, 20, 20, 340)).toBe(1);
  });
  it('replie davantage si nécessaire, sans jamais toucher au premier ni au dernier', () => {
    expect(computeBreadcrumbCollapse(widths, 20, 20, 230)).toBe(2);
    expect(computeBreadcrumbCollapse(widths, 20, 20, 10)).toBe(2);
  });
  it('largeur inconnue ou fil trop court : rien à replier', () => {
    expect(computeBreadcrumbCollapse(widths, 20, 20, 0)).toBe(0);
    expect(computeBreadcrumbCollapse([60, 100], 20, 20, 10)).toBe(0);
  });
});
