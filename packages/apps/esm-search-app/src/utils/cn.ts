// Utilitaire de composition de classes (équivalent allégé de clsx) utilisé par
// les composants Tailwind de la TopBar. Placé dans `utils/` (et non `lib/`)
// car `lib` est ignoré par le .gitignore racine.
export type ClassValue =
  | string
  | undefined
  | null
  | false
  | Record<string, boolean | undefined | null>
  | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  const out: string[] = [];
  const walk = (c: ClassValue) => {
    if (!c) return;
    if (typeof c === 'string') {
      out.push(...c.split(' ').filter(Boolean));
    } else if (Array.isArray(c)) {
      c.forEach(walk);
    } else if (typeof c === 'object') {
      Object.entries(c).forEach(([k, v]) => {
        if (v) out.push(k);
      });
    }
  };
  classes.forEach(walk);
  return out.join(' ');
}
