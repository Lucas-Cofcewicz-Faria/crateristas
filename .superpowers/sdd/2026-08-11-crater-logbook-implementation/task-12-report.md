# Relatório da Task 12 — Fluxo privado de avaliação coletiva

## Status

Implementação local concluída no escopo aprovado da Task 12. Um membro autenticado
pode criar uma visita manualmente em `/visitas/nova`, usar opcionalmente sugestões
editáveis de um link oficial do Google Maps, seguir para
`/visitas/<id>/avaliar`, editar sua própria ficha, enviar fotos sequencialmente e,
quando a permissão derivada no servidor autoriza, excluir fotos. Somente admin recebe
controles confirmáveis de publicação.

O parser legado de Maps foi substituído por uma rota privada com policy server-only,
sem fallback de busca. A projeção privada adicionada ao repository contém apenas o
cabeçalho da visita, contagens/estado coletivos, ficha do membro atual, fotos públicas
ordenadas e ID do criador.

## Arquivos e limites

- `src/app/visitas/nova/*`: Server Component autenticado, loading/error pt-BR e
  formulário de criação.
- `src/app/visitas/[id]/avaliar/*`: Server Component autenticado, loading/error e
  composição das ilhas de score, foto e administração.
- `src/features/visits/CreateVisitForm.tsx` e `visit-api.ts`: estado controlado,
  clientes das APIs existentes e navegação para a avaliação criada.
- `GoogleMapsImporter.tsx`, `google-maps-types.ts` e `google-maps-import.ts`:
  sugestões opcionais/editáveis, tipo compartilhado sem capacidade e parser/policy
  explicitamente `server-only`.
- `ScorecardForm.tsx`: seis sliders nativos 0–10, descrição, valor visível, teclado,
  comentário obrigatório de 180 caracteres e retorno coletivo da API.
- `PhotoUploader.tsx`: previews ordenados com `next/image`, compressão WebP,
  assinatura real de `@vercel/blob/client`, fila sequencial e delete por ID do loader.
- `AdminPublicationControls.tsx`: affordance por estado e diálogos nativos separados,
  com confirmação única e estado retornado pelo servidor.
- `review-workflow.module.css`: estilos sólidos e separáveis para iteração desktop.
- `repository.ts`, `neon-review-repository.ts` e testes: uma única projeção privada
  nova, sem alterar agregação, quórum ou transições.
- `src/app/api/parse-maps/route.ts`: factory com dependências injetadas, auth antes do
  body e allowlist de resposta.
- `vitest.config.ts`, `src/test/server-only.ts` e declaração de tipo: o marcador
  `server-only` continua efetivo no build Next e recebe somente um stub vazio no
  ambiente unitário Vitest.
- O ajuste deliberado já presente no plano da Task 12 foi preservado. Landing,
  `/home`, `GourmetScene.tsx`, Three.js e animações não foram modificados. A Task 13
  não foi antecipada.

## Decisões de integração e segurança

- As duas páginas aguardam `requireMember()` antes de obter o repository ou ler a
  projeção. `isAdmin` e `canManage` são derivados do `MemberRecord`/criador no Server
  Component; o cliente não recebe e-mail, auth ID, senha ou sessão.
- O SQL faz `LEFT JOIN scorecards own ... AND own.member_id = $2`; nenhuma nota
  numérica de outro membro é selecionada ou mapeada. A contagem usa uma lateral
  coletiva e as fotos são agregadas com `ORDER BY p.position`.
- Criação, scorecard, publicação e fotos reutilizam, respectivamente, as APIs
  `POST /api/visits`, `PUT .../scorecard`, `PATCH .../publication` e o handshake
  Blob/`DELETE .../photos` existentes. Nenhuma regra de negócio foi duplicada.
