# Relatório da Task 10 — Diretório público dos Crateristas

## Status

Implementação local concluída no escopo da Task 10. A rota dinâmica `/membros`
apresenta até oito integrantes a partir da projeção pública existente, mantém a sessão
opcional no servidor e oferece a ação `Suas avaliações pendentes` somente a um membro
provisionado. Cards expansíveis e fragmentos discretos são determinísticos,
operáveis por teclado e não criam perfil individual, persistência ou permissões.

## Arquivos

- `src/app/membros/page.tsx`: Server Component dinâmico, consulta paralela de membros
  e sessão, shell público correto e ação condicional para `/painel`.
- `src/app/membros/page.test.tsx`: paralelismo, visitante, membro mapeado e
  campos-canário privados do `MemberRecord`.
- `src/app/membros/loading.tsx`, `error.tsx` e `route-states.test.tsx`: estados pt-BR
  de carregamento e retry do segmento público.
- `src/features/members/MemberGrid.tsx` e teste: adaptação server-side da projeção,
  vazio explícito, limite de oito e atribuição determinística.
- `src/features/members/MemberCard.tsx` e teste: única ilha cliente do card, expansão
  acessível, foto ou iniciais e view model pública estreita.
- `src/features/members/member-avatar.ts`: allowlist refatorável para avatar HTTPS do
  Vercel Blob público sob `/members/**`.
- `src/features/members/members.module.css`: composição desktop de quatro colunas,
  superfícies sólidas e estados do feature.
- `src/content/society.ts`: cinco fragmentos pt-BR fixos, IDs estáveis e função de
  atribuição por número do membro.
- `src/components/society/SocietyFragment.tsx`, `SocietyMark.tsx`, teste e CSS Module:
  marca textual, controle real e revelação por foco/clique.
- `src/components/shell/AppFooter.tsx` e `shell.module.css`: ponto discreto de
  descoberta no rodapé compartilhado, sem footer duplicado na página.
- `next.config.ts`: allowlist adicional e restrita do `next/image` para `/members/**`.

## Decisões de integração

- `MembersPage` obtém o repository pela fachada `getReviewRepository()` e inicia
  `listPublicMembers()` e `findOptionalMember()` juntos em `Promise.all`. Não existe
  API interna, fetch cliente ou leitura de ambiente no import.
- O segmento exporta `dynamic = 'force-dynamic'`. O build do Next 16 não reconhece a
  sessão do SDK Neon Auth como API de request e tentou pré-renderizar a consulta. A
  configuração impede banco durante build e preserva a leitura por request.
- Apenas o boolean derivado de `MemberRecord | null` chega ao shell. O objeto de
  sessão, incluindo `id`, `authUserId`, `email` e `role`, nunca é passado ao grid ou ao
  cliente. O teste de página usa canários reais e tipados para provar essa fronteira.
- `MemberGrid` é Server Component e reduz `PublicMemberSummary` a props primitivas ou
  objetos literais usados pelo card: foto já validada, nome, título, número, bio,
  culinária favorita, contagem de visitas públicas e fragmento. Nenhum tipo de
  repository é importado pelo `MemberCard` cliente.
- O contrato não oferece restaurante mais bem avaliado. A expansão usa
  `favoriteCuisine` quando presente e não dispara consulta adicional por integrante.
- A contribuição exibida é `contributions.publishedVisits`, uma contagem pública, sem
  nota, score individual ou scorecard completo. O diretório copia no máximo as oito
  primeiras entradas já ordenadas pelo repository.
- `getTrustedMemberAvatarUrl` aceita somente URL absoluta HTTPS, sem credenciais,
  porta, query ou fragmento, em subdomínio `*.public.blob.vercel-storage.com` e
  pathname dedicado `/members/**`. Qualquer outro valor vira `null` e o card mostra
  iniciais; `next/image` usa `128x128`, `sizes="128px"` e alt pt-BR.
- A policy de avatar está isolada em arquivo próprio. Em uma iteração posterior ela
  pode ser elevada para um módulo compartilhado e substituir o `unoptimized` de
  avatares da Task 9, sem refatorar aquela task agora.
- Os cinco fragmentos têm menos de 140 caracteres e incluem literalmente os dois
  exemplos do brief. `getSocietyFragmentForMember()` faz módulo pelo `memberNumber`,
  sem random, storage, áudio ou estado persistente.
- `SocietyFragment` revela uma nota estável tanto por foco quanto por clique. Seu
  gatilho é `<button>` com nome acessível, `aria-expanded` e `aria-controls`;
  `SocietyMark` também aparece junto ao número da entrada e no controle do rodapé.
- O card usa outro `<button>` real para expandir/recolher uma região nomeada. Não há
  link ou rota de perfil individual.
- Loading e error boundary são locais porque a consulta pública pode falhar e não há
  boundary compartilhado que forneça essa experiência pt-BR. O error boundary não
  exibe a mensagem recebida.

## TDD

### RED inicial — diretório, privacidade e sociedade

Os testes foram escritos antes da produção. O primeiro carregamento confirmou os
módulos ainda ausentes. Foram então criados stubs mínimos para obter falhas de DOM e
contrato, não apenas erros de import.

```text
npm test -- src/features/members src/components/society src/app/membros/page.test.tsx
FAIL: 4 arquivos; 16 falhas comportamentais, 2 passes.
- MemberCard sem heading, botão, painel ou iniciais;
- MemberGrid sem cards, vazio e política de avatar;
- página sem consultas paralelas ou ação de membro;
- conteúdo fixo ausente e fragmentos sem foco/clique/rodapé.
```

