export const dynamic = 'force-dynamic';
export default async function Records() {
  await new Promise(resolve => setTimeout(resolve, 1800));
  return <section style={{ padding: 48 }}><h1>Registros de teste</h1></section>;
}
