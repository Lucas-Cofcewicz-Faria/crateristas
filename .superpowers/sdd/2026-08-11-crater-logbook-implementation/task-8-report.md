# Relatório da Task 8 — Arquivo público de registros

## Status

Implementação local concluída no escopo da Task 8. A rota dinâmica `/registros` é o
primeiro destino público real após a landing e consome diretamente, no servidor, a
projeção `PublicVisitSummary` do repositório Neon existente.

## Arquivos

- `src/app/registros/page.tsx`: Server Component, filtros de URL, leitura paralela de
  registros públicos e sessão opcional, composição com `PublicShell`.
- `src/app/registros/loading.tsx`: estado `Consultando o livro de registros...`.
- `src/app/registros/error.tsx`: Client Component com a mensagem exigida e retry via
  `reset()`.
- `src/app/registros/page.test.tsx`: integração da página com parse de filtros, shell,
  sessão provisionada e estado vazio.
- `src/features/records/RecordFilters.tsx`: formulário GET progressivo com os campos
  `busca`, `culinaria` e `bairro`, além de ações explícitas de filtrar e limpar.
- `src/features/records/RecordCard.tsx`: card da projeção pública, nota coletiva,
  contribuição, foto otimizada ou placeholder e link canônico do detalhe.
- `src/features/records/RecordGrid.tsx`: grade de cards e estado vazio.
- `src/features/records/records.module.css`: composição desktop escura, sólida e
  utilizável a 1280 px, sem glassmorphism ou gradientes.
- `src/features/records/RecordCard.test.tsx`: contrato público e de privacidade do card.
- `src/lib/auth/access.ts` e teste: resolução opcional de membro sem usar exceção de
  autenticação como controle normal.
- `src/lib/reviews/server.ts`: fachada server-side mínima para obter o repositório.
- `next.config.ts`: allowlist estrita de imagens públicas do Vercel Blob.

## Decisões de integração

- `searchParams` permanece tipado como `Promise<Record<string, string | string[] |
  undefined>>` e é aguardado antes de `publicVisitFiltersSchema.parse()`; arrays,
  espaços, vazios e limites continuam sob o schema existente.
- A página chama `getReviewRepository().listPublicVisits(filters)` diretamente, sem
  round-trip para API própria. O SQL existente mantém a barreira
  `publication_state = 'published'`; nenhuma faixa privada foi antecipada.
- Após o parse, `listPublicVisits()` e `findOptionalMember()` começam juntos em
  `Promise.all`, pois são independentes.
- `findOptionalMember()` consulta a sessão Neon e retorna `null` tanto sem sessão
  quanto para Auth ainda não provisionado. Somente o `MemberRecord` encontrado muda o
  shell para `viewer="member"`; `requireMember()` e seus erros continuam reservados a
  rotas protegidas.
- A fachada Auth e a fábrica do repositório continuam lazy. O build sem variáveis Neon
  concluiu e classificou `/registros` como dinâmica, sem abrir conexão durante import
  ou geração estática.
- Fotos usam `next/image` com `fill` e `sizes`. A allowlist aceita somente HTTPS, um
  subdomínio de store em `*.public.blob.vercel-storage.com`, caminho `/visits/**`, sem
  porta, query ou redirects, coerente com o pathname validado pelo photo-policy.
- Ausência de foto produz placeholder textual/estrutural, sem imagem falsa.
- O cliente foi limitado a `error.tsx`; página, filtros, grid, card e loading continuam
  componentes de servidor/síncronos, sem hooks ou fetch no navegador.

## TDD

### RED observado antes do código de produção

```text
npm test -- src/features/records src/app/registros/page.test.tsx src/lib/auth/access.test.ts
FAIL: 3 arquivos falharam.
- RecordCard.test.tsx: Failed to resolve import "./RecordCard".
- page.test.tsx: Failed to resolve import "./page".
- access.test.ts: 3 falhas, `findOptionalMember is not a function`;
  os 5 testes anteriores de acesso permaneceram aprovados.
```

As falhas vieram da capacidade ausente, não de typo ou fixture. Os testes usam o card,
o shell e a página reais. Apenas Auth e repository — fronteiras externas de sessão e
banco — são substituídos na integração da página; as asserções observam UI renderizada,
filtros literais sanitizados e o estado do viewer, não a existência do mock.

Quebras que os testes foram escritos para capturar:

- card que omita restaurante, culinária, bairro, nota coletiva, contribuição, alt ou
  link canônico;
- card que introduza copy de deploy/banco ou uma imagem falsa no placeholder;
- página que deixe de aguardar/sanitizar filtros antes do repository;
- página que conceda UI de membro sem `MemberRecord` provisionado;
- grade que perca o estado vazio;
- resolver opcional que consulte membro sem sessão ou trate Auth não provisionado como
  membro.

### GREEN inicial

```text
npm test -- src/features/records src/app/registros/page.test.tsx src/lib/auth/access.test.ts
PASS: 3 arquivos aprovados; 13 testes aprovados.
```

### GREEN focado exigido

```text
npm test -- src/features/records
PASS: 1 arquivo aprovado; 2 testes aprovados.
```

## Auto-revisão

