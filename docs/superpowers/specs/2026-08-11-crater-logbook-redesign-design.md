# Crateristas: Livro de Registros e Avaliacao Coletiva

**Data:** 11 de agosto de 2026
**Status:** aprovado e atualizado em 25 de agosto de 2026
**Idioma do produto:** portugues brasileiro
**Plataforma inicial:** desktop, de 1280 a 1920 px

## 1. Contexto

Crateristas e um projeto pessoal para um grupo de oito amigos registrar os restaurantes que visitam juntos. A cratera que existe em frente ao restaurante favorito do grupo e a origem da piada interna e o principal simbolo do produto.

A landing page atual transforma a descida pela cratera em uma experiencia Three.js controlada por scroll. Essa experiencia e a parte aprovada do design atual e deve permanecer como a entrada dramatica do site. Depois da descida, o produto deixa de tentar sustentar uma estetica de luxo generica e passa a funcionar como um livro de registros gastronomicos claro, social e util.

O visitante deve perceber primeiro um arquivo de restaurantes. A Sociedade da Cratera existe abaixo dessa superficie e aparece aos poucos em titulos, simbolos e pequenos fragmentos opcionais.

## 2. Objetivos

- Preservar a landing page da cratera e sua logica de animacao.
- Criar um arquivo publico de avaliacoes coletivas de restaurantes.
- Permitir que oito membros autenticados contribuam com notas e comentarios curtos.
- Publicar automaticamente uma avaliacao ao atingir seis contribuicoes.
- Permitir que o administrador publique antes do quorum ou oculte uma avaliacao.
- Mostrar medias coletivas de imediato e permitir que o visitante revele a ficha individual de cada comentario.
- Criar uma pagina publica de membros com cartoes expansíveis.
- Manter hospedagem, banco, autenticacao e imagens dentro de cotas gratuitas.
- Construir primeiro uma experiencia desktop satisfatoria.

## 3. Fora do escopo inicial

- Layout e navegacao dedicados a celulares.
- Aplicativo nativo.
- Cadastro publico de usuarios.
- Votacao de aprovacao ou edicao coletiva de um unico texto.
- Veredito criado por IA ou por regras automaticas.
- Rankings ou comparacoes automaticas entre membros.
- Gamificacao complexa, ranking competitivo ou sistema de pontos.
- Refatoracao interna do Three.js sem uma necessidade tecnica comprovada.

## 4. Principios de produto

### 4.1 Livro de registros primeiro

O produto deve ser compreensivel sem conhecer a piada interna. Busca, filtros, notas, fotos e participacao aparecem antes da lore.

### 4.2 Estranheza progressiva

A Sociedade da Cratera surge de forma gradual. Simbolos discretos, numeracao incomum, titulos de membros, mensagens no rodape e pequenos trechos de lore recompensam exploracao, mas nunca escondem acoes essenciais.

### 4.3 Evidencia em vez de veredito

O site apresenta medias, fotos e comentarios individuais curtos. O visitante forma a propria conclusao; o sistema nao gera um resumo definitivo.

### 4.4 Transparencia sem exposicao indevida

Os comentarios, o prato pedido opcional e as notas numericas sao atribuidos publicamente aos membros. A ficha individual permanece recolhida ate o visitante escolher `Ver notas`; a pagina nao cria ranking entre amigos. E-mails, IDs de autenticacao e identificadores internos permanecem privados.

### 4.5 Simplicidade operacional

Existem somente oito contas, criadas pelo administrador. O produto evita dependencias e fluxos que nao servem diretamente ao grupo.

## 5. Arquitetura de informacao

### `/`

Landing page existente com a cena Three.js. O destino ao final da descida passa a ser `/registros`. A alteracao do destino nao autoriza mudancas na matematica de scroll, camera, geometria, iluminacao ou ciclo de renderizacao.

### `/registros`

Pagina inicial publica depois da cratera:

- cabecalho compacto com `Registros`, `Membros` e `Entrar`;
- busca por nome, culinaria e bairro;
- filtros relevantes;
- avaliacoes publicadas recentemente;
- arquivo de restaurantes;
- nota coletiva, participacao, categoria e localizacao em cada cartao;
- registros ainda privados aparecem somente para membros autenticados.