- A assinatura instalada foi confirmada como
  `upload(pathname, body, { access, handleUploadUrl, clientPayload?, headers?,
  contentType?, multipart?, abortSignal?, onUploadProgress? })`. A implementação
  envia um arquivo por vez, com `access: 'public'`, `contentType: 'image/webp'` e o
  endpoint existente; não inventa ID ou metadado privado após o retorno do Blob.
- O parser aceita somente HTTPS sem credencial, porta, fragmento ou input
  protocol-relative. Hosts e caminhos oficiais são comparados exatamente, inclusive
  variantes `.com.br`, `goo.gl/maps`, `maps.app.goo.gl` e `share.google` apenas como
  salto validado. Lookalikes, subdomínios extras, IP/localhost e caminhos Google que
  não são Maps são rejeitados antes do primeiro fetch.
- Redirects 301/302/303/307/308 são manuais, relativos são resolvidos com segurança,
  cada destino é revalidado e no máximo cinco redirects são seguidos. Location
  ausente/inválido/excedente falha sem novo fetch inseguro.
- Cada request upstream usa `AbortController` com cinco segundos e somente
  `User-Agent` fixo/`Accept-Language: pt-BR`. Cookies, Authorization e Referer não são
  encaminhados. `content-length` excessivo cancela antes da leitura; o stream também
  é contado e cancelado assim que passa de 1 MB.
- Não existe DuckDuckGo nem fallback de rede. A extração lê somente URL Maps final e
  OG title/description limitados, decodifica uma lista pequena de entidades, remove
  markup/controles e valida os máximos com Zod.
- A rota aguarda `requireMember()` antes de `request.json()` e, portanto, antes do
  import/fetch. A resposta é novamente reduzida para
  `{ name?, cuisine?, neighborhood?, city?, address? }`; não inclui URL, HTML,
  imagem, status/body upstream, stack ou erro interno. Respostas de erro são genéricas
  em pt-BR.
- Fotos usam a policy/compressão existente, no máximo cinco posições e somente IDs
  recebidos do loader. Falha de foto afeta apenas seu feedback e não reinicializa
  notas/comentário.
- Admin privado sem contribuição não recebe ação. Cada estado mostra apenas
  `publish_early`, `hide` ou `republish` correspondente; cancelar faz zero requests,
  pending impede duplicata, falha preserva diálogo/estado e sucesso reflete apenas o
  estado devolvido pelo servidor.

## TDD

### Grupo 1 — loader, página e projeção privada

```text
npm test -- src/app/visitas/[id]/avaliar/page.test.tsx src/lib/repositories/neon-review-workspace.test.ts src/domain/reviews/service.test.ts
RED: página e método getVisitReviewWorkspace ainda inexistentes.
GREEN: 3 arquivos; 21 testes.
```

Os testes exigiram autorização antes do repository, not-found fora de catch, SQL
parametrizado pelo membro e ausência de scores/e-mail/auth ID de terceiros.

### Grupo 2 — criação manual

```text
npm test -- src/features/visits/CreateVisitForm.test.tsx src/app/visitas/nova/page.test.tsx
RED: página, formulário e client API ainda inexistentes.
GREEN: 2 arquivos; 5 testes.
```

Uma comparação intermediária dependia da ordem das chaves do JSON; o teste passou a
comparar o corpo parseado, sem mudança de produção.

### Grupo 3 — Maps policy, rota e UI

```text
npm test -- src/features/visits/google-maps-import.test.ts src/app/api/parse-maps/route.test.ts src/features/visits/GoogleMapsImporter.test.tsx src/features/visits/CreateVisitForm.test.tsx
RED: parser seguro, route factory e importador autenticado ainda inexistentes.
GREEN: 4 arquivos; 37 testes.
```

A matriz cobre rejeição de host/path/protocolo/credenciais/porta/fragmento,
revalidação de redirects, limite de cinco, Location ausente, timeout, limite declarado
e por stream, headers fixos, zero fallback, allowlist de saída, erros genéricos e
auth antes de body/import. Os testes usam fetch falso e `ReadableStream`; nenhuma rede
real é aberta.

