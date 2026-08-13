# Relatório da Task 11 — Login e painel privado dos membros

## Status

Implementação local concluída no escopo da Task 11. `/entrar` oferece somente login
por e-mail e senha via Server Action; o shell de membro encerra a sessão real antes
de voltar a `/registros`; e `/painel` autoriza o membro no servidor antes de consultar
as filas reais de avaliações pendentes, visitas privadas em formação e publicações
recentes.

Após a revisão independente Round 1, a seção recente usa uma projeção SQL dedicada,
estreita e limitada antes de retornar ao painel; o loading preserva o shell de
membro; as contagens flexionam `avaliação`; e o canário de segredo cobre todos os
métodos usuais de `console`.

## Arquivos

- `src/app/entrar/page.tsx` e teste: página pública de visitante, sem preflight de
  sessão, cadastro, magic link ou login social.
- `src/features/auth/LoginForm.tsx`, `auth-state.ts`, `auth.module.css` e testes:
  ilha cliente mínima com `useActionState`, campos acessíveis, pending e erro
  genérico serializável.
- `src/features/auth/actions.ts` e teste: validação do `FormData`, login Neon, logout
  Neon e redirects fora dos blocos `catch`.
- `src/components/shell/AppHeader.tsx`, `PublicShell.tsx` e teste afetado: contrato
  estreito `signOutAction` com Server Action real como default para todo shell de
  membro; removido o POST direto para `/api/auth/sign-out`.
- `src/app/painel/page.tsx`, `loading.tsx`, `error.tsx` e testes: autorização
  server-side antes das leituras, consultas paralelas, projeção recente limitada,
  loading com shell de membro e error boundary cliente com `reset()`.
- `src/features/visits/PendingVisitList.tsx`, `PublicationStatus.tsx`,
  `DashboardView.tsx`, `visit-formatters.ts`, `visits.module.css` e testes:
  apresentação modular das três seções, contagens, vazios, status e links reais.
- `src/domain/reviews/repository.ts`, `src/lib/repositories/neon-review-repository.ts`
  e testes: read models mínimos `listVisitsInFormationForMember(memberId)` e
  `listRecentPublishedVisits(limit)`.
- `src/domain/reviews/service.test.ts`: double em memória atualizado para satisfazer
  a extensão do contrato, sem mudar o serviço nem a lógica de publicação.

## Decisões de integração

- A assinatura instalada do Neon Auth foi verificada no pacote
  `@neondatabase/auth@0.5.0-beta`: `auth.signIn.email({ email, password })` e
  `auth.signOut()` fazem POST e retornam `{ data, error }`. O código trata tanto
  `result.error` quanto exceção.
- `loginAction(previousState, formData)` valida tipos, formato do e-mail e senha não
  vazia no servidor antes do SDK. O e-mail é aparado e convertido para minúsculas;
  a senha é passada exatamente como recebida.
- Validação, credencial inválida, configuração ausente e falha operacional resultam
  apenas em `E-mail ou senha inválidos.`. O estado devolvido contém somente
  `{ error }`; não há password em query string, URL, log, storage ou mensagem.
- Os redirects `/painel` e `/registros` ficam depois do `try/catch`. Assim o sentinel
  interno do Next não é capturado. Logout com retorno/throw de erro não redireciona.
- O auth facade é importado dinamicamente dentro das ações. O primeiro GREEN mostrou
  que importar o SDK transitivamente pelo header fazia páginas públicas que apenas
  importavam o shell carregar `next/headers` no bootstrap do Vitest. O limite tardio
  preserva o default real do shell e mantém imports/build sem ambiente.
- `/entrar` não consulta sessão antecipadamente. O redirect de membro já autenticado
  era opcional e exigiria distinguir o comportamento tolerante de
  `findOptionalMember()`; foi omitido por YAGNI, sem alterar `access.ts`.
- `/painel` chama e aguarda `requireMember()` antes de instanciar o repository e
  iniciar qualquer query. Somente depois inicia, no mesmo `Promise.all`, pending,
  formação e a projeção recente limitada a seis linhas. Não há API própria nem
  fetch cliente.
