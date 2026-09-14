import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { listMigrationFiles, runMigrations } from './migrate.mjs';

const directories: string[] = [];

type TransactionSql = {
  (strings: TemplateStringsArray, ...values: string[]): Promise<unknown[]>;
  query(statement: string): Promise<unknown[]>;
};

async function createMigrationDirectory() {
  const directory = await mkdtemp(join(tmpdir(), 'crateristas-migrations-'));
  directories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('listMigrationFiles', () => {
  test('returns numbered SQL migrations in numeric filename order', async () => {
    const directory = await createMigrationDirectory();
    await writeFile(join(directory, '010_second.sql'), 'SELECT 2;');
    await writeFile(join(directory, '002_first.sql'), 'SELECT 1;');
    await writeFile(join(directory, 'notes.sql'), 'not a migration');

    expect(listMigrationFiles(directory)).toEqual(['002_first.sql', '010_second.sql']);
  });

  test('rejects duplicate three-digit migration prefixes', async () => {
    const directory = await createMigrationDirectory();
    await writeFile(join(directory, '001_first.sql'), 'SELECT 1;');
    await writeFile(join(directory, '001_second.sql'), 'SELECT 2;');

    expect(() => listMigrationFiles(directory)).toThrow('Prefixo de migração duplicado.');
  });
});

describe('runMigrations', () => {
  test('shared membership migration sends one SQL command per prepared statement', async () => {
    const source = await readFile(join(process.cwd(), 'db/migrations/005_shared_membership.sql'), 'utf8');
    const statements = source.split(/^-- statement-breakpoint\s*$/m).map((part) => part.trim()).filter(Boolean);
    // This migration contains no SQL functions or quoted semicolons.
    for (const statement of statements) {
      expect(statement.replace(/--[^\n]*/g, '').split(';').filter((part) => part.trim()), statement).toHaveLength(1);
    }
    expect(statements).toHaveLength(14);
  });

  test('applies each breakpoint-delimited statement once and records the migration', async () => {
    const directory = await createMigrationDirectory();
    await writeFile(join(directory, '001_schema.sql'), 'CREATE TABLE ingredients (id INTEGER);\n-- statement-breakpoint\nCREATE INDEX ingredients_id_idx ON ingredients (id);');
    const appliedMigrations = new Set<string>();
    const committedStatements: string[] = [];
    let trackingTableCreated = false;

    const sql = Object.assign(
      async (strings: TemplateStringsArray, ...values: string[]) => {
        const statement = strings.join('?');
        if (statement.startsWith('CREATE TABLE IF NOT EXISTS schema_migrations')) {
          trackingTableCreated = true;
          return [];
        }
        if (statement.startsWith('SELECT 1 FROM schema_migrations')) {
          return appliedMigrations.has(values[0]) ? [{ exists: 1 }] : [];
        }
        throw new Error(`Unexpected query: ${statement}`);
      },
      {
        transaction: async (callback: (txn: TransactionSql) => Promise<unknown>[]) => {
          const transactionSql: TransactionSql = Object.assign(
            async (strings: TemplateStringsArray, ...values: string[]) => {
              const statement = strings.join('?');
              if (statement.startsWith('INSERT INTO schema_migrations')) {
                appliedMigrations.add(values[0]);
                return [];
              }
              throw new Error(`Unexpected transaction query: ${statement}`);
            },
            {
              query: async (statement: string) => {
                committedStatements.push(statement);
                return [];
              },
            },
          );
          return Promise.all(callback(transactionSql));
        },
      },
    );

    await runMigrations(sql, directory);
    await runMigrations(sql, directory);

    expect(trackingTableCreated).toBe(true);
    expect(committedStatements).toEqual([
      'CREATE TABLE ingredients (id INTEGER);',
      'CREATE INDEX ingredients_id_idx ON ingredients (id);',
    ]);
    expect([...appliedMigrations]).toEqual(['001_schema.sql']);
  });
});