Nao havera um segundo hero grande. As secoes atuais de menu do dia, explicacao do banco, instrucoes de implantacao e apresentacao completa dos membros serao removidas dessa pagina.

### `/restaurantes/[slug]`

Pagina publica de uma visita publicada:

- galeria de ate cinco fotos;
- restaurante, data da visita, culinaria, bairro e faixa de preco;
- media coletiva geral;
- seis medias por atributo;
- participacao real, como `6 de 8 crateristas contribuiram`;
- comentarios curtos com nome e foto dos membros;
- fragmentos da Sociedade da Cratera em posicoes secundarias.

Em desktop, os comentarios podem formar uma composicao de fragmentos ao redor do nucleo de notas. A composicao deve continuar legivel e ter posicoes deterministicas; nao sera uma simulacao fisica ou um efeito que gere sobreposicoes aleatorias.

### `/membros`

Diretorio publico com:

- introducao curta ao grupo;
- oito cartoes expansíveis;
- foto, nome, apelido ou titulo, numero de membro e descricao curta;
- quantidade de contribuicoes;
- culinaria favorita ou restaurante mais bem avaliado;
- detalhes opcionais da Sociedade da Cratera;
- acao privada `Suas avaliacoes pendentes` para o membro autenticado.

Perfis individuais separados nao fazem parte da primeira versao.

### `/entrar`

Login por e-mail e senha, sem link de cadastro. Erros, recuperacao administrada e estado de carregamento serao apresentados em portugues brasileiro.

### `/painel`

Area privada com:

- visitas que aguardam contribuicao do membro;
- visitas abaixo do quorum;
- visitas publicadas recentemente;
- acao para criar visita;
- acoes administrativas visiveis somente para o administrador.

### `/visitas/nova` e `/visitas/[id]/avaliar`

Fluxos privados para cadastrar uma visita e enviar ou editar a propria ficha de notas.

## 6. Linguagem visual

O visual sera um **livro de registros escuro com sinais de uma sociedade secreta**, nao uma interface de luxo baseada em glassmorphism.

- Fundos solidos em carvao e ameixa muito escura.
- Texto principal em branco quente e texto secundario com contraste acessivel.
- Laranja-terra inspirado na cratera como acento restrito.
- Fotografias dos restaurantes como principal fonte de cor.
- Tipografia editorial para titulos e sans-serif legivel para dados e controles.
- Aneis topograficos, circulos incompletos, marcas de arquivo e numeros de entrada como motivos visuais.
- Bordas discretas e profundidade criada por contraste, nao por brilho em todos os paineis.
- Animacao sutil somente quando comunica estado ou descoberta.
- Estados de foco visiveis e navegacao completa por teclado.

O layout inicial sera validado entre 1280 e 1920 px. Nao serao criados menus mobile, composicoes empilhadas especificas ou gestos para toque nesta etapa.

## 7. Sociedade da Cratera e easter eggs

Os easter eggs obedecem a quatro regras:

1. Nunca bloqueiam informacao ou uma acao essencial.
2. Nunca mudam resultados, permissoes ou notas.
3. Podem ser ignorados sem prejudicar a experiencia.
4. Devem parecer descobertas, nao uma camada tematica constante.

Exemplos permitidos:

- identificadores de registro com numeracao incomum;
- simbolo discreto que muda depois de algumas visitas;
- trechos curtos no rodape;
- titulos secretos nos cartoes de membros;
- pequenas anotacoes de arquivo reveladas ao expandir um cartao;
- mensagens adicionais para usuarios autenticados.

Nao havera puzzle obrigatorio, audio automatico, movimento intrusivo ou conteudo que prejudique a leitura.

## 8. Modelo da avaliacao coletiva

Cada visita aceita uma ficha por membro. A ficha contem seis notas inteiras de 0 a 10, nas quais um numero maior sempre representa uma experiencia melhor:

1. `Comida`
2. `Serviço`
3. `Ambiente`
4. `Custo-benefício`
5. `Acesso e localização`
6. `Tempo de espera`

