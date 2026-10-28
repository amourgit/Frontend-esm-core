/** Concatène des classes en ignorant les valeurs falsy. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Carte « verre » sombre — même langage visuel que les cartes de
 * l'annuaire : fond translucide, contour fin, survol qui se relève.
 */
export const GLASS_CARD = cx(
  'group relative flex min-w-0 flex-col rounded-2xl border border-white/10 bg-slate-900/45 p-4',
  'text-slate-100 shadow-lg backdrop-blur-sm outline-none transition-all duration-300',
  'hover:-translate-y-1 hover:border-teal-400/50 hover:bg-slate-900/75 hover:shadow-2xl',
  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-400',
);
