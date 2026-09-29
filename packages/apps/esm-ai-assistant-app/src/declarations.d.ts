declare module '*.scss';

interface ImportMeta {
  /** Injecté uniquement par certains bundlers (Vite) ; absent sous Rspack. */
  readonly env?: Record<string, string | undefined>;
}
