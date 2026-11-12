import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PreviewViewer } from '../../runtime/preview-viewer';
import { isWebGLAvailable } from '../../webgl-support';
import styles from './library.module.css';

type State = 'loading' | 'ready' | 'error' | 'no-webgl';

/** Aperçu 3D d'une ressource. Un seul contexte WebGL par aperçu, libéré au démontage. */
export default function ResourcePreview3D({ uris }: { uris: string[] }) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<PreviewViewer | null>(null);
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    if (!isWebGLAvailable() || !canvasRef.current) {
      setState('no-webgl');
      return;
    }
    const viewer = new PreviewViewer(canvasRef.current);
    viewerRef.current = viewer;
    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    let cancelled = false;
    setState('loading');
    viewer
      .load(uris)
      .then(() => !cancelled && setState('ready'))
      .catch((e) => {
        if (cancelled) return;
        console.error('Character Factory (aperçu):', e);
        setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [uris.join('|')]);

  const message =
    state === 'loading'
      ? t('libPreviewLoading', "Chargement de l'aperçu…")
      : state === 'error'
        ? t('libPreviewError', "Impossible de charger l'aperçu de cette ressource.")
        : state === 'no-webgl'
          ? t('libPreviewNoWebgl', "L'aperçu 3D nécessite WebGL.")
          : null;

  return (
    <div className={styles.preview} data-testid="resource-preview">
      <canvas ref={canvasRef} />
      {message && <div className={styles.overlay}>{message}</div>}
    </div>
  );
}