`Acesso e localização` mede a conveniencia para o grupo, incluindo distancia e facilidade de chegada. `Tempo de espera` avalia quao curto ou bem administrado foi o tempo ate o atendimento ou mesa.

A ficha tambem contem um comentario publico de no maximo 180 caracteres. A media geral e calculada a partir das seis medias coletivas; nenhum membro informa uma nota geral separada.

## 9. Publicacao e estados

O quorum padrao e seis dos oito membros.

### Fluxo normal

1. Um membro cria a visita.
2. A visita fica privada e aberta a contribuicoes.
3. Cada membro envia ou edita a propria ficha.
4. Ao atingir seis fichas, a visita se torna publica automaticamente.
5. A setima e a oitava contribuicoes recalculam as medias sem retirar a pagina do ar.

### Excecao administrativa

- O administrador pode usar `Publicar antecipadamente` depois que existir pelo menos uma ficha.
- A confirmacao mostra a participacao atual e avisa que a media ainda e parcial.
- A pagina publica sempre mostra a contagem real de participantes.
- O administrador pode usar `Retirar do publico`.
- Uma visita retirada manualmente permanece oculta ate nova publicacao administrativa, mesmo que ja tenha quorum.
- Publicacao antecipada, retirada e republicacao registram data e administrador responsavel.

Os estados persistidos serao `private`, `published` e `hidden`. O motivo da publicacao sera `quorum` ou `admin_override`.

## 10. Permissoes

### Visitante

- consultar registros publicados;
- pesquisar e filtrar;
- ver medias coletivas, fotos, participacao, comentarios, pratos pedidos, fichas individuais e membros publicos;
- nao receber dados de rascunhos, e-mails, IDs de autenticacao ou identificadores internos.

### Membro autenticado

- todas as permissoes publicas;
- criar visita;
- enviar e editar a propria ficha;
- ver visitas privadas abertas a contribuicoes;
- ver a propria lista de pendencias;
- editar dados basicos e fotos de uma visita que criou.

### Administrador

- todas as permissoes de membro;
- corrigir qualquer registro e controlar sua visibilidade;
- publicar antes do quorum;
- retirar e republicar uma avaliacao;
- criar e administrar as oito contas fora do cadastro publico.

Todas as mutacoes validam a sessao e a permissao no servidor. Ocultar botoes no cliente nao sera considerado controle de acesso.

## 11. Dados e servicos

O projeto preserva Next.js 16, Neon Postgres e a estrutura App Router.

### Autenticacao

Neon Auth sera habilitado no projeto Neon existente. As oito contas serao criadas pelo administrador. Nao havera endpoint ou tela publica de cadastro. Sessoes de rotas privadas e de mutacoes serao validadas no servidor.

### Tabelas de dominio

- `members`: perfil publico ligado ao usuario autenticado;
- `restaurants`: dados permanentes do restaurante;
- `visits`: visita, criador, quorum, estado e auditoria de publicacao;
- `scorecards`: notas e comentario de um membro em uma visita;
- `visit_photos`: URLs e ordem das imagens.

`scorecards` tera restricao unica em `(visit_id, member_id)` e restricoes de intervalo de 0 a 10. As medias e a participacao serao calculadas a partir das fichas, sem duplicar os valores individuais em uma coluna agregada editavel.

As tabelas atuais nao serao removidas destrutivamente. Caso existam registros reais em `reviews`, uma migracao aditiva os convertera em entradas legadas publicadas e manterá a origem intacta para recuperacao.

### Fotos

As imagens serao enviadas para Vercel Blob e o Postgres guardara apenas URLs e metadados.

- maximo de cinco fotos por visita;
- entrada aceita em JPEG, PNG ou WebP;
- redimensionamento para no maximo 1600 px no maior lado;
- conversao para WebP;
- alvo maximo aproximado de 750 KB por arquivo;
- validacao novamente no servidor antes de confirmar a URL no banco;
- upload direto do cliente quando seguro, reduzindo transferencia pela funcao.

