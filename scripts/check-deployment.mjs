// Read-only public checks and anonymous rejection checks. Never uses real credentials.
// Usage: node scripts/check-deployment.mjs https://crateristas.vercel.app
import assert from 'node:assert/strict';

const origin = new URL(process.argv[2]).origin;
const fixtureId = '00000000-0000-4000-8000-000000000000';
const decode = (value) => value.replaceAll('&quot;', '"').replaceAll('&amp;', '&');

async function submitPublicForm(path, fields) {
  const html = await (await fetch(origin + path)).text();
  const form = new FormData();
  for (const [input] of html.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = input.match(/name="([^"]*)"/)?.[1];
    if (name) form.set(name, decode(input.match(/value="([^"]*)"/)?.[1] || ''));
  }
  assert([...form.keys()].some((key) => key.startsWith('$ACTION_')), 'Server Action form missing');
  for (const [name, value] of Object.entries(fields)) form.set(name, value);
  const response = await fetch(origin + path, { method: 'POST', headers: { Origin: origin }, body: form });
  assert.equal(response.status, 200, path);
  return response.text();
}

for (const path of ['/', '/home', '/historia', '/registros', '/cadastro', '/entrar']) {
  assert.equal((await fetch(origin + path)).status, 200, path);
  console.log(`PASS public GET ${path}`);
}
const panel = await fetch(origin + '/painel', { redirect: 'manual' });
assert([303, 307, 308].includes(panel.status), 'Private panel must redirect anonymous users');
assert(new URL(panel.headers.get('location'), origin).pathname === '/entrar');
console.log('PASS private panel requires login');

for (const [method, path, body] of [
  ['POST', '/api/visits', {}],
  ['PUT', `/api/visits/${fixtureId}/scorecard`, {}],
  ['PATCH', `/api/visits/${fixtureId}/publication`, 'hide'],
  ['DELETE', `/api/visits/${fixtureId}`, { confirmation: 'Deletar review', expectedParticipantCount: 0 }],
  ['POST', '/api/parse-maps', {}],
]) {
  const response = await fetch(origin + path, { method, headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) });
  assert.equal(response.status, 401, `${method} ${path}`);
  console.log(`PASS anonymous ${method} ${path} rejected`);
}
const reset = await submitPublicForm('/recuperar-senha', { email: 'auth-diagnostic@example.invalid' });
assert(reset.includes('Se o e-mail estiver cadastrado'), 'Password recovery form failed');
assert(!reset.includes('Não foi possível enviar o link agora'), 'Password recovery regression');
console.log('PASS password recovery form accepted (nonexistent email; delivery NOT tested)');
const login = await submitPublicForm('/entrar', { email: 'auth-diagnostic@example.invalid', password: 'synthetic-invalid-password' });
assert(login.includes('E-mail ou senha inválidos.'), 'Login did not return expected credential rejection');
assert(!login.includes('Não foi possível entrar agora'), 'Login provider/configuration failure');
console.log('PASS login reaches credential validation (real account NOT tested)');