- `listPendingVisitsForMember()` foi preservado: representa todas as visitas sem
  score do membro e não ganhou filtro de publicação. Portanto uma visita privada,
  publicada ou oculta ainda pode aparecer se estiver sem essa contribuição, de
  acordo com o contrato existente.
- `listVisitsInFormationForMember(memberId)` é a única extensão de repository. Ela
  seleciona exclusivamente `publication_state = 'private'`, exige
  `COUNT(scorecards) < quorum`, calcula `hasSubmitted` com
  `COALESCE(BOOL_OR(...), FALSE)` e ordena por `visited_at DESC, id`. Não usa
  `NOT EXISTS`, não inclui publicada/oculta e não muda score/publicação.
- As duas primeiras filas podem conter a mesma visita por razões semânticas reais:
  uma visita privada abaixo do quórum também pode aguardar o score do membro. Não há
  duplicação fabricada nem reaproveitamento de cards públicos como dados privados.
- `listRecentPublishedVisits(limit)` retorna somente `id`, `slug`, nome do
  restaurante, datas de visita/publicação e contagem de participantes. O SQL filtra
  `publication_state = 'published'`, ordena por
  `published_at DESC NULLS LAST, id` e aplica `LIMIT $1`; não calcula médias,
  overall ou capa. A página chama exatamente essa leitura com `6`, sem `slice`.
- A integração real desse read model coube no harness existente: fixtures próprias,
  datas de publicação iguais para provar o desempate por `id`, limite dois e cleanup.
  Ela é condicional a `TEST_DATABASE_URL`, como os demais testes de banco.
- `PendingVisitList` recebe apenas campos locais e primitivos. Ele não é client, não
  conhece Neon nem `MemberRecord`, e aponta para `/visitas/<id>/avaliar`.
  `PublicationStatus` centraliza as labels e tones dos três estados.
- `Nova visita` é ação de membro, coerente com o fluxo real existente que usa
  `requireMember()` para criar visita. A UI aponta para `/visitas/nova`, cujo
  formulário pertence à Task 12 e não foi antecipado aqui.
- Nenhum controle administrativo foi criado: publicar/ocultar/administrar ainda não
  tem fluxo de página nesta task. O papel admin é identificado somente para preparar
  a composição futura, e testes provam que membros comuns não recebem markup admin
  nem botões mortos.
- CSS é por feature, com superfícies sólidas e composição desktop. Não há inline
  style, glass, blur ou gradiente.

## TDD

### RED — login UI e action

Os testes foram escritos antes de `LoginForm`, `actions` e `auth-state`.

```text
npm test -- src/features/auth/LoginForm.test.tsx src/features/auth/actions.test.ts
FAIL: 2 arquivos; nenhum teste carregado.
- import de ./LoginForm inexistente;
- import de ./actions inexistente.
```

Quebras cobertas: campos/autocomplete incorretos, signup/social exposto, pending
ausente, password em URL/log/estado, FormData inválido chegando ao Neon, normalização
da senha, erro técnico vazando e redirect antes de login aceito.

### GREEN — login

```text
npm test -- src/features/auth/LoginForm.test.tsx src/features/auth/actions.test.ts
PASS: 2 arquivos; 9 testes.
```

### RED — logout e shell

O logout foi removido do primeiro incremento e testado separadamente antes de voltar
à produção.

```text
npm test -- src/features/auth/actions.test.ts src/components/shell/AppHeader.test.tsx
FAIL: 5 de 13 testes.
- logoutAction inexistente em três casos;
- AppHeader ignorava signOutAction e continuava com /api/auth/sign-out.
```

### GREEN — logout e shell

```text
npm test -- src/features/auth/actions.test.ts src/components/shell/AppHeader.test.tsx
PASS: 2 arquivos; 13 testes.
```

### RED — painel, apresentação e read model

```text
npm test -- src/features/visits/PendingVisitList.test.tsx src/features/visits/DashboardView.test.tsx src/app/painel/page.test.tsx src/app/entrar/page.test.tsx src/lib/repositories/neon-review-repository.integration.test.ts
FAIL: 5 arquivos.
- quatro módulos/páginas ainda inexistentes;
- listVisitsInFormationForMember não era função;
- 18 testes existentes do adapter passaram e 17 integrações sem env foram ignoradas.
```

