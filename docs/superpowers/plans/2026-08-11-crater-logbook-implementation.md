# Crater Logbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o prototipo atual por um livro publico de avaliacoes coletivas, com oito contas fechadas, publicacao por quorum, controle administrativo e a landing Three.js preservada.

**Architecture:** O App Router renderiza paginas publicas no servidor e usa Route Handlers finos para mutacoes autenticadas. Regras de media, publicacao e permissao ficam em modulos de dominio testaveis; Neon Postgres persiste o dominio, Neon Auth fornece sessoes e Vercel Blob armazena fotos. O novo schema e aditivo; depois que as rotas novas estiverem verificadas, uma migracao explicita apaga somente as linhas do prototipo legado e as telas antigas sao removidas.

**Tech Stack:** Next.js 16.2.7, React 19.2.4, TypeScript strict, Neon Serverless Postgres, Neon Auth, Vercel Blob, Zod, Vitest, Testing Library e CSS Modules/vanilla CSS.

## Global Constraints

- Toda a interface, metadata, validacao e mensagem de erro deve usar portugues brasileiro.
- A primeira entrega atende somente desktop entre 1280 e 1920 px; nao criar navegacao mobile nesta fase.
- As notas inteiras de 0 a 10 sao `food`, `service`, `ambience`, `value`, `access` e `waitTime`; maior sempre significa melhor.
- O comentario de cada membro e obrigatorio e possui no maximo 180 caracteres.
- O quorum padrao e 6 de 8 membros; a sexta ficha publica automaticamente.
- O administrador pode publicar a partir de uma ficha, ocultar e republicar; uma visita oculta nao republica automaticamente.
- A pagina publica mostra medias coletivas e comentarios atribuidos, nunca as notas numericas individuais.
- Cada membro possui no maximo uma ficha por visita e pode editar somente a propria ficha.
- Cada visita aceita no maximo cinco fotos WebP, ate 1600 px no maior lado e aproximadamente 750.000 bytes por arquivo.
- Manter Neon, Vercel Hobby/Blob e o subdominio `.vercel.app` dentro das cotas gratuitas.
- Nao usar `localStorage` como fallback para dados autenticados ou publicados.
- Nao criar cadastro publico, resumo por IA, ranking competitivo ou perfis individuais de membros.
- Nao alterar o loop, camera, scroll, geometrias, materiais, luzes, particulas, eventos ou descarte de `GourmetScene.tsx`. Por autorizacao do usuario em 2026-08-11, sao permitidas somente correcoes comprovadamente nao funcionais exigidas pelo lint, como trocar uma variavel nunca reatribuida de `let` para `const`.
- A unica mudanca funcional permitida na landing e trocar o destino final de `/home` para `/registros`.
- Antes de editar recursos Next.js, ler os guias locais relevantes em `node_modules/next/dist/docs/01-app/` conforme `AGENTS.md`.
- Nao dropar a tabela legada `reviews`; por decisao do usuario em 2026-08-13, a Task 13 apaga somente suas linhas, sem importa-las para o livro de registros.

## File Structure

### Dominio e persistencia

- `src/domain/reviews/types.ts`: tipos, chaves de notas e contratos compartilhados.
- `src/domain/reviews/aggregate.ts`: calculo puro das medias e da nota geral.
- `src/domain/reviews/publication.ts`: maquina de estados de publicacao.
- `src/domain/reviews/schemas.ts`: validacao Zod de visitas, fichas e comandos administrativos.
- `src/domain/reviews/repository.ts`: interface usada pelos servicos.
- `src/domain/reviews/service.ts`: casos de uso e verificacao de permissao.
- `src/lib/db.ts`: cliente Neon sem criacao de schema durante requests.
- `src/lib/repositories/neon-review-repository.ts`: implementacao SQL do contrato.
- `db/migrations/001_crater_logbook.sql`: schema aditivo do dominio.
- `db/migrations/002_purge_legacy_reviews.sql`: limpeza idempotente das linhas do prototipo antigo.
- `scripts/migrate.mjs`: executor explicito das migracoes.

### Autenticacao e APIs

- `src/lib/auth/server.ts`: instancia unica de Neon Auth.
- `src/lib/auth/access.ts`: `requireMember()` e `requireAdmin()`.
- `src/app/api/auth/[...path]/route.ts`: handler Neon Auth.
- `src/proxy.ts`: redirecionamento otimista das rotas privadas.
- `src/app/api/visits/route.ts`: criacao de visita.
- `src/app/api/visits/[id]/scorecard/route.ts`: upsert da propria ficha.
- `src/app/api/visits/[id]/publication/route.ts`: publicar, ocultar e republicar.
- `src/app/api/visits/[id]/photos/route.ts`: token e callback de upload do Blob.

### Interface

- `src/app/layout.tsx` e `src/app/globals.css`: idioma, metadata, fontes e tokens globais.
- `src/components/shell/*` e `shell.module.css`: cabecalho, rodape e moldura desktop.
- `src/components/ui/*` e `ui.module.css`: botoes, campos, badges, estados e indicadores de nota.
- `src/features/records/*` e `records.module.css`: lista, filtros e cartoes do arquivo publico.
- `src/features/restaurant/*` e `restaurant.module.css`: detalhe, medias, galeria e fragmentos de comentarios.
- `src/features/members/*` e `members.module.css`: diretorio publico e cartoes expansíveis.
- `src/features/visits/*` e `visits.module.css`: formularios privados, painel, administracao e fotos.
- `src/content/society.ts`: easter eggs deterministas e nao essenciais.
- `src/app/registros/page.tsx`, `src/app/restaurantes/[slug]/page.tsx`, `src/app/membros/page.tsx`: paginas publicas.
- `src/app/entrar/page.tsx`, `src/app/painel/page.tsx`, `src/app/visitas/nova/page.tsx`, `src/app/visitas/[id]/avaliar/page.tsx`: paginas privadas.

---

