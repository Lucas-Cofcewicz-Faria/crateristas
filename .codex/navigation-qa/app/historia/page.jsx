export const dynamic = 'force-dynamic';
export default async function History() {
  await new Promise(resolve => setTimeout(resolve, 1800));
  return <section style={{ padding: 48 }}><h1>História de teste</h1><p>Carregamento propositalmente lento para conferir a navegação.</p></section>;
}