Quebras cobertas: cards sem quórum/status/link, vazios fabricando dados, headings ou
contagens erradas, UI admin vazando, query privada antes da autorização, leituras em
waterfall e SQL que use `NOT EXISTS`, aceite publicada/oculta ou não reflita a
contribuição do membro.

### GREEN — painel e repository

```text
npm test -- src/features/auth src/components/shell/AppHeader.test.tsx src/features/visits/PendingVisitList.test.tsx src/features/visits/DashboardView.test.tsx src/app/painel/page.test.tsx src/app/entrar/page.test.tsx src/lib/repositories/neon-review-repository.integration.test.ts
PASS: 8 arquivos; 42 testes; 17 integrações condicionais ignoradas.
```

Uma asserção intermediária aplicava `toHaveTextContent` ao objeto de queries de
`within()` em vez do elemento da seção. O teste foi corrigido; o produto não mudou.

### Regressão de imports públicos

Após o GREEN, o teste de páginas públicas reproduziu o carregamento transitivo do SDK:

```text
npm test -- src/app/registros/page.test.tsx src/app/membros/page.test.tsx src/app/restaurantes/[slug]/page.test.tsx
FAIL: 3 arquivos; @neondatabase/auth tentou importar next/headers no bootstrap.

npm test -- src/app/registros/page.test.tsx src/app/membros/page.test.tsx src/app/restaurantes/[slug]/page.test.tsx src/features/auth/actions.test.ts src/components/shell/AppHeader.test.tsx
PASS: 5 arquivos; 24 testes.
```

A única correção foi adiar o import do facade até a execução da ação.

### Round 1 — projeção recente limitada

```text
npm test -- src/app/painel/page.test.tsx src/lib/repositories/neon-review-repository.integration.test.ts
RED: 2 arquivos falharam; 2 falhas esperadas; 20 testes passaram; 18 ignorados.
- a página não chamava listRecentPublishedVisits(6);
- o adapter ainda não implementava o método.

npm test -- src/app/painel/page.test.tsx src/lib/repositories/neon-review-repository.integration.test.ts src/domain/reviews/service.test.ts
GREEN: 3 arquivos; 39 testes; 18 integrações condicionais ignoradas.
```

O boundary controlado prova o array de parâmetros `[6]`, o mapeamento dos seis
campos, o filtro publicado, `NULLS LAST`, desempate por `id`, `LIMIT $1` e ausência
de médias, overall e fotos. O teste de banco real foi adicionado, mas não executou
localmente por ausência de `TEST_DATABASE_URL`.

### Round 1 — loading e flexão

```text
npm test -- src/app/painel/loading.test.tsx
RED: 1 arquivo; 1 falha — loading mostrava Entrar em vez de Sair.
GREEN: 1 arquivo; 1 teste.

npm test -- src/features/visits/visit-formatters.test.ts src/features/visits/PendingVisitList.test.tsx src/features/visits/DashboardView.test.tsx
RED: 3 arquivos; 5 falhas; 2 testes passaram.
GREEN: 3 arquivos; 7 testes.
```

`formatEvaluationCount()` é o único ponto de flexão e cobre zero, singular e plural.
`PendingVisitList` flexiona o quórum; publicações recentes flexionam participantes.

### Round 1 — canário de segredo

O produto já não emitia logs, portanto o reforço de teste não teria um RED natural.
Foi feita uma mutação controlada e temporária que enviava a senha a `console.warn`:

```text
npm test -- src/features/auth/LoginForm.test.tsx
MUTATION RED: 1 falha; 2 testes passaram; o spy mostrou a senha em warn.

# mutação removida
npm test -- src/features/auth/LoginForm.test.tsx
GREEN: 1 arquivo; 3 testes.
```

O canário final observa `console.log`, `error`, `warn`, `info` e `debug`, além de URL,
DOM e estado visível.

## Auto-revisão React e Next.js