Quebras que os testes foram escritos para capturar:

- card que recebe um objeto amplo, omite campo público ou expõe dado de sessão;
- expansão sem botão, `aria-expanded`, `aria-controls` ou região associada;
- URL HTTP, host externo, pathname de visita ou URL com query chegando ao
  `next/image` em vez de cair para iniciais;
- consulta de membros e sessão em waterfall;
- visitante vendo `/painel`, ou membro provisionado sem a ação pendente;
- IDs duplicados, textos longos ou alteração dos dois fragmentos fundadores;
- seleção aleatória de fragmento para o mesmo `memberNumber`;
- descoberta dependente de hover, sem foco/clique ou sem nome acessível;
- rodapé sem a marca da sociedade.

### GREEN inicial

```text
npm test -- src/features/members src/components/society src/app/membros/page.test.tsx
PASS: 4 arquivos; 18 testes.
```

Uma consulta de Testing Library a uma região `hidden` não preservava o nome acessível
no algoritmo do teste. A asserção foi corrigida para localizar a região oculta e
validar seu `aria-label`; produto e requisito permaneceram iguais.

### Ciclos adicionais

Estados de rota tiveram stubs mínimos e falha DOM antes da implementação:

```text
npm test -- src/app/membros/route-states.test.tsx
FAIL: 2 testes — status de loading e heading/retry ausentes.

npm test -- src/app/membros/route-states.test.tsx
PASS: 1 arquivo; 2 testes.
```

A marca acessível junto ao número e o teto de oito entradas também tiveram RED/GREEN
isolados:

```text
npm test -- src/features/members/MemberCard.test.tsx
RED: 1 falha; marca acessível ausente.
GREEN: 1 arquivo; 3 testes.

npm test -- src/features/members/MemberGrid.test.tsx
RED: esperado 8 cards, recebido 9.
GREEN: 1 arquivo; 9 testes.
```

## Diagnóstico do build sem ambiente

O primeiro build depois do GREEN reproduziu uma falha de integração:

```text
npm run build
FAIL: Error occurred prerendering page "/membros".
Error: DATABASE_URL não configurada.
```

A cadeia foi rastreada até a análise estática do segmento: sem `cookies()`,
`headers()` ou outra API Next reconhecida, a rota era candidata a pré-render apesar
de consultar Neon e sessão em runtime. A hipótese foi testada com uma única mudança,
`dynamic = 'force-dynamic'` no segmento. O build seguinte passou sem `DATABASE_URL` e
classificou `/membros` como `ƒ Dynamic`.

## Auto-revisão React e Next.js

- A página, o grid, o shell e o rodapé permanecem Server Components. As fronteiras
  cliente se limitam a `MemberCard`, `SocietyFragment` e ao error boundary;
  `SocietyMark` entra apenas como folha leve dessas ilhas.
- A ilha do card possui apenas `useState` e `useId`; não é async e não faz fetch,
  efeito, listener global, storage ou acesso ao browser. O fragmento segue o mesmo
  recorte mínimo para sua interação.
- Operações independentes da página usam `Promise.all`; não existe waterfall nem API
  intermediária. A factory do repository continua dentro da execução da página.
- Props que cruzam RSC são serializáveis e estreitas. Não passam `Date`, função,
  classe, `Map`, `Set`, `MemberRecord` ou `PublicMemberSummary` ao cliente.
- Imagens remotas usam `next/image`, dimensões, `sizes`, alt pt-BR e policy idêntica à
  allowlist do config. Não existe `<img>` arbitrária ou `unoptimized` novo.
- Renderização condicional usa ternário ou retorno antecipado; contagem zero não gera
  conteúdo acidental. Listas usam `slug` estável e o limite de oito não muta a prop.
- Botões são nativos, painéis são associados, regiões têm nomes e o fluxo por Tab
  revela o fragmento. O conteúdo permanece oculto até a interação.
- CSS não usa inline style, glass, blur ou gradiente. O grid de quatro colunas cabe na
  moldura mínima de 1184 px aos 1280 px e comporta os oito cards em duas linhas.
- Não foram tocados landing, `/home`, `GourmetScene.tsx`, Three.js ou rotas Task 11+.

## Verificação

```text
npm test -- src/features/members src/components/society
PASS: 3 arquivos; 17 testes.

npm test -- src/app/membros src/components/shell
PASS: 3 arquivos; 7 testes.

npm test
PASS: 33 arquivos; 250 testes; 17 integrações condicionais ignoradas.

npx tsc --noEmit
PASS.

npx eslint src/app/membros src/features/members src/components/society src/components/shell/AppFooter.tsx next.config.ts
PASS.

npm run build
PASS: compilação, TypeScript e 11 páginas estáticas geradas;
/membros classificada como dinâmica.
```

## Concerns

- Permanece o warning preexistente do Vitest sobre o futuro loader nativo para
  `vitest.config.ts` em CommonJS.
- Permanece o warning preexistente do Turbopack sobre múltiplos lockfiles entre o
  repositório e o worktree.
- A policy nova cobre exclusivamente avatares de membros em `/members/**`. Os
  avatares de comentários da Task 9 continuam intocados; a extração compartilhada é
  uma refatoração futura explícita, não parte desta task.
