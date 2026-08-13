# Relatório da Task 11 — Login e painel privado dos membros

## Status

Implementação local concluída no escopo da Task 11. `/entrar` oferece somente login
por e-mail e senha via Server Action; o shell de membro encerra a sessão real antes
de voltar a `/registros`; e `/painel` autoriza o membro no servidor antes de consultar
as filas reais de avaliações pendentes, visitas privadas em formação e publicações
recentes.

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
- `src/app/painel/page.tsx` e teste: autorização server-side antes das leituras,
  consultas paralelas e adaptação para DTOs de apresentação.
- `src/app/painel/loading.tsx` e `error.tsx`: estados locais pt-BR e error boundary
  cliente com `reset()` sem revelar a exceção recebida.
- `src/features/visits/PendingVisitList.tsx`, `PublicationStatus.tsx`,
  `DashboardView.tsx`, `visit-formatters.ts`, `visits.module.css` e testes:
  apresentação modular das três seções, contagens, vazios, status e links reais.
- `src/domain/reviews/repository.ts`, `src/lib/repositories/neon-review-repository.ts`
  e teste: read model mínimo `listVisitsInFormationForMember(memberId)`.
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
  formação e publicações. Não há API própria nem fetch cliente.
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
- Publicações recentes reutilizam `listPublicVisits({})`, já ordenada por
  `published_at DESC, id`, e mostram as seis primeiras. A contagem é a quantidade
  realmente apresentada, não um total inventado.
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
  cliente. A lista pública é reutilizada sem consulta por card.
- Imports são diretos, CSS é modular, listas têm keys estáveis, condicionais usam
  ternários/retornos antecipados, e não há memo/effect desnecessário.
- Labels, autocomplete, `aria-live`, `role=status`, regiões nomeadas, contagens
  acessíveis, links e botões nativos preservam teclado e leitores de tela.
- Nenhum arquivo de landing, `/home`, `GourmetScene.tsx` ou Three.js foi tocado.

## Verificação

```text
npm test -- src/features/auth src/components/shell/AppHeader.test.tsx src/features/visits/PendingVisitList.test.tsx src/features/visits/DashboardView.test.tsx src/app/painel/page.test.tsx src/app/entrar/page.test.tsx src/lib/repositories/neon-review-repository.integration.test.ts
PASS: 8 arquivos; 42 testes; 17 integrações condicionais ignoradas.

npm test
PASS: 39 arquivos; 271 testes; 17 integrações condicionais ignoradas.

npx tsc --noEmit
PASS.

npx eslint src/app/entrar src/app/painel src/features/auth src/features/visits src/components/shell/AppHeader.tsx src/components/shell/AppHeader.test.tsx src/components/shell/PublicShell.tsx src/domain/reviews/repository.ts src/domain/reviews/service.test.ts src/lib/repositories/neon-review-repository.ts src/lib/repositories/neon-review-repository.integration.test.ts
PASS.

npm run build
PASS: compilação e TypeScript; 12 páginas estáticas geradas;
/painel classificada como dinâmica e /entrar compilada sem credenciais.

git diff --check 996c96c
PASS.
```

## Concerns

- As 17 integrações condicionais do repository permanecem ignoradas porque
  `TEST_DATABASE_URL` não está presente. O contrato SQL novo é exercitado com o
  client controlado, incluindo `hasSubmitted` true/false, filtros e ordenação.
- Permanece o warning preexistente do Vitest sobre o futuro loader nativo para
  `vitest.config.ts` em CommonJS.
- Permanece o warning preexistente do Turbopack sobre múltiplos lockfiles entre o
  repositório e o worktree.
- A semântica existente de pending inclui qualquer estado de publicação. Se o produto
  decidir que visitas ocultas deixam de aceitar contribuições, isso exige uma decisão
  conjunta no serviço/repository; não foi alterado silenciosamente nesta task.
- `/visitas/nova` e `/visitas/<id>/avaliar` são os destinos contratados para a Task
  12. Esta task entrega links reais, mas não antecipa os formulários.