### Task 1: Test harness and review-domain rules

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/domain/reviews/types.ts`
- Create: `src/domain/reviews/aggregate.ts`
- Create: `src/domain/reviews/aggregate.test.ts`
- Create: `src/domain/reviews/publication.ts`
- Create: `src/domain/reviews/publication.test.ts`
- Create: `src/domain/reviews/schemas.ts`
- Create: `src/domain/reviews/schemas.test.ts`

**Interfaces:**
- Produces: `SCORE_KEYS`, `ScoreValues`, `ReviewAggregate`, `aggregateScorecards()`, `resolvePublication()` e os schemas Zod usados por todas as tarefas posteriores, incluindo `publicVisitFiltersSchema`.

- [ ] **Step 1: Install test and validation dependencies**

Run:

```powershell
npm install zod
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Add scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Configure Vitest**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] },
});
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Write failing aggregate and validation tests**

```ts
import { describe, expect, it } from 'vitest';
import { aggregateScorecards } from './aggregate';

describe('aggregateScorecards', () => {
  it('returns one-decimal collective averages without exposing member scores', () => {
    expect(aggregateScorecards([
      { food: 8, service: 6, ambience: 7, value: 9, access: 4, waitTime: 8 },
      { food: 6, service: 8, ambience: 9, value: 7, access: 6, waitTime: 6 },
    ])).toEqual({
      participantCount: 2,
      averages: { food: 7, service: 7, ambience: 8, value: 8, access: 5, waitTime: 7 },
      overall: 7,
    });
  });
});
```

Add tests asserting integer scores reject `-1`, `10.5` and `11`, comments reject 181 characters, and six valid scores plus a 180-character comment pass.

- [ ] **Step 4: Run the tests and confirm failure**

Run: `npm test -- src/domain/reviews`

Expected: FAIL because `aggregate`, `publication` and `schemas` do not exist.

- [ ] **Step 5: Implement the domain types and aggregate**

```ts
export const SCORE_KEYS = ['food', 'service', 'ambience', 'value', 'access', 'waitTime'] as const;
export type ScoreKey = (typeof SCORE_KEYS)[number];
export type ScoreValues = Record<ScoreKey, number>;
export type PublicationState = 'private' | 'published' | 'hidden';
export type PublicationReason = 'quorum' | 'admin_override' | null;

export interface ReviewAggregate {
  participantCount: number;
  averages: ScoreValues | null;
  overall: number | null;
}
```

Implement `aggregateScorecards(scores: ScoreValues[]): ReviewAggregate` with equal weighting and one-decimal rounding.

- [ ] **Step 6: Implement the publication state machine**

```ts
export type PublicationCommand = 'scorecard_saved' | 'publish_early' | 'hide' | 'republish';

export function resolvePublication(input: {
  state: PublicationState;
  reason: PublicationReason;
  participantCount: number;
  quorum: number;
  command: PublicationCommand;
  isAdmin: boolean;
}): { state: PublicationState; reason: PublicationReason };
```

Rules: `hidden + scorecard_saved` remains hidden; `private + count >= quorum` publishes by quorum; early publication requires admin and at least one participant; hide and republish require admin; republish uses `admin_override`.

- [ ] **Step 7: Implement Zod schemas**

Export `createVisitSchema`, `scorecardSchema`, `publicationCommandSchema` and `publicVisitFiltersSchema`. Use Portuguese error strings, `z.number().int().min(0).max(10)` for each score and `z.string().trim().min(1).max(180)` for the comment. The public filter schema accepts only trimmed `busca`, `culinaria` and `bairro` strings, takes the first value when a query key is repeated, applies conservative length limits and returns an object compatible with `PublicVisitFilters`.

- [ ] **Step 8: Run tests and commit**

Run: `npm test -- src/domain/reviews`

Expected: PASS.

```powershell
git add package.json package-lock.json vitest.config.ts src/test src/domain/reviews
git commit -m "test: define collective review rules"
```

### Task 2: Additive database schema and explicit migrations

**Files:**
- Modify: `package.json`
- Modify: `src/lib/db.ts`
- Create: `db/migrations/001_crater_logbook.sql`
- Create: `scripts/migrate.mjs`
- Create: `scripts/migrate.test.ts`

**Interfaces:**
- Consumes: publication and score names from Task 1.
- Produces: `getDb()` and the tables `members`, `restaurants`, `visits`, `scorecards`, `visit_photos`, `publication_events`, `schema_migrations`.

- [ ] **Step 1: Write a failing migration-order test**

The test imports `listMigrationFiles(directory)` from `scripts/migrate.mjs` and expects numeric filename order and rejection of duplicate three-digit prefixes such as `001_a.sql` plus `001_b.sql`.

Run: `npm test -- scripts/migrate.test.ts`

Expected: FAIL because the migration runner does not exist.

- [ ] **Step 2: Write the additive SQL migration**

Use UUID primary keys with `gen_random_uuid()`. Add explicit checks:

