# Relatório da Task 9 — Detalhe público de uma visita

## Status

Implementação local concluída no escopo da Task 9. A rota dinâmica
`/restaurantes/[slug]`, já referenciada pelos cards do arquivo público, apresenta as
evidências publicadas de uma visita: restaurante, data, fotografias ordenadas, médias
coletivas, participação real e comentários públicos. A página não gera veredito e não
reconstitui notas individuais.

## Arquivos

- `src/app/restaurantes/[slug]/page.tsx`: Server Component, `params` assíncrono,
  metadata pt-BR, `notFound()` e adaptação do detalhe público para props visuais.
- `src/app/restaurantes/[slug]/data.ts`: leitura server-side deduplicada por request com
  `React.cache(slug)`, sem cache global de dados dinâmicos.
- `src/app/restaurantes/[slug]/not-found.tsx`: estado público indistinguível para slug
  inexistente, privado ou oculto.
- `src/app/restaurantes/[slug]/page.test.tsx`: integração de params, shell opcional,
  histórico, metadata e `notFound()`.
- `src/features/restaurant/RestaurantReview.tsx`: composição apresentacional com props
  públicas estreitas, sem conhecer Neon ou o repository.
- `src/features/restaurant/PhotoGallery.tsx` e teste: galeria ordenada, `next/image`,
  dimensões estáveis, alt pt-BR e placeholder sem imagem falsa.
- `src/features/restaurant/ScoreBreakdown.tsx` e teste: labels canônicos, uma casa
  decimal, participação real e lacunas históricas explícitas.
- `src/features/restaurant/CommentFragments.tsx` e teste: somente o allowlist público
  do comentário, avatar/iniciais e slots determinísticos de 1 a 8.
- `src/features/restaurant/restaurant-formatters.ts`: labels, formatação e seleção
  centralizadas do snapshot atual ou legado.
- `src/features/restaurant/restaurant.module.css`: livro escuro desktop, superfícies
  sólidas e composição em grid, sem glassmorphism, gradiente, física ou aleatoriedade.

## Decisões de integração

- Página e `generateMetadata()` aguardam `params: Promise<{ slug: string }>` e chamam
  diretamente `getPublicVisitBySlug()` por uma fachada server-side; não existe chamada
  à API da própria aplicação nem fronteira cliente.
- `getPublicVisitDetail` envolve a consulta de banco em `React.cache()` no módulo de
  dados. O argumento é o slug primitivo, permitindo a deduplicação segura entre
  metadata e página dentro do request, sem persistência entre requests. A fábrica do
  repository continua lazy e o import não depende de variáveis Neon.
- Depois de obter o slug, detalhe público e `findOptionalMember()` começam juntos em
  `Promise.all`. Auth ausente degrada para visitante pelo resolver já consolidado na
  Task 8; somente um `MemberRecord` provisionado ativa o shell de membro.
- `null` aciona `notFound()` na página e na metadata. O filtro de
  `publication_state = 'published'` permanece no SQL real; a rota não tenta consultar
  nem distinguir estados privados.
- A página reduz `PublicVisitDetail` a restaurante, data, participação, scores,
  fotografias e comentários antes da composição. Os componentes visuais não importam
  banco, Auth, service ou repository e não recebem IDs de visita, publication state ou
  payload legado.
- Para registros legados, a UI consome exatamente `HistoricalReview.scores` e
  `HistoricalReview.overall`. O mapper real já entrega `access` e `waitTime` como
  `null` quando ausentes e calcula `7,5` sobre `8, 6, 7, 9`; a UI mostra ambas as
  lacunas como `Não avaliado`, sem preencher valores e sem fabricar scorecard.
- Labels ficam centralizados como `Comida`, `Serviço`, `Ambiente`,
  `Custo-benefício`, `Acesso e localização` e `Tempo de espera`. Valores usam
  `Intl.NumberFormat('pt-BR')` com uma casa decimal; a participação exibida é sempre o
  `participantCount` recebido, incluindo zero histórico, e nunca presume seis.
- A metadata contém somente restaurante, data, overall coletivo e contagem de
  participantes. Comentários e nomes de membros não participam do título ou descrição.
- Fotos são copiadas e ordenadas por `position` antes da renderização, sem mutar a
  projeção. Elas usam `next/image`, dimensões intrínsecas `1200x800`, `sizes` e a
  allowlist Blob `/visits/**` existente. Avatares também usam `next/image`, com
  `44x44`; ficam `unoptimized` para não ampliar a allowlist restrita das fotografias.
- Comentários aceitam exclusivamente `memberId`, `displayName`, `avatarUrl` e
  `comment`. A lista mantém ordem do DOM igual à ordem de leitura. Slots CSS 1–8 se
  alternam pelas bordas da grade; o score coletivo ocupa o centro vazio, sem
  coordenadas absolutas ou detecção de colisão.

## TDD

### RED inicial observado antes do código de produção

