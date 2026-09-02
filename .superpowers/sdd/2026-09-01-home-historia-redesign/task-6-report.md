# Task 6 — Atualizar navegação pública e destino da descida

## RED

Antes da implementação, foi executado:

```powershell
npm test -- src/components/shell/AppHeader.test.tsx src/app/page.destination.test.tsx
```

Resultado: 3 falhas esperadas. A landing chamou `router.push('/registros')` quando o teste acionou scroll com `scrollY=1331` e `innerHeight=1000`; a marca apontava para `/`; e o rodapé não tinha o link História.

O teste de destino substitui a inspeção de código do brief. Ele renderiza `LandingPage`, usa uma fronteira inerte para `next/dynamic`, controla as propriedades de scroll do JSDOM e verifica a chamada real do handler de scroll ao router.

## GREEN

Foram feitas exclusivamente as alterações da Task 6:

- marca do cabeçalho para `/home`;
- História em `/historia` no cabeçalho e rodapé, sem Membros no cabeçalho;
- comentário adjacente e `router.push('/home')` em `src/app/page.tsx`;
- teste comportamental em `src/app/page.destination.test.tsx`.

Verificação executada:

```powershell
npm test -- src/components/shell/AppHeader.test.tsx src/app/page.destination.test.tsx src/components/crater-atmosphere.test.ts
npx tsc --noEmit
npx eslint src/app/page.tsx src/app/page.destination.test.tsx src/components/shell/AppHeader.tsx src/components/shell/AppHeader.test.tsx src/components/shell/AppFooter.tsx
git diff --check
graphify update .
```

Resultado: 3 arquivos de teste, 11 testes aprovados; typecheck, lint focado e `git diff --check` concluídos sem erros. O update do Graphify reconstruiu 1174 nós e 2259 arestas; `graphify-out/` permanece fora do commit.

O diff restrito confirmou `2 insertions, 2 deletions` em `src/app/page.tsx`, somente no comentário adjacente e no destino, e zero diff em `src/components/GourmetScene.tsx` e `src/components/crater-atmosphere.ts`.
