# Verificação do livro de registros dos Crateristas

Última atualização local: **20 de agosto de 2026**

Commit verificado: `2a77018` (`develop`)

Estado: **verificação local concluída; homologação externa e inspeção visual pendentes**.

Este documento separa evidência observada de tarefas que ainda dependem de infraestrutura. Nenhuma migration, conta, upload, implantação ou outra escrita externa foi executada durante esta rodada.

## 1. Gates automatizados locais

| Comando | Resultado observado em 20/08/2026 |
| --- | --- |
| `npm test` | PASS — 57 arquivos, 375 testes aprovados e 19 integrações condicionais ignoradas sem `TEST_DATABASE_URL` |
| `npm run lint` | PASS — exit code 0; oito avisos preexistentes, sem erro |
| `npx next typegen` | PASS — tipos de rota regenerados após a remoção das rotas legadas |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS — build de produção gerado sem credenciais reais |
| `git diff --check` | PASS |

Os skips não são evidência de integração com Neon: eles existem justamente para não acessar um banco quando `TEST_DATABASE_URL` não está configurada.

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

## 3. Banco de dados e regras coletivas — pendente

Pré-requisito: configurar `DATABASE_URL` e `TEST_DATABASE_URL` com uma branch Neon **descartável e não produtiva**. Não colar credenciais no chat nem usar valores de exemplo.

- [ ] Confirmar no console que as duas URLs apontam para a branch de homologação.
- [ ] Executar `npm run db:migrate` somente após essa confirmação.
- [ ] Confirmar que `002_purge_legacy_reviews.sql` apagou somente as linhas de `reviews` e não removeu a tabela.
- [ ] Criar exatamente oito membros de teste e uma visita.
- [ ] Enviar cinco fichas: a visita deve continuar privada.
- [ ] Enviar a sexta ficha: a visita deve ser publicada automaticamente.
- [ ] Enviar a sétima e a oitava fichas: médias e nota geral devem ser recalculadas.
- [ ] Ocultar a visita, editar uma ficha e confirmar que ela continua oculta.
- [ ] Republicar e confirmar que a projeção pública reaparece.
- [ ] Executar novamente `npm test` com `TEST_DATABASE_URL` e exigir zero skips de integração PostgreSQL.

## 4. Autenticação, autorização e privacidade — pendente

Pré-requisito: configurar Neon Auth conforme [o guia fechado de autenticação](../setup/neon-auth.md), incluindo webhook `user.before_create`, oito contas e a associação com `members`.

- [ ] Visitante: vê apenas rotas públicas e é recusado nas mutações privadas.
- [ ] Membro: entra, vê o painel, cria visita e edita somente a própria ficha.
- [ ] Administrador: além do fluxo de membro, publica antecipadamente, oculta e republica.
- [ ] Tentar cada mutação sem sessão e registrar `401`.
- [ ] Tentar operações administrativas como membro comum e registrar `403`.
- [ ] Tentar cadastrar diretamente um nono e-mail pela Auth URL e confirmar rejeição do webhook.
- [ ] Inspecionar JSON e HTML públicos: nenhum e-mail, Auth ID ou nota numérica individual pode aparecer.
- [ ] Testar logout e retorno à navegação pública.

## 5. Fotos e Vercel Blob — pendente

Pré-requisito: um Blob store público de homologação e `BLOB_READ_WRITE_TOKEN` configurado fora do repositório.

- [ ] Enviar uma imagem e confirmar conversão real para WebP, maior lado de até `1600 px` e no máximo `750.000 bytes`.
- [ ] Confirmar persistência via callback antes de apresentar a foto como concluída.
- [ ] Confirmar upload sequencial, retry de confirmação sem reupload e recuperação de callback terminal.
- [ ] Confirmar limite de cinco fotos na interface e no servidor.
- [ ] Confirmar que somente criador da visita ou administrador pode adicionar/remover fotos.
- [ ] Excluir uma foto e confirmar remoção no banco e no Blob sem deixar órfão.

## 6. Inspeção visual desktop — pendente

Não havia navegador de automação conectado ao ambiente e o CLI `agent-browser` não está instalado. Sem instalar nada, foi possível usar o Edge já presente por caminho fixo para um screenshot headless efêmero de `/entrar` em `1280x720`: cabeçalho, texto e formulário ficaram visíveis, sem overflow ou sobreposição aparente. A imagem temporária foi inspecionada e removida. Isso é apenas um smoke visual estático, sem interação por teclado, e não aprova a matriz abaixo.

Testar os tamanhos `1280x720`, `1440x900`, `1600x900` e `1920x1080` em:

- [ ] `/registros`, incluindo vazio, filtros e cards;
- [ ] `/restaurantes/[slug]`, incluindo galeria, notas e oito comentários;
- [ ] `/membros`, incluindo expansão por teclado;
- [ ] `/entrar`, incluindo erros de credencial;
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
- [ ] Confirmar no dashboard que o projeto está no plano Hobby e usa o subdomínio gratuito `.vercel.app`.
- [ ] Confirmar alertas de uso para banco, armazenamento e operações.
- [ ] Não habilitar add-on pago, gasto sob demanda ou domínio pago sem nova decisão explícita.
- [x] Limites defensivos no código: cinco fotos por visita, WebP, `750.000 bytes`, upload autenticado e importador do Google Maps limitado a criação autenticada.

## Critério de liberação

Não considerar a aplicação pronta para produção enquanto houver item pendente nas seções 3 a 7. A próxima rodada deve usar apenas infraestrutura de homologação, registrar resultados observados e, depois, repetir os quatro gates automatizados antes da implantação.
