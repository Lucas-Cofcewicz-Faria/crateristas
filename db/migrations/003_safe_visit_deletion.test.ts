import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = join(process.cwd(), 'db', 'migrations', '003_safe_visit_deletion.sql');
const migrationExists = existsSync(migrationPath);
const migrationSql = migrationExists ? readFileSync(migrationPath, 'utf8') : '';

describe('003_safe_visit_deletion.sql', () => {
  it('adiciona um marcador persistente e auditável sem apagar registros', () => {
    expect(migrationExists).toBe(true);
    expect(migrationSql).toContain('deletion_started_at TIMESTAMPTZ');
    expect(migrationSql).toContain('deletion_started_by UUID REFERENCES members(id)');
    expect(migrationSql).not.toMatch(/\b(?:DELETE|DROP|TRUNCATE)\b/i);
  });
});