Essa politica mantem o projeto dentro da cota gratuita esperada para seu volume de uso.

## 12. Tratamento de falhas

- Mensagens aparecem junto ao campo ou acao que falhou.
- O formulario preserva notas e comentario quando o upload de uma foto falha.
- Sessao expirada leva a uma mensagem clara e retorno ao login sem publicar dados anonimos.
- Envio duplicado atualiza a ficha existente do proprio membro; nunca cria duas fichas.
- Conflitos de edicao de metadados solicitam recarregamento em vez de sobrescrever silenciosamente.
- Falha ao recalcular o agregado nao publica valores parciais; a mutacao principal e a leitura seguinte devem permanecer consistentes.
- Paginas publicas nao revelam a existencia de um ID privado por meio de mensagens diferentes para visitantes.
- O modo de fallback atual em `localStorage` nao sera usado para dados autenticados ou publicacao real.

## 13. Restricao do Three.js

`GourmetScene.tsx` e seu comportamento visual ficam fora do redesign interno.

Nao alterar sem uma discussao separada:

- ciclo `requestAnimationFrame`;
- calculo de progresso por scroll;
- posicoes e interpolacao da camera;
- geometrias, materiais, luzes, particulas e disposicao da cena;
- eventos de mouse e resize;
- descarte de recursos.

Mudancas permitidas ao redor da cena:

- destino da navegacao para `/registros`;
- texto e estilo do indicador de scroll;
- estados de carregamento;
- integracao visual da transicao, desde que nao altere a matematica da animacao.

O arquivo e grande e monolitico, mas possui um ciclo coerente e descarte explicito de recursos. Uma refatoracao preventiva nao faz parte deste trabalho.

## 14. Custo zero

A primeira versao deve operar nos planos gratuitos:

- Neon Free para banco e Neon Auth;
- Vercel Hobby para hospedagem pessoal e nao comercial;
- Vercel Blob Hobby para fotos;
- subdominio gratuito `.vercel.app`.

Um dominio proprio e opcional e pago separadamente. O produto deve impor limites de foto e evitar servicos adicionais obrigatorios. Painel de uso e cotas devem ser verificados antes da publicacao e periodicamente depois dela.

## 15. Criterios de verificacao

### Funcionais

- Visitante acessa somente visitas publicadas.
- Membro entra e sai com uma conta pre-criada.
- Rota privada rejeita visitante e sessao invalida.
- Cada membro possui no maximo uma ficha por visita.
- Cinco fichas mantem a visita privada.
- A sexta ficha publica automaticamente.
- Setima e oitava fichas atualizam medias e participacao.
- Edicao de uma ficha atualiza as medias.
- Notas individuais nunca aparecem em respostas publicas.
- Administrador publica antecipadamente e a contagem real permanece visivel.
- Administrador oculta e republica sem perda de contribuicoes.
- Comentarios acima de 180 caracteres sao rejeitados com mensagem em portugues.
- Seis medias e a media geral sao calculadas corretamente.
- Limite de cinco fotos e validado no cliente e no servidor.

### Interface

- Fluxos principais funcionam por teclado.
- Foco e contraste sao visiveis.
- Paginas sao verificadas em 1280, 1440, 1600 e 1920 px.
- Comentarios nao se sobrepoem nem ficam ilegíveis.
- Estados vazios, carregamento e erro estao em portugues brasileiro.
- Pagina de membros e publica; acoes privadas dependem da sessao.
- Easter eggs nao bloqueiam o fluxo principal.

### Regressao

- Landing carrega sem renderizacao no servidor do Three.js.
- Scroll continua conduzindo a mesma descida.
- Cena limpa eventos, frame de animacao e recursos ao desmontar.
- Destino final abre `/registros`.
- Build de producao, lint e verificacao de tipos passam.

## 16. Resultado esperado

O Crateristas deve parecer um livro de registros gastronomicos criado por amigos: rapido para consultar, facil de alimentar e claro para visitantes. A cratera continua sendo a entrada memoravel. A Sociedade da Cratera se revela somente para quem permanece tempo suficiente para perceber que o arquivo talvez nao seja tao normal quanto parece.