```sql
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  display_name VARCHAR(80) NOT NULL,
  avatar_url TEXT,
  society_title VARCHAR(100),
  member_number SMALLINT NOT NULL UNIQUE CHECK (member_number BETWEEN 1 AND 8),
  bio VARCHAR(280) NOT NULL DEFAULT '',
  favorite_cuisine VARCHAR(100),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  cuisine VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL DEFAULT 'São Paulo',
  address TEXT,
  price_band VARCHAR(4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  created_by UUID REFERENCES members(id),
  visited_at DATE NOT NULL,
  quorum SMALLINT NOT NULL DEFAULT 6 CHECK (quorum BETWEEN 1 AND 8),
  publication_state TEXT NOT NULL DEFAULT 'private' CHECK (publication_state IN ('private', 'published', 'hidden')),
  publication_reason TEXT CHECK (publication_reason IN ('quorum', 'admin_override')),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES members(id),
  hidden_at TIMESTAMPTZ,
  hidden_by UUID REFERENCES members(id),
  version INTEGER NOT NULL DEFAULT 1,
  legacy_review_id VARCHAR(50) UNIQUE,
  legacy_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id),
  food SMALLINT NOT NULL CHECK (food BETWEEN 0 AND 10),
  service SMALLINT NOT NULL CHECK (service BETWEEN 0 AND 10),
  ambience SMALLINT NOT NULL CHECK (ambience BETWEEN 0 AND 10),
  value SMALLINT NOT NULL CHECK (value BETWEEN 0 AND 10),
  access SMALLINT NOT NULL CHECK (access BETWEEN 0 AND 10),
  wait_time SMALLINT NOT NULL CHECK (wait_time BETWEEN 0 AND 10),
  comment VARCHAR(180) NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 180),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (visit_id, member_id)
);

CREATE TABLE IF NOT EXISTS visit_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES members(id),
  url TEXT NOT NULL,
  pathname TEXT NOT NULL UNIQUE,
  content_type VARCHAR(40) CHECK (content_type = 'image/webp'),
  size_bytes INTEGER CHECK (size_bytes BETWEEN 1 AND 750000),
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (visit_id, position)
);

CREATE TABLE IF NOT EXISTS publication_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES members(id),
  action TEXT NOT NULL CHECK (action IN ('quorum_publish', 'publish_early', 'hide', 'republish')),
  participant_count SMALLINT NOT NULL CHECK (participant_count BETWEEN 1 AND 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS visits_public_idx ON visits (published_at DESC) WHERE publication_state = 'published';
CREATE INDEX IF NOT EXISTS scorecards_visit_idx ON scorecards (visit_id);
CREATE INDEX IF NOT EXISTS scorecards_member_idx ON scorecards (member_id, visit_id);
```

`visits.created_by` and the three upload metadata fields remain nullable at the database boundary, but every new visit and upload must provide the authenticated actor and known file metadata through the service. A visit slug identifies the public review, not only the restaurant; generate it from restaurant name plus visit date, adding a deterministic numeric suffix on collision. The migration runner creates `schema_migrations(name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())` before reading numbered files.

- [ ] **Step 3: Replace request-time schema creation**

`src/lib/db.ts` must export only a validated lazy client:

```ts
import { neon } from '@neondatabase/serverless';

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não configurada.');
  return neon(url);
}
```

Remove `INITIAL_REVIEWS` and `initDatabase()`; do not drop the legacy table. Its rows are purged explicitly only in Task 13.

- [ ] **Step 4: Implement the migration runner**

`scripts/migrate.mjs` reads ordered `.sql` files, creates `schema_migrations`, skips applied names and records each successful migration. Add `"db:migrate": "node --env-file=.env.local scripts/migrate.mjs"` to `package.json`. Separate top-level SQL statements with a line containing `-- statement-breakpoint`; do not split arbitrary SQL on semicolons.

```js
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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
  }
}
```

- [ ] **Step 5: Run runner tests and migration on a non-production Neon branch**

Run:

```powershell
npm test -- scripts/migrate.test.ts
npm run db:migrate
```

Expected: tests PASS; migration reports `001_crater_logbook.sql applied` without altering `reviews`.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json src/lib/db.ts db scripts
git commit -m "feat: add crater logbook database schema"
```

### Task 3: Repository contract and review services

**Files:**
- Create: `src/domain/reviews/repository.ts`
- Create: `src/domain/reviews/service.ts`
- Create: `src/domain/reviews/service.test.ts`
- Create: `src/lib/repositories/neon-review-repository.ts`
- Create: `src/lib/repositories/neon-review-repository.integration.test.ts`

**Interfaces:**
- Produces: `ReviewRepository`, `createReviewService(repository)`, `repository.listPublicVisits(filters)`, `repository.getPublicVisitBySlug(slug)` e `repository.listPendingVisitsForMember(memberId)`.

- [ ] **Step 1: Define repository records and write failing service tests**

The contract must include `MemberRecord`, `PublicMemberSummary`, `VisitRecord`, `ScorecardRecord`, `PublicVisitSummary`, `PublicVisitDetail` and methods for finding members/visits, creating visits, upserting scorecards, counting participants, recording publication changes, managing photos and explicit public queries.

```ts
export interface ReviewRepository {
  findMemberByAuthUserId(authUserId: string): Promise<MemberRecord | null>;
  findMemberById(memberId: string): Promise<MemberRecord | null>;
  findVisitById(visitId: string): Promise<VisitRecord | null>;
  createVisit(actorId: string, input: CreateVisitInput): Promise<VisitRecord>;
  upsertScorecard(visitId: string, memberId: string, input: ScorecardInput): Promise<void>;
  countScorecards(visitId: string): Promise<number>;
  updatePublication(visitId: string, state: PublicationState, reason: PublicationReason, actorId: string | null): Promise<VisitRecord>;
  recordPublicationEvent(input: PublicationEventInput): Promise<void>;
  attachPhoto(visitId: string, actorId: string, input: PhotoInput): Promise<void>;
  deletePhoto(visitId: string, photoId: string, actorId: string): Promise<PhotoRecord>;
  countVisitPhotos(visitId: string): Promise<number>;
  listPublicVisits(filters: PublicVisitFilters): Promise<PublicVisitSummary[]>;
  getPublicVisitBySlug(slug: string): Promise<PublicVisitDetail | null>;
  listPublicMembers(): Promise<PublicMemberSummary[]>;
  listPendingVisitsForMember(memberId: string): Promise<PendingVisit[]>;
}
```

Test with an in-memory repository:

```ts
it('publishes the sixth scorecard and keeps individual scores private', async () => {
  const service = createReviewService(repositoryWithFiveScores());
  const result = await service.submitScorecard(memberSix, visitId, validScorecard);
  expect(result.publicationState).toBe('published');
  expect(result.participantCount).toBe(6);
  expect(await repository.getPublicVisitBySlug('casa-teste')).not.toHaveProperty('scorecards');
});
```

Add tests for editing one scorecard, late seventh/eighth scores, non-admin early publication rejection, admin early publication, hidden visits staying hidden and one member editing another member's score rejection.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- src/domain/reviews/service.test.ts`

Expected: FAIL because `createReviewService` is undefined.

- [ ] **Step 3: Implement the service boundary**

