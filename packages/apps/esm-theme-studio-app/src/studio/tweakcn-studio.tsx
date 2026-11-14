import '../tweakcn/tweakcn.generated.tw.css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Editor from '../tweakcn/components/editor/editor';
import { ThemeProvider } from '../tweakcn/components/theme-provider';
import { DynamicFontLoader } from '../tweakcn/components/dynamic-font-loader';
import { Toaster } from '../tweakcn/components/ui/toaster';
import { TooltipProvider } from '../tweakcn/components/ui/tooltip';
import { QueryProvider } from '../tweakcn/lib/query-client';
import { PortalContainerProvider } from '../tweakcn/lib/portal-container';
import { HostBridgeProvider, type HostBridge } from '../tweakcn/lib/host-bridge';
import { setThemeRoot } from '../tweakcn/lib/theme-root';
import { BUILTIN_FONTS_URL } from '../tweakcn/lib/builtin-fonts';
import type { ThemeStyles } from '../tweakcn/types/theme';
import type { ThemeRuntimePort } from '../core/runtime';
import type { TweakcnStyles } from '../core/tweakcn-adapter';
import { applyToProject } from './apply';

interface Props {
  runtime: ThemeRuntimePort;
  applyPriority: number;
}

const FONTS_LINK_ID = 'egen-theme-studio-fonts';

/**
 * Theme Studio = éditeur TweakCN d'origine (même UI/UX), isolé dans une racine `.tweakcn-root` :
 * le thème édité, la classe `dark` et le CSS Tailwind de l'éditeur ne s'appliquent QU'À cette racine.
 */
const TweakcnStudio: React.FC<Props> = ({ runtime, applyPriority }) => {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [isApplied, setIsApplied] = useState(() => runtime.isApplied());

  const rootRef = useCallback((el: HTMLDivElement | null) => {
    setThemeRoot(el);
    setRoot(el);
  }, []);

  useEffect(() => {
    if (document.getElementById(FONTS_LINK_ID)) return;
    const link = document.createElement('link');
    link.id = FONTS_LINK_ID;
    link.rel = 'stylesheet';
    link.href = BUILTIN_FONTS_URL;
    document.head.appendChild(link);
  }, []);

  useEffect(() => () => setThemeRoot(null), []);

  const bridge = useMemo<HostBridge>(
    () => ({
      isApplied,
      apply: (styles: ThemeStyles) => {
        applyToProject(runtime, styles as unknown as TweakcnStyles, applyPriority);
        setIsApplied(true);
      },
      revert: () => {
        runtime.revert();
        setIsApplied(false);
      },
    }),
    [runtime, applyPriority, isApplied],
  );

  return (
    <div ref={rootRef} className="tweakcn-root" data-testid="theme-studio">
      {root && (
        <PortalContainerProvider value={root}>
          <QueryProvider>
            <ThemeProvider defaultTheme="light">
              <TooltipProvider>
                <HostBridgeProvider value={bridge}>
                  <DynamicFontLoader />
                  <Toaster />
                  <div className="relative isolate flex h-full flex-col overflow-hidden">
                    <main className="isolate flex flex-1 flex-col overflow-hidden">
                      <Editor />
                    </main>
                  </div>
                </HostBridgeProvider>
              </TooltipProvider>
            </ThemeProvider>
          </QueryProvider>
        </PortalContainerProvider>
      )}
    </div>
  );
};

export default TweakcnStudio;
