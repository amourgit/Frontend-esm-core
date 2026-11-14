import * as React from 'react';

/**
 * TweakCN est écrit pour React 19, où `ref` est une prop ordinaire des composants fonction.
 * Le core est en React 18 : sans `forwardRef`, les refs (Radix `asChild`/`Slot`, infobulles, popovers…) sont perdues.
 * `withRef` conserve le code des composants tel quel et leur fait simplement accepter `ref` (rendu dans `props.ref`).
 */
export function withRef<P extends object>(render: (props: P) => React.ReactNode) {
  const Wrapped = React.forwardRef<unknown, P>(
    (props, ref) => render({ ...props, ref } as P) as React.ReactElement | null,
  );
  Wrapped.displayName = render.name.replace(/Impl$/, '');
  return Wrapped;
}