```ts
export function createReviewService(repository: ReviewRepository) {
  return {
    createVisit(actor: MemberRecord, input: CreateVisitInput): Promise<VisitRecord>,
    submitScorecard(actor: MemberRecord, visitId: string, input: ScorecardInput): Promise<SubmissionResult>,
    changePublication(actor: MemberRecord, visitId: string, command: PublicationCommand): Promise<VisitRecord>,
    attachPhoto(actor: MemberRecord, visitId: string, photo: PhotoInput): Promise<void>,
  };
}
```

All permission decisions happen before repository mutation. `submitScorecard` uses upsert, recounts participants, applies the `resolvePublication` rules, and writes an event only when the state changes. Implement the upsert, quorum transition and event as one Neon HTTP transaction so a failure cannot leave a saved score with a stale publication state. Use a conditional `UPDATE` that reads the post-upsert count inside the transaction; hidden visits remain excluded. Photo position allocation plus insert must also be atomic so concurrent uploads cannot exceed positions 1-5.

- [ ] **Step 4: Implement explicit public SQL projections**

`getPublicVisitBySlug()` must select aggregate columns and public comments with `members.display_name` and `members.avatar_url`; it must not select scorecard numeric columns into the returned comment objects. Filter `visits.publication_state = 'published'` in SQL, not after fetching. `listPublicMembers()` returns only display name, slug, avatar, society title, member number, bio, favorite cuisine and aggregate public contribution statistics.

- [ ] **Step 5: Add conditional integration tests**

Run integration tests only when `TEST_DATABASE_URL` exists. Insert records in a transaction/test schema, assert unique scorecard and 0-10 checks, then clean the inserted UUIDs. The normal `npm test` suite must still pass without external credentials.

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- src/domain/reviews src/lib/repositories`

Expected: PASS; integration suite reports skipped only when `TEST_DATABASE_URL` is absent.

```powershell
git add src/domain/reviews src/lib/repositories
git commit -m "feat: implement collective review service"
```

### Task 4: Neon Auth and server-side access control

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/auth/server.ts`
- Create: `src/lib/auth/access.ts`
- Create: `src/lib/auth/access.test.ts`
- Create: `src/app/api/auth/[...path]/route.ts`
- Create: `src/proxy.ts`
- Create: `docs/setup/neon-auth.md`

**Interfaces:**
- Consumes: member lookup from Task 3.
- Produces: `auth`, `requireMember()`, `requireAdmin()` and protected private route matching.

- [ ] **Step 1: Read current auth guides and install Neon Auth**

Read:

- `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
- <https://neon.com/docs/auth/migrate/from-auth-v0.1>

Run: `npm install @neondatabase/auth`

- [ ] **Step 2: Write failing access tests**

Mock `auth.getSession()` and member lookup. Assert missing session throws `AuthenticationError`, an authenticated unprovisioned user throws `AuthorizationError`, a member passes `requireMember()`, and only `role: 'admin'` passes `requireAdmin()`.

- [ ] **Step 3: Configure the server singleton and API handler**

```ts
import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
});
```

Export `GET` and `POST` from `auth.handler()` in `src/app/api/auth/[...path]/route.ts`.

- [ ] **Step 4: Implement server-side member resolution**

`requireMember()` calls `auth.getSession()`, obtains `session.user.id`, looks up `members.auth_user_id`, and returns the domain member. `requireAdmin()` calls `requireMember()` and checks `role`.

```ts
export async function requireMember(): Promise<MemberRecord> {
  const { data } = await auth.getSession();
  if (!data) throw new AuthenticationError();
  const member = await repository.findMemberByAuthUserId(data.user.id);
  if (!member) throw new AuthorizationError();
  return member;
}

export async function requireAdmin(): Promise<MemberRecord> {
  const member = await requireMember();
  if (member.role !== 'admin') throw new AuthorizationError();
  return member;
}
```

- [ ] **Step 5: Add optimistic route redirection**

Create `src/proxy.ts` using `auth.middleware({ loginUrl: '/entrar' })` for `/painel/:path*` and `/visitas/:path*`. Every action and handler still calls `requireMember()` or `requireAdmin()`; proxy alone is not authorization.

```ts
import { auth } from '@/lib/auth/server';

export default auth.middleware({ loginUrl: '/entrar' });
export const config = { matcher: ['/painel/:path*', '/visitas/:path*'] };
```

- [ ] **Step 6: Document account provisioning**

`docs/setup/neon-auth.md` must list the exact required environment variables, Neon Console steps, creation of eight users, and SQL insertion of eight `members` rows linked by Auth user ID. State that no signup UI or route is exposed.

- [ ] **Step 7: Run tests and commit**

Run: `npm test -- src/lib/auth`

Expected: PASS.

```powershell
git add package.json package-lock.json src/lib/auth src/app/api/auth src/proxy.ts docs/setup/neon-auth.md
git commit -m "feat: add closed member authentication"
```

### Task 5: Authenticated visit APIs

**Files:**
- Create: `src/app/api/visits/route.ts`
- Create: `src/app/api/visits/[id]/scorecard/route.ts`
- Create: `src/app/api/visits/[id]/publication/route.ts`
- Create: `src/app/api/visits/routes.test.ts`
- Create: `src/lib/http/errors.ts`

**Interfaces:**
- Consumes: schemas from Task 1, services from Task 3, access functions from Task 4.
- Produces: JSON mutation contracts consumed by private forms.

- [ ] **Step 1: Write failing route tests**

Mock access and service layers. Assert:

- unauthenticated request returns `401` and `Sessão expirada. Entre novamente.`;
- invalid score returns `400` with field errors;
- valid score returns `{ participantCount, publicationState, aggregate }`;
- non-admin publication returns `403`;
- admin publication command accepts only `publish_early`, `hide` or `republish`.

- [ ] **Step 2: Implement a single error mapper**

```ts
import { ZodError } from 'zod';

