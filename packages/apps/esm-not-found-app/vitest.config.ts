import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    {
      name: 'scss-identity',
      enforce: 'pre',
      resolveId(id) {
        if (/\.scss(\?.*)?$/.test(id)) {
          return '\0scss-identity:' + id.replace(/\.scss(\?.*)?$/, '');
        }
      },
      load(id) {
        if (id.startsWith('\0scss-identity:')) {
          return `export default new Proxy({}, { get: (_, k) => typeof k === 'string' ? k : undefined });`;
        }
      },
    },
  ],
  test: {
    environment: 'happy-dom',
    mockReset: true,
    globals: true,
    alias: {
      '@egen/esm-framework/src/internal': '@egen/esm-framework/mock',
      '@egen/esm-framework': '@egen/esm-framework/mock',
    },
  },
});
