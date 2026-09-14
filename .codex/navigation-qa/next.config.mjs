import path from 'node:path';
import { fileURLToPath } from 'node:url';
const fixture = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(fixture, '../..');
export default {
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/lib/auth/access': path.join(fixture, 'auth.js'),
      '@/features/auth/actions': path.join(fixture, 'actions.js'),
      '@': path.join(repo, 'src'),
    };
    return config;
  },
};