- `PublicVisitSummary` é a única entidade de visita aceita por `RecordCard`/`RecordGrid`;
  e-mail, IDs Auth, comentários individuais, payload legado e estado de publicação não
  atravessam a UI.
- A página usa somente `listPublicVisits`; o guard de publicação permanece no SQL do
  repositório real.
- Não há `fetch`, Server Action, chamada `/api`, waterfall, estado cliente, efeito,
  listener, import barrel ou pacote novo.
- Props que cruzam a única fronteira client (`error.tsx`) são apenas o callback `reset`
  fornecido pelo próprio error boundary; nenhum objeto de domínio é serializado.
- Formulário usa elementos nativos, labels associados, método GET e nomes canônicos;
  links e botões preservam foco e área de ação.
- `next/image` tem alt descritivo, contêiner dimensionado, `fill` e `sizes`; o hostname
  não é aberto e o otimizador aceita somente quality 75.
- Layout mantém duas colunas e uma linha de filtros dentro de 1184 px úteis a 1280,
  seguindo a moldura desktop mínima compartilhada.
- Não há gradiente, blur, canvas, Three.js, glassmorphism ou alterações em landing,
  `/home` e `GourmetScene.tsx`.

## Verificação

```text
npm test -- src/features/records
PASS: 1 arquivo; 2 testes.

npm test
PASS: 22 arquivos; 210 testes; 17 integrações condicionais ignoradas.

npx tsc --noEmit
PASS.

npx eslint src/app/registros src/features/records src/lib/auth/access.ts \
  src/lib/auth/access.test.ts src/lib/reviews/server.ts next.config.ts
PASS.

npm run build
PASS: compilação, TypeScript e 11 páginas; /registros classificada como dinâmica.

git diff --check 0a18385
PASS.
```

## Concerns

- Permanecem somente os warnings já conhecidos: config loader ESM do Vitest e root do
  Turbopack inferida por múltiplos lockfiles no worktree.
- Os cards já apontam para o contrato canônico `/restaurantes/<visit-slug>` exigido
  pelo brief; a página de detalhe correspondente pertence à Task 9 e ainda não faz
  parte deste commit.

## Fix Round 1 — arquivo público sem configuração Auth

### Validação do finding

O finding foi reproduzido contra as classes e o fluxo lazy reais. `auth.getSession()`
invoca `getNeonAuth()`, que chama `readNeonAuthConfig(process.env)` e lança
sincronamente `AuthConfigurationError` quando a configuração Neon Auth está ausente.
Como `findOptionalMember()` não distinguia esse caso, a rejeição entrava no
`Promise.all` de `/registros` e substituía o arquivo público pelo error boundary mesmo
quando a consulta pública ao banco podia funcionar.

### TDD

Antes do código de produção, a primeira tentativa de RED foi descartada: o mock parcial
carregou o SDK externo e o Vitest falhou ao resolver `next/headers`, portanto nenhum
comportamento da aplicação foi exercitado. A infraestrutura foi corrigida mockando
somente a fábrica externa `createNeonAuth`; `AuthConfigurationError` continuou sendo a
classe real exportada por `src/lib/auth/server.ts`.

RED válido observado:

```text
npm test -- src/lib/auth/access.test.ts src/app/registros/page.test.tsx
FAIL: 1 teste falhou; 12 passaram.
AssertionError: promise rejected "AuthConfigurationError: NEON_AUTH_BASE_URL..."
instead of resolving para null.
```

O mesmo comando já provou no RED que uma falha operacional genérica continuava sendo
propagada; somente o comportamento específico de configuração ausente falhou.

GREEN mínimo observado após o catch estreito:

```text
npm test -- src/lib/auth/access.test.ts src/app/registros/page.test.tsx
PASS: 2 arquivos; 13 testes.
```

### Implementação e auto-revisão

- `findOptionalMember()` envolve apenas `auth.getSession()` no `try/catch`.
- Somente `error instanceof AuthConfigurationError` retorna `null`; qualquer outra
  exceção é relançada, e erros do repository ficam fora do catch.
- `requireMember()` e `requireAdmin()` não foram alterados.
- A importação continua lazy: a classe de erro e a fachada não criam o cliente Auth no
  import, e o build sem env concluiu novamente.
- Nenhum TSX mudou. O checklist React confirmou que `/registros` continua Server
  Component, mantém repository/sessão em paralelo, não adiciona client boundary,
  hooks, fetch ou serialização de dados de membro.

### Verificação fresca

```text
npm test -- src/lib/auth/access.test.ts src/app/registros/page.test.tsx
PASS: 2 arquivos; 13 testes.

npm test
PASS: 22 arquivos; 212 testes; 17 integrações condicionais ignoradas.

npx tsc --noEmit
PASS.

npx eslint src/lib/auth/access.ts src/lib/auth/access.test.ts \
  src/app/registros/page.tsx src/app/registros/page.test.tsx
PASS.

npm run build
PASS: compilação, TypeScript e 11 páginas; /registros permanece dinâmica.

git diff --check 070b7bc
PASS.
```

Concerns do round: permanecem apenas os dois warnings conhecidos de Vitest/Turbopack;
nenhum warning novo foi introduzido.