export function toErrorResponse(error: unknown): Response {
  if (error instanceof AuthenticationError) return Response.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  if (error instanceof AuthorizationError) return Response.json({ error: 'Você não tem permissão para esta ação.' }, { status: 403 });
  if (error instanceof ZodError) return Response.json({ error: 'Revise os campos informados.', fields: error.flatten().fieldErrors }, { status: 400 });
  return Response.json({ error: 'Não foi possível concluir a operação.' }, { status: 500 });
}
```

- [ ] **Step 3: Implement thin handlers**

Each handler parses JSON, validates with the corresponding schema, obtains the actor, invokes exactly one service method and maps errors. Do not place SQL or publication math inside route files.

```ts
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireMember();
    const { id } = await context.params;
    const input = scorecardSchema.parse(await request.json());
    return Response.json(await reviewService.submitScorecard(actor, id, input));
  } catch (error) {
    return toErrorResponse(error);
  }
}
```

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- src/app/api/visits`

Expected: PASS.

```powershell
git add src/app/api/visits src/lib/http
git commit -m "feat: expose authenticated visit APIs"
```

### Task 6: Secure photo compression and Vercel Blob upload

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/features/visits/photo-policy.ts`
- Create: `src/features/visits/photo-policy.test.ts`
- Create: `src/features/visits/compress-image.ts`
- Create: `src/app/api/visits/[id]/photos/route.ts`
- Create: `src/app/api/visits/[id]/photos/route.test.ts`

**Interfaces:**
- Consumes: `requireMember()`, `attachPhoto()` and visit ownership rules.
- Produces: `compressVisitImage(file): Promise<File>` and `/api/visits/[id]/photos` for `@vercel/blob/client`.

- [ ] **Step 1: Read Blob client-upload docs and install the SDK**

Read <https://vercel.com/docs/vercel-blob/client-upload> and run `npm install @vercel/blob`.

- [ ] **Step 2: Write failing photo policy tests**

Assert client input types JPEG/PNG/WebP are accepted, six files are rejected, output over `750_000` bytes is rejected, and public pathname uses `visits/<visitId>/<sanitized-name>.webp` without user-controlled traversal. Assert the upload token accepts only the post-compression MIME type `image/webp`. Add route tests for creator/admin deletion, unrelated-member rejection and concurrent attempts to allocate a sixth position.

- [ ] **Step 3: Implement deterministic client compression**

`compressVisitImage()` uses `createImageBitmap`, scales the largest side to at most 1600 px, draws to canvas, then attempts WebP qualities `0.82`, `0.72`, `0.62`, `0.52`. Reject if the final blob remains over 750.000 bytes. Revoke all object URLs and close the bitmap in `finally`.

```ts
export async function compressVisitImage(file: File): Promise<File> {
  validateInputType(file.type);
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, 1600);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d', { alpha: false })!.drawImage(bitmap, 0, 0, width, height);
    const blob = await encodeWithinLimit(canvas, [0.82, 0.72, 0.62, 0.52], 750_000);
    return new File([blob], `${stripExtension(file.name)}.webp`, { type: 'image/webp' });
  } finally {
    bitmap.close();
  }
}
```

Keep `validateInputType()`, `fitWithin()`, `encodeWithinLimit()` and `stripExtension()` private in the same module. `fitWithin()` must preserve aspect ratio without enlargement; `stripExtension()` must return a non-empty sanitized basename; `encodeWithinLimit()` must reject a null canvas blob and return the first quality below the byte cap. Test these through the exported `compressVisitImage()` behavior with mocked bitmap/canvas APIs.

- [ ] **Step 4: Implement authenticated client-token exchange**

Use `handleUpload()` with:

```ts
return {
  allowedContentTypes: ['image/webp'],
  maximumSizeInBytes: 750_000,
  addRandomSuffix: true,
  tokenPayload: JSON.stringify({ visitId, memberId: actor.id }),
};
```

Before issuing a token, verify the actor created the visit or is admin, the visit has fewer than five photos and the requested pathname matches the server-built `visits/<visitId>/<sanitized-name>.webp` shape. In `onUploadCompleted`, resolve the signed `memberId` back to a `MemberRecord`, then call `attachPhoto()`; if the database rejects the sixth photo, delete the orphaned blob with `del(blob.url)`. Implement `DELETE` on the same route with a body containing `photoId`; only the visit creator or admin may remove it. Return the removed pathname from the repository, call `del(pathname)`, and make retries idempotent so a missing Blob is not exposed as a server error.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- src/features/visits/photo-policy.test.ts src/app/api/visits/[id]/photos/route.test.ts`

Expected: PASS.

```powershell
git add package.json package-lock.json src/features/visits src/app/api/visits
git commit -m "feat: add constrained visit photo uploads"
```

### Task 7: Desktop design system and shared shell

**Files:**
- Modify: `src/app/layout.tsx`
- Replace: `src/app/globals.css`
- Create: `src/components/shell/AppHeader.tsx`
- Create: `src/components/shell/AppFooter.tsx`
- Create: `src/components/shell/PublicShell.tsx`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Field.tsx`
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/ui/ScoreRing.tsx`
- Create: `src/components/shell/shell.module.css`
- Create: `src/components/ui/ui.module.css`
- Create: `src/components/shell/AppHeader.test.tsx`

**Interfaces:**
- Produces: desktop shell and reusable visual primitives for every page.

- [ ] **Step 1: Read local metadata, image and testing guides**

Read:

- `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`
- `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`

- [ ] **Step 2: Write failing navigation test**

Render `AppHeader` as visitor and member. Visitor sees `Registros`, `Membros`, `Entrar`; member sees `Painel` and `Sair`. Assert landmark roles and keyboard-focusable links.

- [ ] **Step 3: Replace global tokens and typography**

Use `Newsreader` for editorial headings and `Manrope` for interface text through `next/font/google`. Set `<html lang="pt-BR">`. Use these tokens:

```tsx
const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-editorial' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-interface' });

<html lang="pt-BR" className={`${newsreader.variable} ${manrope.variable}`}>
  <body>{children}</body>
</html>
```