```text
npm test -- src/features/restaurant src/app/restaurantes/[slug]/page.test.tsx
FAIL: 4 arquivos; nenhum teste carregado.
- Failed to resolve import "./CommentFragments".
- Failed to resolve import "./PhotoGallery".
- Failed to resolve import "./ScoreBreakdown".
- Failed to resolve import "./page".
```

As quatro falhas correspondiam às capacidades ainda ausentes. Os testes foram escritos
com fixtures manuais e DOM real. As únicas substituições ficam nas fronteiras externas
da integração da página: leitura do banco, sessão e o sinal de navegação de
`notFound()`; as asserções observam UI, metadata e rejeição da página, não a existência
dos mocks.

Quebras que os testes foram escritos para capturar:

- comentário omitido, reordenado, associado ao membro errado ou que revele score;
- slots aleatórios, ausentes ou sem as classes `fragment--1` a `fragment--8`;
- avatar ausente sem iniciais robustas para um nome ou whitespace;
- label incorreto, valor sem uma casa decimal ou contagem presumida;
- preenchimento artificial de `access`/`waitTime` ou overall legado calculado com
  categorias ausentes;
- mutação/reordenação incorreta da lista de fotografias ou ausência de alt/placeholder;
- página que não aguarde o slug, não degrade Auth, exponha veredito ou deixe de chamar
  `notFound()` para projeção pública nula;
- metadata que inclua comentário/nome individual ou omita dados coletivos permitidos.

### GREEN inicial

```text
npm test -- src/features/restaurant src/app/restaurantes/[slug]/page.test.tsx
PASS: 4 arquivos; 12 testes.
```

A primeira execução depois da produção encontrou uma consulta ambígua no teste de
comentários (`getByText(/./)` encontrava nome e comentário). A asserção redundante foi
removida; nenhuma expectativa de produto ou produção foi alterada.

### Mutation check dos oito slots

Com o teste explícito dos oito slots, a implementação foi temporariamente mutada de
`index % 8` para `index % 6`:

```text
npm test -- src/features/restaurant/CommentFragments.test.tsx
FAIL: 1; PASS: 2.
Recebido: slots 1, 2, 3, 4, 5, 6, 1, 2; esperados também 7 e 8.
```

Após restaurar o módulo 8:

```text
npm test -- src/features/restaurant
PASS: 3 arquivos; 7 testes.
```

## Auto-revisão React e Next.js

- Página e metadata permanecem Server Components; nenhum arquivo novo usa
  `'use client'`, hook, estado, efeito, listener ou fetch no navegador.
- A única dupla de operações independentes da página usa `Promise.all`; não há
  waterfall depois da resolução necessária do slug.
- `React.cache()` recebe string estável e envolve banco, caso em que o `fetch`
  memoization do Next não se aplica. Não há `use cache`, LRU ou cache global.
- Todos os objetos cruzam apenas fronteiras entre Server Components. Mesmo assim, a
  página passa somente campos usados para `RestaurantReview`; nenhum `MemberRecord`
  entra na UI além do boolean derivado do viewer.
- Componentes são pequenos e de responsabilidade única: data, adaptação/metadata,
  composição, galeria, scores e comentários estão separados. Não foi criada abstração
  genérica antecipada.
- Renderização condicional usa ternários ou retorno antecipado; contagem zero não vira
  conteúdo acidental. Elementos repetidos têm chaves estáveis do contrato.
- Imagens têm alt ou fallback textual, dimensões reservadas e `sizes`; headings,
  `<time>`, lista ordenada, `<figure>`, `<blockquote>`, `<dl>` e regiões nomeadas
  preservam semântica e navegação por leitor de tela.
- CSS do feature não usa inline styles de autoria, gradiente, blur ou glass. A única
  posição absoluta é a legenda visual da fotografia; os comentários e o painel
  central usam exclusivamente grid determinístico, sem colisão.
- A moldura útil mantém quatro colunas dentro dos 1184 px disponíveis a 1280 px; o
  centro reserva as duas colunas internas ao score e os comentários ocupam apenas as
  bordas. O escopo continua desktop-only conforme o brief.
- Landing, `/home`, `GourmetScene.tsx`, Three.js e `next.config.ts` permaneceram
  inalterados.

## Verificação

```text
npm test -- src/features/restaurant
PASS: 3 arquivos; 7 testes.

npm test
PASS: 26 arquivos; 225 testes; 17 integrações condicionais ignoradas.

npx tsc --noEmit
PASS.

npx eslint src/app/restaurantes src/features/restaurant
PASS.

npm run build
PASS: compilação, TypeScript e 11 páginas estáticas coletadas;
/restaurantes/[slug] classificada como dinâmica.
```

## Concerns

- Permanecem os warnings preexistentes: carregamento ESM do `vitest.config.ts` e root
  do Turbopack inferida por múltiplos lockfiles entre o repositório e o worktree.
- O contrato de avatar aceita URL pública sem restringir um hostname/pathname próprio.
  Para não alargar a allowlist de fotos da visita sem um requisito de armazenamento de
  avatar, o componente mantém esses avatares sem otimização; uma política dedicada de
  avatar pode ser definida em uma iteração futura.
