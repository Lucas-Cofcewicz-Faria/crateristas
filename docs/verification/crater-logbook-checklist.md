# Verificação do livro de registros dos Crateristas

Última atualização local: **25 de agosto de 2026**

Base verificada: `7fda4f0` (`develop`)

Estado: **migration e integração PostgreSQL verificadas; primeiro administrador provisionado; recuperação de senha, fronteira visitante/rotas privadas e infraestrutura Blob verificadas no Preview; fluxo autenticado completo, uploads reais e inspeção visual com reviews ainda pendentes**.

Este documento separa evidência observada de tarefas que ainda dependem de infraestrutura. Em 20/08/2026, as migrations foram verificadas na branch Neon não produtiva `development` e o mesmo esquema-base vazio foi aplicado à `main`, de onde a integração cria branches isoladas de Preview. A Vercel Production continua sem conexão com o banco; nenhuma conta, upload ou implantação de produção foi criada nesta rodada.

## 1. Gates automatizados locais

| Comando | Resultado observado em 20/08/2026 |
| --- | --- |
| `node --env-file=.env.local ./node_modules/vitest/vitest.mjs run` | PASS — 57 arquivos e 394 testes aprovados; zero skips de integração PostgreSQL |
| `npm run lint` | PASS — exit code 0; oito avisos preexistentes, sem erro |
| `npx next typegen` | PASS — tipos de rota regenerados após a remoção das rotas legadas |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS — build de produção gerado com a configuração local da branch de homologação |
| `git diff --check` | PASS |

O primeiro teste PostgreSQL real revelou que o fixture da corrida de fotos reutilizava `$1` como `uuid` e `text` sem casts explícitos. Após reproduzir o erro real, o fixture passou a tipar o parâmetro como `uuid` antes da conversão do pathname; a suíte focada fechou em 38/38 e a suíte completa em 394/394.

Rodada incremental em 25/08/2026, após a homologação da recuperação de senha e da autenticação dos pedidos de foto:

| Comando | Resultado observado em 25/08/2026 |
| --- | --- |
| `npm test` | PASS — 62 arquivos, 403 testes aprovados e 19 integrações condicionais ignoradas |
| `npm run lint` | PASS — zero erros; oito avisos preexistentes e restritos a `GourmetScene.tsx` |
| `npm run build` | PASS — compilação, TypeScript e geração das 14 páginas concluídas |
| `git diff --check` | PASS |

## 2. Navegação HTTP local

O servidor Next.js local respondeu aos seguintes smoke tests sem navegador:

| Caminho | Resultado |
| --- | --- |
| `/` | `200` |
| `/home` | `308` para `/registros` |
| `/add-restaurant` | `308` para `/visitas/nova` |
| `/restaurant/legacy-review` | `308` para `/registros` |
| `/registros` | `200`; shell em português carregado |
| `/membros` | `200`; shell em português carregado |
| `/entrar` | `200`; formulário em português carregado |
| `/painel` e formulários privados | Bloqueados sem Neon Auth, como esperado; não contam como homologação de autenticação |

As páginas públicas dependentes do banco alcançam seus limites de erro sem `DATABASE_URL`. Isso confirma o comportamento local de falha, mas não substitui o teste com dados reais.

No Preview da branch `develop`, `/`, `/registros`, `/membros` e `/entrar` responderam `200`; `/painel` e `/visitas/nova` responderam `307` para `/entrar` sem sessão. O HTML público de `/registros` e `/membros` não continha e-mail, Auth ID nem marcador de nota individual.

## 3. Banco de dados e regras coletivas — parcialmente verificado

Pré-requisito: configurar `DATABASE_URL` e `TEST_DATABASE_URL` com uma branch Neon **descartável e não produtiva**. Não colar credenciais no chat nem usar valores de exemplo.