```css
:root {
  --canvas: #0d0b0a;
  --surface: #171310;
  --surface-raised: #201a16;
  --ink: #f3eadf;
  --ink-muted: #b9aa9a;
  --ember: #c76536;
  --ember-bright: #e07a43;
  --line: #3a3028;
  --danger: #d9675d;
  --success: #7f9b6d;
  --radius-sm: 8px;
  --radius-md: 14px;
  --page-max: 1440px;
}
```

Remove Google CSS `@import`, animated gold gradients and default glass-panel classes. Add visible `:focus-visible`, reduced-motion handling for new UI animations, and a `.desktop-frame` with a practical minimum layout width of 1180 px.

- [ ] **Step 4: Implement shell and primitives**

Components accept semantic props rather than arbitrary inline styles. `ScoreRing` displays a collective average and an accessible text label; it is CSS, not canvas or Three.js.

```ts
export interface ScoreRingProps {
  value: number | null;
  label: string;
  size?: 'small' | 'large';
}
```

- [ ] **Step 5: Update Portuguese metadata**

Title: `Crateristas | Livro de Registros`. Description: `Avaliações coletivas dos restaurantes visitados pelos Crateristas.` Do not mention gourmet exclusivity, database technology or deployment.

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- src/components/shell`

Expected: PASS.

```powershell
git add src/app/layout.tsx src/app/globals.css src/components/shell src/components/ui
git commit -m "feat: establish crater logbook design system"
```

### Task 8: Public records archive

**Files:**
- Create: `src/app/registros/page.tsx`
- Create: `src/app/registros/loading.tsx`
- Create: `src/app/registros/error.tsx`
- Create: `src/features/records/RecordFilters.tsx`
- Create: `src/features/records/RecordCard.tsx`
- Create: `src/features/records/RecordGrid.tsx`
- Create: `src/features/records/records.module.css`
- Create: `src/features/records/RecordCard.test.tsx`

**Interfaces:**
- Consumes: `listPublicVisits()`, current member session and shared shell.
- Produces: canonical public archive at `/registros`.

- [ ] **Step 1: Write failing record-card tests**

Assert the card shows restaurant, cuisine, neighborhood, collective overall, `6 de 8 crateristas contribuíram`, image alt text and link to `/restaurantes/<visit-slug>`. Assert it never renders deployment or database copy.

- [ ] **Step 2: Implement server page and URL filters**

Use `searchParams` for `busca`, `culinaria` and `bairro`. Sanitize and pass them to the repository; do not fetch the app's own API from a Server Component. Members may receive a separate private summary strip, but private visits never enter public card data.

```tsx
export default async function RecordsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = publicVisitFiltersSchema.parse(await searchParams);
  const records = await repository.listPublicVisits(filters);
  return <PublicShell><RecordFilters filters={filters} /><RecordGrid records={records} /></PublicShell>;
}
```

- [ ] **Step 3: Implement empty, loading and error states**

Use `Nenhum registro encontrado`, `Consultando o livro de registros...` and `Não foi possível abrir o livro agora.` with a retry action. Keep controls usable at 1280 px.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- src/features/records`

Expected: PASS.

```powershell
git add src/app/registros src/features/records
git commit -m "feat: build public restaurant archive"
```

### Task 9: Public restaurant review detail

**Files:**
- Create: `src/app/restaurantes/[slug]/page.tsx`
- Create: `src/app/restaurantes/[slug]/not-found.tsx`
- Create: `src/features/restaurant/PhotoGallery.tsx`
- Create: `src/features/restaurant/ScoreBreakdown.tsx`
- Create: `src/features/restaurant/CommentFragments.tsx`
- Create: `src/features/restaurant/restaurant.module.css`
- Create: `src/features/restaurant/CommentFragments.test.tsx`
- Create: `src/features/restaurant/ScoreBreakdown.test.tsx`

**Interfaces:**
- Consumes: `getPublicVisitBySlug()` and collective aggregate types.
- Produces: public evidence view without generated verdict or individual numeric scores.

- [ ] **Step 1: Write failing privacy and layout tests**

Render six comments and assert each shows avatar, member name and comment. Assert no member-level score label appears. Verify deterministic CSS slot classes `fragment--1` through `fragment--8` and fallback initials when avatar is absent.

- [ ] **Step 2: Implement score labels in pt-BR**

Map keys exactly to `Comida`, `Serviço`, `Ambiente`, `Custo-benefício`, `Acesso e localização`, `Tempo de espera`. Show one-decimal values and the real participation count.

- [ ] **Step 3: Implement deterministic comment composition**

Use a fixed desktop grid around the central score panel. Do not use random positions, physics or absolute coordinates that can collide. Keep DOM order equal to reading order.

```ts
export interface CommentFragment {
  memberId: string;
  displayName: string;
  avatarUrl: string | null;
  comment: string;
}

export function CommentFragments({ comments }: { comments: CommentFragment[] }): React.ReactNode;
```

- [ ] **Step 4: Implement server page and metadata**

Return `notFound()` for missing or non-public visits. Generate Portuguese title/description from restaurant, date and collective score without including private participation details beyond the count.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- src/features/restaurant`

Expected: PASS.

```powershell
git add src/app/restaurantes src/features/restaurant
git commit -m "feat: show collective restaurant reviews"
```

### Task 10: Public members directory and society fragments

**Files:**
- Create: `src/app/membros/page.tsx`
- Create: `src/features/members/MemberCard.tsx`
- Create: `src/features/members/MemberGrid.tsx`
- Create: `src/features/members/members.module.css`
- Create: `src/features/members/MemberCard.test.tsx`
- Create: `src/content/society.ts`
- Create: `src/components/society/SocietyFragment.tsx`
- Create: `src/components/society/SocietyMark.tsx`
- Create: `src/components/society/society.module.css`

**Interfaces:**
- Consumes: explicit public-member projection and current session.
- Produces: public directory and deterministic, optional easter-egg components.

- [ ] **Step 1: Write failing member privacy tests**

Assert cards show public fields and expand via a real button with `aria-expanded`. Assert e-mail, `auth_user_id`, role internals and numeric individual scores never render. A signed-in member sees `Suas avaliações pendentes`; a visitor does not.

- [ ] **Step 2: Create curated society content**

Export a fixed array of short pt-BR fragments with stable IDs. Keep every fragment under 140 characters and avoid instructions that sound like required actions.

```ts
export const SOCIETY_FRAGMENTS = [
  { id: 'arquivo-01', text: 'A cratera observa quem volta para uma segunda visita.' },
  { id: 'arquivo-02', text: 'Nem todo registro foi feito para explicar o buraco.' },
] as const;
```

- [ ] **Step 3: Implement the public page and expandable cards**

Use server data for member statistics. Expansion reveals bio, favorite cuisine or highest-rated restaurant and one optional society fragment. No separate profile route.

- [ ] **Step 4: Add restrained discovery points**

Use `SocietyMark` in the footer and entry numbers; reveal a fragment through focus/click, not hover-only. Do not store progress, play audio or alter permissions.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- src/features/members src/components/society`

