import { lazy } from 'react';
import type { ComponentType } from 'react';

/** Remplace `next/dynamic` (rendu client uniquement). */
export default function dynamic<P = Record<string, unknown>>(
  loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
) {
  return lazy(async () => {
    const m = await loader();
    return 'default' in (m as object) ? (m as { default: ComponentType<P> }) : { default: m as ComponentType<P> };
  });
}