- [x] Confirmar no console que as duas URLs apontam para a branch Neon `development`; validação local confirmou duas URLs Neon presentes e iguais sem exibir o segredo.
- [x] Executar `npm run db:migrate` somente após essa confirmação; `001_crater_logbook.sql` e `002_purge_legacy_reviews.sql` foram aplicadas e a segunda execução foi idempotente pelo ledger.
- [x] Confirmar em PostgreSQL real que `002_purge_legacy_reviews.sql` apaga somente as linhas de `reviews`, preserva a tabela e remove zero linhas adicionais no rerun.
- [x] Alinhar `DATABASE_URL` e Neon Auth do Git branch `develop` na branch Neon `preview/develop`; o override sensível da Vercel não altera `main` nem Production.
- [x] Provisionar a primeira conta real como Craterista nº 1 e `admin`, sem bio, foto ou título inventado; a branch ficou com um usuário Auth e um membro do domínio.
- [x] Criar exatamente oito membros de teste e uma visita em uma transação serializável descartável na branch `development`.
- [x] Enviar cinco fichas: a visita permaneceu privada e ausente das duas projeções públicas.
- [x] Enviar a sexta ficha: a visita foi publicada automaticamente por `quorum`, com um único evento para seis participantes.
- [x] Enviar a sétima e a oitava fichas: médias, nota geral, contagem e oito comentários foram recalculados pela projeção real do repositório.
- [x] Ocultar a visita, editar uma ficha e confirmar que ela continuou oculta e ausente das projeções públicas.
- [x] Republicar e confirmar que a projeção pública reapareceu com a média atualizada e comentários sem notas individuais.
- [x] Executar novamente a suíte com `TEST_DATABASE_URL`: 394 testes aprovados e zero skips de integração PostgreSQL.
- [x] Aplicar as migrations versionadas à Neon `main` somente como base vazia para as branches automáticas de Preview; os endpoints `main` e `development` foram validados como distintos e Production permanece desconectada na Vercel.

A aceitação coletiva remota de 25/08/2026 usou o serviço e o repositório reais sobre uma única conexão Neon com `BEGIN ISOLATION LEVEL SERIALIZABLE`. O teste terminou em `ROLLBACK`; uma nova conexão confirmou zero linhas em `members`, `restaurants`, `visits`, `scorecards` e `publication_events`, portanto nenhum membro ou registro fictício foi preservado.

## 4. Autenticação, autorização e privacidade — parcialmente verificada

O Neon Auth está configurado no Preview conforme [o guia fechado de autenticação](../setup/neon-auth.md). A primeira conta, sua associação com `members` e a recuperação de senha foram verificadas; ainda faltam as outras sete contas.

- [x] Visitante: vê apenas rotas públicas e é recusado nas mutações privadas.
- [x] Administrador como participante: entra, vê o painel, cria uma visita e envia a própria ficha; o fluxo manual foi confirmado no Preview.
- [ ] Membro comum: entra e consegue editar somente a própria ficha; depende de uma segunda conta real para provar a fronteira entre membros.
- [x] Administrador publica antecipadamente: a visita real ficou `published` por `admin_override` com uma participação e apareceu nas duas rotas públicas.
- [ ] Administrador oculta e republica uma visita real pelo Preview; as regras já passaram na aceitação transacional, mas a interface ainda não foi percorrida.
- [x] Tentar cada mutação sem sessão e registrar `401`: criação de visita, ficha, publicação, geração de token de foto e importação do Google Maps verificadas no Preview.
- [ ] Tentar operações administrativas como membro comum e registrar `403`.
- [x] Tentar cadastrar diretamente um nono e-mail pela Auth URL e confirmar rejeição do webhook: `403 SIGNUP_BLOCKED`, sem sessão emitida e sem aumento na quantidade de contas.
- [x] Solicitar um e-mail novo de recuperação, abrir o callback e redefinir a senha; fluxo confirmado manualmente no Preview.
- [x] Inspecionar o HTML público vazio de `/registros` e `/membros`: nenhum e-mail, Auth ID ou marcador de nota individual apareceu.
- [x] Repetir a inspeção de privacidade após criar membro, ficha e projeção pública reais: `/registros` e o detalhe responderam `200` sem e-mail nem Auth ID; a projeção real do repositório não carregou notas individuais nos comentários.
- [ ] Testar logout e retorno à navegação pública.

## 5. Fotos e Vercel Blob — infraestrutura pronta, fluxo pendente

Pré-requisito concluído: Blob store público de homologação e `BLOB_READ_WRITE_TOKEN` configurado fora do repositório.

Em 25/08/2026, o store público `crateristas-fotos-preview` foi criado em `gru1` e conectado somente ao Preview. A variável `BLOB_READ_WRITE_TOKEN` foi injetada pela Vercel, um redeploy ficou `Ready` e a geração de token sem sessão continuou respondendo `401` sem expor detalhes do Blob. Depois do login do administrador, o primeiro upload autenticado foi concluído e verificado conforme as evidências abaixo.

