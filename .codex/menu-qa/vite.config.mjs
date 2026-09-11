import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./', import.meta.url));
const project = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig({
  root, publicDir: project + 'public',
  resolve: { alias: { '@': project + 'src', 'next/image': root + 'mocks.tsx', 'next/link': root + 'link.tsx', 'next/navigation': root + 'mocks.tsx' } },
  plugins: [{ name: 'local-menu-actions', enforce: 'pre', resolveId(source, importer) {
    if (source === './menu-actions' && importer?.includes('/features/menu/')) return root + 'mocks.tsx';
  } }],
  server: { host: '127.0.0.1', port: 5198, strictPort: true, fs: { allow: [project] } },
});
