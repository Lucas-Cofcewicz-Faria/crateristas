import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { describe, expect, it } from 'vitest';

const migrationPath = join(process.cwd(), 'db', 'migrations', '002_purge_legacy_reviews.sql');
const migrationExists = existsSync(migrationPath);
const migrationSql = migrationExists ? readFileSync(migrationPath, 'utf8') : '';

describe('002_purge_legacy_reviews.sql', () => {
  it('guards the absent legacy relation and deletes only its rows through dynamic SQL', () => {
    expect(migrationExists).toBe(true);
    expect(migrationSql).toMatch(/to_regclass\('reviews'\)/);
    expect(migrationSql).toContain("EXECUTE 'DELETE FROM reviews'");
    expect(migrationSql).not.toMatch(/\bDROP\b|\bTRUNCATE\b|\b(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+)?(?:members|restaurants|visits|scorecards|visit_photos|publication_events)\b/i);
  });

  it('keeps the guarded DO block as one migrator statement', () => {
    const statements = migrationSql
      .split(/^-- statement-breakpoint\s*$/m)
      .map((part) => part.trim())
      .filter(Boolean);

    expect(statements).toHaveLength(1);
    expect(statements[0]).toMatch(/^DO \$\$[\s\S]*END\s*\$\$;$/);
  });
});

const integrationUrl = process.env.TEST_DATABASE_URL;
const describeIntegration = integrationUrl ? describe : describe.skip;

describeIntegration('002_purge_legacy_reviews.sql on PostgreSQL', () => {
  it('succeeds without reviews, removes all legacy rows, and removes zero more on rerun', async () => {
    if (!integrationUrl) throw new Error('TEST_DATABASE_URL ausente.');
    const sql = neon(integrationUrl);
    const schema = `task13_${randomUUID().replaceAll('-', '')}`;

    await sql.query(`CREATE SCHEMA "${schema}"`);
    try {
      const inSchema = (statements: string[]) => sql.transaction((transaction) => [
        transaction`SELECT set_config('search_path', ${schema}, true)`,
        ...statements.map((statement) => transaction.query(statement)),
      ]);

      await expect(inSchema([migrationSql])).resolves.toBeDefined();
      await inSchema([
        'CREATE TABLE reviews (id text PRIMARY KEY, description text NOT NULL)',
        "INSERT INTO reviews (id, description) VALUES ('legacy-1', 'primeiro'), ('legacy-2', 'segundo')",
        migrationSql,
      ]);

      const firstCount = await inSchema(['SELECT COUNT(*)::int AS count FROM reviews']);
      expect(firstCount.at(-1)).toEqual([{ count: 0 }]);

      await inSchema([migrationSql]);
      const secondCount = await inSchema(['SELECT COUNT(*)::int AS count FROM reviews']);
      expect(secondCount.at(-1)).toEqual([{ count: 0 }]);
    } finally {
      await sql.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    }
  });
});