Expected: PASS.

```powershell
git add src/app/membros src/features/members src/content src/components/society
git commit -m "feat: add public crateristas directory"
```

### Task 11: Login and private member dashboard

**Files:**
- Create: `src/app/entrar/page.tsx`
- Create: `src/features/auth/LoginForm.tsx`
- Create: `src/features/auth/LoginForm.test.tsx`
- Create: `src/features/auth/auth.module.css`
- Create: `src/app/painel/page.tsx`
- Create: `src/features/visits/PendingVisitList.tsx`
- Create: `src/features/visits/PendingVisitList.test.tsx`
- Create: `src/features/visits/PublicationStatus.tsx`
- Create: `src/features/visits/visits.module.css`

**Interfaces:**
- Consumes: Neon Auth, `requireMember()` and `listPendingVisitsForMember()`.
- Produces: closed login and member work queue.

- [ ] **Step 1: Write failing login tests**

Assert e-mail/password fields, `Entrar`, loading label `Entrando...`, generic invalid-credential error and absence of any signup link. Verify the password is never included in client logs or query strings.

- [ ] **Step 2: Implement login and logout actions**

Call `auth.signIn.email({ email, password })` on the server and redirect to `/painel` only on success. Add a server logout action using `auth.signOut()` and redirect to `/registros`.

```ts
'use server';

export async function loginAction(input: { email: string; password: string }) {
  const result = await auth.signIn.email(input);
  if (result.error) return { error: 'E-mail ou senha inválidos.' };
  redirect('/painel');
}
```

- [ ] **Step 3: Implement the private dashboard**

Show three sections: `Aguardando sua avaliação`, `Em formação` and `Publicadas recentemente`. Display real counts and admin actions only when `member.role === 'admin'`.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- src/features/auth src/features/visits/PendingVisitList.test.tsx`

Expected: PASS.

```powershell
git add src/app/entrar src/app/painel src/features/auth src/features/visits
git commit -m "feat: add member login and dashboard"
```

### Task 12: Create-visit, scorecard and admin publication forms

**Files:**
- Create: `src/app/visitas/nova/page.tsx`
- Create: `src/app/visitas/[id]/avaliar/page.tsx`
- Create: `src/features/visits/CreateVisitForm.tsx`
- Create: `src/features/visits/ScorecardForm.tsx`
- Create: `src/features/visits/PhotoUploader.tsx`
- Create: `src/features/visits/AdminPublicationControls.tsx`
- Create: `src/features/visits/ScorecardForm.test.tsx`
- Create: `src/features/visits/AdminPublicationControls.test.tsx`
- Replace: `src/app/api/parse-maps/route.ts`
- Create: `src/features/visits/google-maps-import.ts`
- Create: `src/features/visits/GoogleMapsImporter.tsx`

**Interfaces:**
- Consumes: Tasks 5-6 APIs and shared fields/buttons.
- Produces: complete authenticated contribution workflow.

- [ ] **Step 1: Write failing scorecard interaction tests**

Use `userEvent` to fill six numeric controls and a comment. Assert live character count `180 caracteres restantes`, client validation, saved success state, aggregate refresh and preservation of values after photo failure.

- [ ] **Step 2: Implement create-visit form**

Fields: restaurant name, cuisine, neighborhood, city, optional address, price band and visit date. On success redirect to `/visitas/<id>/avaliar`.

Preserve Google Maps import only as optional assisted filling inside this authenticated create-review workflow. Replace the legacy parser instead of reusing it: authenticate before reading the body; accept only HTTPS URLs on an exact allowlist of official Google Maps/share hosts; reject credentials, non-default ports and malformed/non-Maps paths; manually follow at most five redirects while revalidating every destination; use a timeout and a strict response-size ceiling; do not query fallback search engines; validate and return only the narrow editable restaurant fields. Never expose upstream HTML, URLs, stack traces or parser errors. The imported values are suggestions and every field remains editable before visit creation.

- [ ] **Step 3: Implement accessible score inputs**

Each 0-10 control includes visible label, current number, keyboard support and description. Do not use color as the only signal. Submit to the scorecard API and display returned participation/publication status.

```ts
export type ScorecardFormValues = ScoreValues & { comment: string };

await fetch(`/api/visits/${visitId}/scorecard`, {
  method: 'PUT',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(values),
});
```

- [ ] **Step 4: Integrate sequential photo uploads**

Compress before `upload()`, disable another upload while one is running, show 1-5 ordered previews and allow creator/admin deletion. Keep score/comment state independent from upload state.

- [ ] **Step 5: Implement admin confirmation controls**

`Publicar antecipadamente` opens a dialog displaying `<count> de 8 membros contribuíram` and `A média ainda é parcial.` Hide and republish require separate confirmation. Non-admin markup contains no control.

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- src/features/visits`

Expected: PASS.

```powershell
git add src/app/visitas src/features/visits
git commit -m "feat: complete collective review workflow"
```

### Task 13: Purge legacy rows, route cutover and prototype removal

