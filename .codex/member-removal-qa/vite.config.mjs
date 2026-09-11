import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./', import.meta.url));
const src = fileURLToPath(new URL('../../src', import.meta.url));
export default defineConfig({
  root,
  resolve: { alias: { '@': src, 'next/image': root + 'mocks.tsx' } },
  plugins: [{ name: 'local-action-fixture', enforce: 'pre', resolveId(source, importer) {
    if (source === './member-actions' && importer?.endsWith('/MemberManager.tsx')) return root + 'mocks.tsx';
  } }],
  server: { host: '127.0.0.1', port: 5197, strictPort: true, fs: { allow: [fileURLToPath(new URL('../../', import.meta.url))] } },
});
