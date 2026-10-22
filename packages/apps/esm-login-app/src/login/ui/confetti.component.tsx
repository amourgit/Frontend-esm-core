import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from 'canvas-confetti';
import confetti from 'canvas-confetti';

type Api = { fire: (options?: ConfettiOptions) => void };
export type ConfettiRef = Api | null;

type ConfettiProps = React.ComponentPropsWithRef<'canvas'> & {
  options?: ConfettiOptions;
  globalOptions?: ConfettiGlobalOptions;
  manualstart?: boolean;
};

// Constante module : un objet par défaut recréé à chaque rendu ré-attacherait
// le canvas (et réinitialiserait les confettis en cours) à chaque re-render.
const DEFAULT_GLOBAL_OPTIONS: ConfettiGlobalOptions = { resize: true, useWorker: true };

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>((props, ref) => {
  const { options, globalOptions = DEFAULT_GLOBAL_OPTIONS, manualstart = false, ...rest } = props;
  const instanceRef = useRef<ConfettiInstance | null>(null);

  const canvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (node !== null) {
        if (instanceRef.current) {
          return;
        }
        instanceRef.current = confetti.create(node, { ...globalOptions, resize: true });
      } else if (instanceRef.current) {
        instanceRef.current.reset();
        instanceRef.current = null;
      }
    },
    [globalOptions],
  );

  const fire = useCallback((opts: ConfettiOptions = {}) => instanceRef.current?.({ ...options, ...opts }), [options]);
  const api = useMemo(() => ({ fire }), [fire]);
  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    if (!manualstart) {
      fire();
    }
  }, [manualstart, fire]);

  return <canvas ref={canvasRef} aria-hidden="true" {...rest} />;
});
Confetti.displayName = 'Confetti';