Durante o GREEN, o teste da rota deixou de importar a classe de auth real, que
carregava Neon/`next/headers` no bootstrap, e passou a usar um erro nomeado local. Um
stream pode fazer prefetch de chunk no JSDOM; a asserção preserva o ponto essencial:
cancelamento imediato ao exceder o teto.

Na auto-revisão, uma sugestão conhecida contendo markup foi injetada depois do
parser para exercitar a defesa na própria fronteira HTTP:

```text
npm test -- src/app/api/parse-maps/route.test.ts
RED: 1 arquivo; 1 falha de 7 — a chave era permitida, mas o texto ainda continha HTML.

npm test -- src/app/api/parse-maps/route.test.ts src/features/visits/google-maps-import.test.ts
GREEN: 2 arquivos; 33 testes.
```

A transformação Zod usada também pela rota agora aplica a mesma limpeza conservadora
a todo campo conhecido, mantendo a allowlist de chaves e conteúdo.

### Grupo 4 — scorecard acessível

```text
npm test -- src/features/visits/ScorecardForm.test.tsx src/app/visitas/[id]/avaliar/page.test.tsx
RED: ScorecardForm inexistente e página sem os seis sliders.
GREEN: 2 arquivos; 7 testes.
```

O JSDOM não aplica sozinho o comportamento padrão de todas as teclas do range; o
controle recebeu handler explícito para setas/Home/End com `preventDefault`,
preservando também o input nativo. `noValidate` permite mostrar a mensagem Zod
pt-BR, enquanto `required` continua presente para semântica.

### Grupo 5 — fotos sequenciais e isolamento

```text
npm test -- src/features/visits/PhotoUploader.test.tsx src/app/visitas/[id]/avaliar/page.test.tsx
RED: PhotoUploader inexistente e página sem seletor/permission props.
GREEN: 2 arquivos; 7 testes.
```

O harness da página precisou somente do mock de `useRouter().refresh()` exigido pela
ilha real. O teste prova que o segundo upload só inicia depois da resolução do
primeiro, que delete usa o ID do loader e que falha de compressão não altera a ficha.

A auto-revisão acrescentou uma falha real no segundo item da fila:

```text
npm test -- src/features/visits/PhotoUploader.test.tsx
RED: 1 arquivo; 1 falha de 5 — upload confirmado não disparava reconciliação quando o segundo falhava.

npm test -- src/features/visits/PhotoUploader.test.tsx src/app/visitas/[id]/avaliar/page.test.tsx
GREEN: 2 arquivos; 9 testes.
```

O uploader remove cada item da fila somente depois da confirmação do Blob e chama o
refresh também em sucesso parcial; o item com falha continua selecionado para retry.

### Grupo 6 — confirmação administrativa

```text
npm test -- src/features/visits/AdminPublicationControls.test.tsx src/app/visitas/[id]/avaliar/page.test.tsx
RED: módulo administrativo inexistente e página admin sem comando/contagem/fluxo de falha.
GREEN: 2 arquivos; 10 testes.
```

Um reforço acessível foi escrito antes da implementação final:

```text
npm test -- src/features/visits/AdminPublicationControls.test.tsx
RED: 1 arquivo; 2 falhas de 7 — diálogo sem aria-describedby e singular 1/8 incorreto.

npm test -- src/features/visits/AdminPublicationControls.test.tsx src/app/visitas/[id]/avaliar/page.test.tsx
GREEN: 2 arquivos; 11 testes.
```

Além das três ações/estados, os testes cobrem ausência total para não-admin, visita
privada sem ficha, texto parcial, flexão singular, cancel sem fetch, request único,
botão desabilitado e falha genérica sem mudança de estado.

## Auto-revisão React e Next.js

- `/visitas/nova` e `/visitas/[id]/avaliar` são Server Components pequenos; somente
  forms/interações e error boundaries têm `use client`. Não há API interna chamada
  pelo loader nem redirect do Next capturado em `catch`.
