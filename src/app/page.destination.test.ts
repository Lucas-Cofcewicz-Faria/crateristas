import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('landing descent destination', () => {
  it('descends into the public crater logbook without exercising Three.js', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'app', 'page.tsx'), 'utf8');

    const retiredDestination = ['/ho', 'me'].join('');

    expect(source.match(/router\.push\('\/registros'\)/g)).toHaveLength(1);
    expect(source).not.toContain(`router.push('${retiredDestination}')`);
  });
});
