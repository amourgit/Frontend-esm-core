export function cn(...classes: (string | undefined | null | false | Record<string, boolean>)[]) {
  return classes
    .flatMap((c) => {
      if (!c) return [];
      if (typeof c === 'string') return c.split(' ').filter(Boolean);
      if (typeof c === 'object') {
        return Object.entries(c)
          .filter(([_, v]) => Boolean(v))
          .map(([k]) => k);
      }
      return [];
    })
    .join(' ');
}
