import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcRoot = join(process.cwd(), 'src');
const thisTest = join('test', 'legacy-removal.test.ts');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}

const forbiddenSourceFragments = [
  ['mock', '_reviews'].join(''),
  ['local', 'Storage'].join(''),
  ['/api', '/reviews'].join(''),
  ['router.push(', "'/home'", ')'].join(''),
];

describe('legacy prototype removal', () => {
  it('leaves no mock review storage or retired reviews API in active source', () => {
    const offenders = sourceFiles(srcRoot)
      .filter((path) => relative(srcRoot, path) !== thisTest)
      .filter((path) => /\.(?:ts|tsx)$/.test(path))
      .flatMap((path) => {
        const source = readFileSync(path, 'utf8');
        return forbiddenSourceFragments.some((fragment) => source.includes(fragment))
          ? [relative(srcRoot, path)]
          : [];
      });

    expect(offenders).toEqual([]);
  });

  it('removes only obsolete prototype modules', () => {
    const obsolete = [
      ['app/api', '/reviews/route.ts'].join(''),
      'components/AddReviewModal.tsx',
      'components/Navbar.tsx',
      'app/home/layout.tsx',
      'app/home/legacy-home.css',
    ].filter((path) => existsSync(join(srcRoot, path)));

    expect(obsolete).toEqual([]);
  });
});