**Files:**
- Create: `db/migrations/002_purge_legacy_reviews.sql`
- Modify: `src/app/page.tsx`
- Replace: `src/app/home/page.tsx`
- Replace: `src/app/add-restaurant/page.tsx`
- Replace: `src/app/restaurant/[id]/page.tsx`
- Delete: `src/app/api/reviews/route.ts`
- Preserve: the authenticated, constrained `src/app/api/parse-maps/route.ts` from Task 12
- Delete: `src/components/AddReviewModal.tsx`
- Delete: `src/components/Navbar.tsx`
- Modify: `crateristas_context.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: all new routes.
- Produces: compatibility redirects, an idempotent purge of old rows and no active fallback prototype.

- [ ] **Step 1: Write the idempotent legacy-row purge**

Create one guarded `DO $$` statement. If `to_regclass('reviews')` is null, succeed without changes; otherwise execute `DELETE FROM reviews` dynamically so PostgreSQL does not parse a missing relation. Do not drop the table and do not read or mutate any new-domain table. Running the statement twice removes zero additional rows on the second execution. Cover the source/migrator contract and keep a real PostgreSQL integration conditional on `TEST_DATABASE_URL`.

- [ ] **Step 2: Defer the external migration write**

Do not run `npm run db:migrate` during Task 13. It is an external write and remains deferred to Task 14, where a configured non-production `DATABASE_URL` must be verified before execution. Never use a placeholder or a production URL.

- [ ] **Step 3: Cut over the landing destination only**

In `src/app/page.tsx`, change only `router.push('/home')` to `router.push('/registros')`. Do not edit `GourmetScene.tsx` except for the pre-approved, demonstrably non-functional lint correction described in Global Constraints.

- [ ] **Step 4: Replace old pages with permanent redirects**

`/home` redirects to `/registros`, `/add-restaurant` to `/visitas/nova`, and `/restaurant/[id]` redirects to `/registros` because the old records were intentionally discarded. All three are Server Components using `permanentRedirect()`.

```ts
import { permanentRedirect } from 'next/navigation';

export default function LegacyHomePage(): never {
  permanentRedirect('/registros');
}
```

- [ ] **Step 5: Remove unused prototype code**

Delete the legacy API routes and components only after `rg` confirms no imports or fetches remain. Remove `localStorage`, mock review seeds, database setup panels and English deployment errors from active code. Preserve the authenticated, constrained Maps assistance in `/visitas/nova` and `/api/parse-maps`.

- [ ] **Step 6: Update project documentation**

Document new routes, environment variable names, migration command, closed account setup, Blob limits, Portuguese UI and the explicit Three.js boundary.

- [ ] **Step 7: Run regression checks and commit**

Run:

```powershell
rg -n "mock_reviews|localStorage|api/reviews|router.push\('/home'\)" src
rg -n "api/parse-maps" src --glob '!app/api/parse-maps/**' --glob '!features/visits/**'
npm test
npm run lint
npx tsc --noEmit
```

Expected: the first `rg` returns no matches; the second returns only the authenticated route/tests and Task-12 visit feature; tests, lint and types PASS.

```powershell
git add db src README.md crateristas_context.md
git commit -m "refactor: cut over to crater logbook"
```

### Task 14: Full verification and zero-cost deployment checklist

**Files:**
- Create: `docs/verification/crater-logbook-checklist.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: complete application.
- Produces: reproducible acceptance evidence and deployment guardrails.

- [ ] **Step 1: Run the complete automated suite**

Run:

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all commands exit 0. Record command, date and result in the checklist.

- [ ] **Step 2: Verify database rules on a test branch**

Create eight test members and one visit. Submit five scorecards and confirm no public row; submit the sixth and confirm publication; submit seventh/eighth and confirm recalculation; hide, edit a score, confirm it remains hidden; republish and confirm visibility.

- [ ] **Step 3: Verify authorization manually**

Check visitor, member and admin sessions. Attempt every mutation with the wrong role and record the observed 401/403 response. Inspect a public response and confirm it contains no e-mail, auth ID or individual numeric scores.

- [ ] **Step 4: Verify desktop layout**

Inspect `/registros`, one restaurant, `/membros`, `/entrar`, `/painel` and both visit forms at 1280x720, 1440x900, 1600x900 and 1920x1080. Record overflow, overlap, focus order, empty/loading/error states and comment-fragment readability.

- [ ] **Step 5: Verify the Three.js boundary**

Compare `git diff origin/main -- src/components/GourmetScene.tsx`; expected: no functional diff, with any textual change limited to the pre-approved lint-only correction in Global Constraints. Scroll the landing from top through redirect and confirm the camera path and animation remain unchanged while the destination becomes `/registros`.

- [ ] **Step 6: Verify free-tier safeguards**

Confirm Vercel Hobby, public Blob store, 1 GB storage alerting, five-photo UI/server limits, 750 KB upload token limit, Neon Free autoscaling/scale-to-zero and `.vercel.app` domain. Do not enable paid add-ons or on-demand spend.

- [ ] **Step 7: Commit verification documentation**

```powershell
git add docs/verification README.md
git commit -m "docs: record crater logbook verification"
```

## Plan Self-Review

- Spec sections 1-4 are covered by Global Constraints and Tasks 7-13.
- Public archive, restaurant detail and public members directory are covered by Tasks 8-10.
- Six scores, 180-character comments, privacy and quorum behavior are covered by Tasks 1, 3, 5 and 12.
- Admin early publication, hide and republish are covered by Tasks 1, 3, 5 and 12.
- Closed Neon Auth accounts and server-side authorization are covered by Tasks 4-5 and 11.
- Five-photo compression, Vercel Blob and free-tier protection are covered by Tasks 6, 12 and 14.
- Authorized legacy-row purge and route compatibility are covered by Task 13.
- Error handling and full verification are covered by Tasks 5, 12 and 14.
- The Three.js boundary is explicit globally and verified in Tasks 13-14.
- Type names are consistent: `ScoreValues`, `ReviewAggregate`, `PublicationState`, `PublicationReason`, `PublicationCommand`, `ReviewRepository` and `createReviewService()`.
