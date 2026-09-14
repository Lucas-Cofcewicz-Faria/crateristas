import { neon } from '@neondatabase/serverless';

const email = process.argv[2];
if (!email || !process.env.DATABASE_URL) throw new Error('Informe a conta preservada e configure DATABASE_URL.');
try {
  const sql = neon(process.env.DATABASE_URL);
  const owner = await sql.query('SELECT id, auth_user_id, role, removed_at FROM public.members WHERE lower(email) = $1', [email.toLowerCase()]);
  if (owner.length !== 1 || owner[0].role !== 'admin' || owner[0].removed_at) throw new Error('A conta preservada não é um administrador ativo único.');
  const tables = await sql.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'neon_auth') AND table_type = 'BASE TABLE' ORDER BY 1, 2");
  const counts = {};
  for (const table of ['members','restaurants','visits','scorecards','visit_photos','publication_events','menu_items','menu_scorecards','menu_photos','membership_enrollments']) {
    const [row] = await sql.query(`SELECT count(*)::int AS count FROM public.${table}`);
    counts[table] = row.count;
  }
  const columns = await sql.query("SELECT table_schema, table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'neon_auth' ORDER BY table_name, ordinal_position");
  console.log(JSON.stringify({ owner: owner[0], counts, tables, authColumns: columns, hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN), hasAuthBaseUrl: Boolean(process.env.NEON_AUTH_BASE_URL) }, null, 2));
} catch (error) {
  console.error('Auditoria interrompida:', error.code || error.name || 'Erro de conexão');
  process.exitCode = 1;
}
