import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

export function listMigrationFiles(directory) {
  const files = readdirSync(directory)
    .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
    .sort((a, b) => a.localeCompare(b));
  const prefixes = files.map((name) => name.slice(0, 3));
  if (new Set(prefixes).size !== prefixes.length) throw new Error('Prefixo de migração duplicado.');
  return files;
}

export async function runMigrations(sql, directory) {
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  for (const name of listMigrationFiles(directory)) {
    const applied = await sql`SELECT 1 FROM schema_migrations WHERE name = ${name}`;
    if (applied.length) continue;
    const source = readFileSync(join(directory, name), 'utf8');
    const statements = source.split(/^-- statement-breakpoint\s*$/m).map((part) => part.trim()).filter(Boolean);
    await sql.transaction((txn) => [
      ...statements.map((statement) => txn.query(statement)),
      txn`INSERT INTO schema_migrations (name) VALUES (${name})`,
    ]);
    console.log(`${name} applied`);
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não configurada.');
  const directory = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');
  await runMigrations(neon(url), directory);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