- A página nova renderiza `CreateVisitForm`, que compõe `GoogleMapsImporter`. A página
  de avaliação renderiza realmente os quatro módulos com props derivadas no servidor:
  `PublicationStatus`, `ScorecardForm`, `PhotoUploader` e
  `AdminPublicationControls`. Testes de página exercitam essa composição, inclusive
  papel admin, score próprio e permissão de foto.
- Props cliente são strings, números, booleanos, objetos/arrays literais e `null`.
  Repository, sessão, classes de erro e funções server-only não cruzam a fronteira.
- O módulo `google-maps-import.ts` começa com `import 'server-only'`. Os clients
  importam apenas `google-maps-types.ts`; busca textual confirma que o parser aparece
  somente na rota e nos testes, portanto não entra no grafo cliente.
- O Next 16 resolve `server-only` internamente e documenta que o conteúdo do pacote
  npm não é usado; por isso não foi adicionada dependência de runtime. Vitest não
  implementa esse marker virtual ao carregar diretamente o módulo puro em unit tests:
  o alias para `src/test/server-only.ts` vale apenas no runner, e a declaração local
  satisfaz o typecheck. O build Next passou usando o marcador real, sem alias e sem
  dependência explícita, confirmando a fronteira.
- A fila de fotos deriva a lista ordenada diretamente das props do loader e de IDs
  removidos localmente; não há effect para espelhar props. Uploads continuam
  serializados com `await` no loop, e o refresh reconcilia itens confirmados no
  servidor.
- Não há `<img>` nos arquivos da Task 12. Previews usam `next/image`, com key estável,
  alt posicional, dimensões e `sizes`; nenhuma URL/Blob privado é fabricado.
- Não há memoização, contexto ou biblioteca de formulário prematuros. Estado de
  criação, score, foto e administração fica em ilhas separadas. CSS Module mantém
  layout/apresentação fora dos loaders/actions/clients.
- Labels visíveis, descrições, outputs, `aria-live`, status/alert, botões nativos e
  `<dialog>` nomeado/descrito preservam teclado e leitores de tela. Cor nunca é o
  único sinal.

## Verificação

```text
npm test -- src/features/visits src/app/visitas src/app/api/parse-maps src/lib/repositories/neon-review-workspace.test.ts
PASS: 15 arquivos; 97 testes.

npm test
PASS: 51 arquivos; 337 testes; 18 integrações condicionais ignoradas.

npx tsc --noEmit
PASS.

npx eslint src/app/api/parse-maps src/app/visitas src/features/visits src/domain/reviews/repository.ts src/domain/reviews/service.test.ts src/lib/repositories/neon-review-repository.ts src/lib/repositories/neon-review-workspace.test.ts src/test/server-only.ts src/types/server-only.d.ts vitest.config.ts
PASS.

npm run build
PASS: compilação, TypeScript e 12 páginas estáticas; as duas rotas de visita e a API
Maps foram classificadas como dinâmicas e o build não exigiu credenciais.

git diff --check 736cdf3a037a5570d14b1367b241d54a4b0841b3..HEAD
PASS.
```

## Limitações externas

- As 18 integrações de repository continuam condicionais e foram ignoradas porque
  `TEST_DATABASE_URL` não está configurada. O boundary SQL novo é exercitado sempre
  por client falso, incluindo parâmetros, mapeamento estreito e ordenação.
- Nenhuma operação real do Blob foi feita porque `BLOB_READ_WRITE_TOKEN` não está
  configurado; testes simulam a assinatura instalada e provam sequenciamento. A
  verificação externa permanece para a Task 14, como nos contratos anteriores.
- Nenhum fetch real ao Google foi executado por decisão de segurança e
  determinismo. URL policy, redirects, timeout e streams são exercitados com fakes.
- Permanece o warning preexistente do Vitest sobre o futuro config loader nativo em
  projeto CommonJS e o warning do Turbopack sobre os dois lockfiles do worktree.