- [x] Enviar uma imagem e confirmar conversão real para WebP: arquivo público `1600x901`, `108.904 bytes` e MIME `image/webp` no banco e no Blob.
- [x] Confirmar persistência via callback antes de apresentar a foto como concluída: uma linha ocupou a posição 1 em `visit_photos`, o Blob continha exatamente um arquivo e o detalhe público incluiu sua URL.
- [ ] Confirmar upload sequencial, retry de confirmação sem reupload e recuperação de callback terminal.
- [ ] Confirmar limite de cinco fotos na interface e no servidor.
- [ ] Confirmar que somente criador da visita ou administrador pode adicionar/remover fotos.
- [ ] Excluir uma foto e confirmar remoção no banco e no Blob sem deixar órfão.

## 6. Inspeção visual desktop — pendente

Não havia navegador de automação conectado ao ambiente e o CLI `agent-browser` não está instalado. O Edge já presente foi usado em modo headless para capturar `/`, `/registros`, `/membros` e `/entrar` em `1280x720`, `1440x900`, `1600x900` e `1920x1080`. Os estados inicial, carregando e vazio inspecionados não apresentaram overflow horizontal, sobreposição ou recorte de controles. Isso ainda não verifica interação por teclado, páginas privadas nem estados com dados.

Testar os tamanhos `1280x720`, `1440x900`, `1600x900` e `1920x1080` em:

- [ ] `/registros`, incluindo vazio, filtros e cards; vazio e filtros aprovados nos quatro tamanhos, cards pendentes;
- [ ] `/restaurantes/[slug]`, incluindo galeria, notas e oito comentários;
- [ ] `/membros`, incluindo expansão por teclado; estado vazio aprovado nos quatro tamanhos, cards e teclado pendentes;
- [ ] `/entrar`, incluindo erros de credencial; estado inicial aprovado nos quatro tamanhos, erro e teclado pendentes;
- [ ] `/painel`, incluindo estados vazio, carregando e erro;
- [ ] `/visitas/nova`, incluindo importação opcional do Google Maps;
- [ ] `/visitas/[id]/avaliar`, incluindo sliders, diálogo administrativo e fotos.

Em cada viewport, registrar overflow horizontal, sobreposição, recorte, ordem/foco visível pelo teclado e legibilidade dos comentários. A entrega atual é desktop; comportamento mobile não é critério desta fase.

## 7. Fronteira Three.js

- [x] Revisão textual: a única mudança funcional na landing foi o destino `/home` para `/registros`.
- [x] `GourmetScene.tsx` teve somente duas trocas `let` para `const` em variáveis nunca reatribuídas, exigidas pelo lint.
- [x] Nenhum loop, câmera, scroll, geometria, material, luz, partícula, evento ou descarte foi alterado.
- [ ] Percorrer visualmente a landing do topo ao redirecionamento e confirmar que caminho da câmera e animação permanecem iguais.

## 8. Guardrails de custo zero

Verificação documental em 20/08/2026; cotas podem mudar e devem ser reconfirmadas no console antes do deploy.

- Neon Free: a [página oficial de preços](https://neon.com/pricing) informa plano sem cartão e, atualmente, `100 CU-hours`, `0,5 GB` de armazenamento e `5 GB` de transferência por projeto/mês. No Free, o [scale-to-zero](https://neon.com/docs/introduction/scale-to-zero) ocorre após cinco minutos de inatividade.
- Vercel Blob Hobby: a [documentação oficial de uso e preços](https://vercel.com/docs/vercel-blob/usage-and-pricing) informa atualmente `1 GB` de armazenamento, `10.000` operações simples, `2.000` operações avançadas e `10 GB` de transferência incluídos por mês. Ao exceder o limite no Hobby, o acesso ao Blob pode ficar indisponível até a renovação da cota.
- [x] Confirmar no projeto que a conta está no plano Hobby e usa o alias gratuito `crateristas-git-develop-cofcewicz.vercel.app`; a API autenticada retornou `account_plan=hobby` em 25/08/2026.
- [ ] Confirmar alertas de uso para banco, armazenamento e operações.
- [x] Nenhum add-on pago, compra de créditos ou domínio pago foi habilitado nesta homologação; qualquer gasto futuro continua exigindo nova decisão explícita.
- [x] Limites defensivos no código: cinco fotos por visita, WebP, `750.000 bytes`, upload autenticado e importador do Google Maps limitado a criação autenticada.

## Critério de liberação

Não considerar a aplicação pronta para produção enquanto houver item pendente nas seções 3 a 7. A próxima rodada deve usar apenas infraestrutura de homologação, registrar resultados observados e, depois, repetir os quatro gates automatizados antes da implantação.