- `LoginForm` é a única ilha cliente da feature de login e usa somente
  `useActionState`. Não é async, não faz fetch, efeito, listener, storage ou log.
- Dashboard, listas, status, formatters, shell e páginas são Server Components. O
  outro boundary client é somente `painel/error.tsx`, como exigido pelo Next.
- Funções cruzando RSC são exclusivamente Server Actions. Dados do painel são
  strings, números, booleanos e arrays de objetos literais; nenhuma classe, `Date`,
  `Map`, `Set`, auth session ou repository passa ao cliente.
- Auth fica junto da mutação/leitura protegida. Proxy continua como filtro otimista,
  mas `requireMember()` é a barreira segura antes do banco privado.
- Reads independentes usam `Promise.all`; não há API interna, waterfall ou fetching
  cliente. A projeção recente é limitada no SQL e não faz consulta por card.
- Imports são diretos, CSS é modular, listas têm keys estáveis, condicionais usam
  ternários/retornos antecipados, e não há memo/effect desnecessário.
- Labels, autocomplete, `aria-live`, `role=status`, regiões nomeadas, contagens
  acessíveis, links e botões nativos preservam teclado e leitores de tela.
- Nenhum arquivo de landing, `/home`, `GourmetScene.tsx` ou Three.js foi tocado.

## Verificação

```text
npm test -- src/features/auth src/components/shell/AppHeader.test.tsx src/features/visits/PendingVisitList.test.tsx src/features/visits/DashboardView.test.tsx src/app/painel/page.test.tsx src/app/entrar/page.test.tsx src/lib/repositories/neon-review-repository.integration.test.ts
PASS: 8 arquivos; 42 testes; 17 integrações condicionais ignoradas.

npm test -- src/features/auth src/components/shell/AppHeader.test.tsx src/features/visits/PendingVisitList.test.tsx src/features/visits/DashboardView.test.tsx src/features/visits/visit-formatters.test.ts src/app/painel/page.test.tsx src/app/painel/loading.test.tsx src/app/entrar/page.test.tsx src/lib/repositories/neon-review-repository.integration.test.ts src/domain/reviews/service.test.ts
ROUND 1 PASS: 11 arquivos; 64 testes; 18 integrações condicionais ignoradas.

npm test
ROUND 1 PASS: 41 arquivos; 276 testes; 18 integrações condicionais ignoradas.

npx tsc --noEmit
PASS.

npx eslint src/app/entrar src/app/painel src/features/auth src/features/visits src/components/shell/AppHeader.tsx src/components/shell/AppHeader.test.tsx src/components/shell/PublicShell.tsx src/domain/reviews/repository.ts src/domain/reviews/service.test.ts src/lib/repositories/neon-review-repository.ts src/lib/repositories/neon-review-repository.integration.test.ts
PASS.

npm run build
PASS: compilação e TypeScript; 12 páginas estáticas geradas;
/painel classificada como dinâmica e /entrar compilada sem credenciais.

git diff --check 996c96c
TASK 11 PASS.

git diff --check 3e2fa62ea81998f149a189b10470e248274e51c1
ROUND 1 PASS.
```

## Concerns

- As 18 integrações condicionais do repository permanecem ignoradas porque
  `TEST_DATABASE_URL` não está presente. A nova integração real de recentes fica
  pronta no mesmo harness; o contrato SQL é exercitado sempre pelo client controlado,
  incluindo parâmetros, mapeamento, filtros, ordenação e limite.
- Permanece o warning preexistente do Vitest sobre o futuro loader nativo para
  `vitest.config.ts` em CommonJS.
- Permanece o warning preexistente do Turbopack sobre múltiplos lockfiles entre o
  repositório e o worktree.
- A semântica existente de pending inclui qualquer estado de publicação. Se o produto
  decidir que visitas ocultas deixam de aceitar contribuições, isso exige uma decisão
  conjunta no serviço/repository; não foi alterado silenciosamente nesta task.
- `/visitas/nova` e `/visitas/<id>/avaliar` são os destinos contratados para a Task
  12. Esta task entrega links reais, mas não antecipa os formulários.
