# Landing page e história da Cratera

**Status:** desenho aprovado em conversa, aguardando revisão desta especificação
**Data:** 2026-09-01
**Escopo:** nova `/home`, nova `/historia`, navegação pública e destino da cena de entrada

## Contexto

O Crateristas já possui sua entrada mais característica: a cena Three.js em `/`, na qual o visitante desce pela cratera. Depois dessa entrada, entretanto, o site salta diretamente para o arquivo de registros. Falta uma página pública que apresente a Cratera, seus registros e seus integrantes como partes da mesma sociedade.

A nova `/home` será essa porta editorial. Ela deve parecer a primeira página de um livro de registros que se aprofunda por camadas geológicas, sem transformar a experiência em outro espetáculo 3D e sem alterar a lógica de animação da cena existente.

## Objetivos

- Fazer de `/home` a página inicial pública depois da descida pela cratera.
- Apresentar imediatamente o título "Bem-vindo à cratera" e uma ação para explorar os restaurantes.
- Destacar os restaurantes com registros publicados mais recentemente.
- Introduzir a história e os integrantes sem revelar toda a mitologia de uma vez.
- Reunir história e integrantes em `/historia`, substituindo a página pública isolada de membros.
- Preservar a identidade editorial, a língua portuguesa brasileira e o funcionamento da experiência existente.
- Estruturar os componentes para permitir iterações visuais sem acoplar conteúdo, dados e comportamento do carrossel.

## Não objetivos

- Refatorar ou redesenhar a cena Three.js.
- Mudar seu ciclo de dia e noite, câmera, iluminação, modelos ou lógica de animação.
- Criar uma versão mobile completa nesta etapa.
- Alterar o fluxo de criação, avaliação, publicação ou exclusão de visitas.
- Criar um veredito editorial ou texto gerado a partir das notas e comentários.
- Inventar datas, fotografias, membros ou registros que não existam no banco.

## Arquitetura de informação

### Entrada

1. O visitante abre `/` e encontra a cena Three.js atual.
2. Ao concluir a descida, a cena o encaminha para `/home`.
3. Nenhum outro comportamento da cena muda.

### `/home`

A página segue esta ordem:

1. **Abertura:** título "Bem-vindo à cratera", breve introdução e botão primário "Explorar restaurantes" para `/registros`.
2. **Restaurantes recentes:** carrossel com até seis restaurantes únicos, selecionados por seu registro publicado mais recente. Inclui ação "Ver todos os registros" para `/registros`.
3. **Prévia da história:** trecho curto da narrativa e ação "Conheça nossa história" para `/historia`.
4. **Prévia dos integrantes:** apresentação visual dos oito membros reais e ação "Conheça os integrantes" para `/historia#integrantes`.
5. **Encerramento:** convite para continuar explorando os registros; membros autenticados também podem seguir ao painel.

### `/historia`

A página combina a narrativa institucional e a lista pública dos membros:

1. Cabeçalho editorial da história.
2. Quatro capítulos: a descoberta, a peregrinação, a sociedade e o patrimônio natural.
3. Seção `id="integrantes"` com os oito perfis públicos e suas fotografias reais.
4. Chamada final para `/registros`.

### Compatibilidade

- `/membros` passa a executar um redirecionamento permanente para `/historia#integrantes`.
- O item público "Membros" no cabeçalho passa a se chamar "História" e aponta para `/historia`.
- A marca "Crateristas" no cabeçalho aponta para `/home`, evitando repetir a cena de entrada durante a navegação normal.
- A rota `/` continua sendo a entrada cinematográfica canônica e pode ser acessada diretamente.

## Conteúdo canônico

### Prévia na home

> Descoberta por Lucas ao lado do restaurante que sempre nos faz voltar, a cratera transformou amigos em Discípulos, avaliações em registros e mosquitos em patrimônio natural.

### História completa

**Título:** A cratera nos encontrou primeiro.

#### A descoberta

Antes dos registros, já existia um restaurante muito bom. Ao lado dele, por nenhum motivo aparente, existia uma cratera enorme. Lucas foi o primeiro a reconhecer a descoberta e a compreender que aquele vazio não poderia continuar sem testemunhas.

#### A peregrinação

O restaurante era bom demais para uma visita única. O grupo voltou, depois voltou outra vez, e cada jantar tornou o caminho até a cratera mais familiar. O que era costume ganhou a solenidade de uma peregrinação.

#### A sociedade

Os frequentadores tornaram-se Discípulos da Cratera. Sob a presença do Monarca Guizão, passaram a conservar a memória de cada mesa: as notas individuais, os pratos pedidos e os comentários que, juntos, formam cada registro coletivo.

#### Patrimônio natural

A grandeza da cratera não é apenas espiritual ou gastronômica. Sua geografia oferece uma forma excepcional de conservação da abundante fauna local de mosquitos, patrimônio vivo que acompanha silenciosamente as reuniões da Sociedade.

O texto pode receber ajustes editoriais futuros, mas os fatos canônicos não devem ser ampliados com datas ou acontecimentos inventados.

## Direção visual

### Conceito

"Descida ao livro": um livro de registros organizado em camadas geológicas. A página inicia clara e aberta e ganha campos de cor mais profundos conforme o visitante avança. A progressão deve ser feita por superfícies planas e contraste, não por um céu em degradê nem por outra cena WebGL.

### Linguagem

- Manter a combinação tipográfica editorial existente: Newsreader para voz narrativa e Manrope para interface.
- Manter a base de papel, carvão e brasa definida pelos tokens atuais, reforçando escala e contraste em vez de introduzir uma paleta paralela.
- Usar linhas, números de arquivo, selos e pequenas anotações da Sociedade como detalhes, sem transformar toda a página em uma paródia.
- Evitar cartões genéricos repetidos, efeitos de vidro, gradientes decorativos e excesso de sombras.

### Primeiro viewport

- O título "Bem-vindo à cratera" domina a hierarquia.
- O botão "Explorar restaurantes" permanece visível sem rolagem em um viewport desktop comum.
- Um contorno abstrato da cratera pode ocupar a lateral como elemento gráfico em CSS/SVG, sem imagem inventada e sem Three.js adicional.
- O cabeçalho permanece reconhecível, mas a abertura deve parecer mais espacial que as páginas utilitárias.

### Carrossel

- Um registro principal ocupa a maior parte da largura da seção.
- As bordas dos registros anterior e seguinte permanecem parcialmente visiveis para comunicar continuidade.
- A fotografia de capa real é o elemento dominante quando existir.
- Sem fotografia, o card usa uma composição editorial com nome, local, culinária e nota; não usa imagem sintética ou placeholder fotográfico.
- Nome, local, data da visita, participantes e média coletiva podem aparecer conforme os dados existentes.
- Cada item aponta para `/restaurantes/[slug-da-visita]`.

### História e integrantes

- A prévia da história é mais silenciosa, com texto grande e anotações discretas nas margens.
- A apresentação dos integrantes usa os perfis reais em uma composição escalonada, evitando uma grade uniforme de cards idênticos.
- A página completa `/historia` pode reutilizar `MemberGrid` e `MemberCard`, mas deve permitir uma variante visual própria sem duplicar a regra de avatar ou os fragmentos da Sociedade.

### Movimento

- Um indicador vertical de profundidade acompanha a seção atual e funciona como assinatura de movimento da landing page.
- O carrossel usa transições curtas, previsíveis e acionadas pelo usuário; não avança automaticamente.
- Elementos narrativos podem entrar com deslocamento e opacidade discretos.
- Com `prefers-reduced-motion: reduce`, o indicador e o carrossel continuam funcionais sem animações de deslocamento.

## Dados e seleção dos restaurantes

`/home` será uma Server Component. Ela obtém em paralelo:

- `repository.listPublicVisits({})` para os registros publicados já ordenados por `publishedAt DESC`;
- `repository.listPublicMembers()` para a prévia dos integrantes;
- `findOptionalMember()` para adaptar as ações de cabeçalho e encerramento.

Uma função pura, fora da camada visual, recebe os registros e devolve até seis itens:

1. percorre a lista na ordem fornecida pelo repositório;
2. conserva apenas a primeira ocorrência de cada `restaurant.slug`;
3. limita o resultado a seis;
4. não reordena registros no cliente.

Essa escolha reutiliza o contrato público atual e evita uma mudança de SQL apenas para a primeira versão. A função de seleção forma uma fronteira explícita: se o volume crescer, a deduplicação e o limite podem migrar para um novo método do repositório sem alterar o carrossel.

O cliente recebe somente objetos serializáveis. Não há consulta client-side nem endpoint novo para o carrossel.

## Componentes e responsabilidades

### Componentes de servidor

- `HomePage`: busca dados, seleciona restaurantes e compõe a página.
- `LandingHero`: abertura estática e ações primárias.
- `HistoryPreview`: texto canônico resumido e link para a história.
- `MembersPreview`: composição dos perfis públicos recebidos por props.
- `HistoryPage`: busca membros e compõe narrativa, integrantes e CTA final.

### Componente cliente

- `RecentRestaurantsCarousel`: controla índice ativo, setas, teclado, indicadores e anúncios acessíveis. Não busca nem transforma dados.

### Conteúdo

- A narrativa longa e o resumo devem ficar em um módulo de conteúdo tipado, separado do JSX, para futuras revisões de texto.
- Os fragmentos secretos já existentes em `src/content/society.ts` continuam sendo a fonte das anotações individuais.

### Estilos

- A landing e a história recebem um módulo de estilos próprio ou uma folha de feature coesa.
- Tokens globais existentes são reutilizados; novos tokens só entram quando representam uma decisão semântica compartilhada.
- Estilos do carrossel ficam próximos ao componente, sem misturar estado de interação com o shell global.

## Estados e falhas

### Sem registros publicados

A seção continua presente com o título "Os registros ainda estão em silêncio", uma explicação curta e o link para `/registros`. Não há slides vazios nem dados demonstrativos.

### Sem fotografia de capa

O item preserva toda a informação textual e usa uma composição gráfica de arquivo. O nome do restaurante continua sendo o principal link.

### Sem integrantes

A home e a história exibem uma mensagem editorial curta no lugar dos retratos. A ausência de membros não impede a renderização da narrativa nem dos restaurantes.

### Falha de dados

Erros inesperados seguem o tratamento de erro do App Router. A página não deve capturar uma falha de infraestrutura e apresentá-la como se fosse um estado vazio legítimo.

## Acessibilidade

- Hierarquia única e lógica de títulos, com um único `h1` por página.
- Links e botões com foco visível e nomes em português brasileiro.
- Carrossel navegável por setas do teclado quando focado, além dos controles explícitos.
- Estado ativo comunicado visualmente e por atributos acessíveis.
- Fotografias reais usam texto alternativo contextual; decorações da cratera ficam ocultas de tecnologias assistivas.
- Contraste de texto e controles deve atender WCAG AA.
- Nenhuma informação depende apenas de movimento ou cor.

## Escopo desktop

O acabamento desta etapa tem como alvo viewports desktop a partir de 1024 px, com composição principal validada em 1440 px. Telas menores devem manter conteúdo acessível e sem corte destrutivo, mas a reorganização mobile completa fica explicitamente para uma fase posterior.

## Testes e verificação

O trabalho será conduzido com testes antes da implementação:

- seleção pura preserva a ordem, remove restaurantes repetidos e limita a seis;
- `/home` busca registros, membros e usuário opcional e renderiza as seções previstas;
- estado sem registros não cria conteúdo fictício;
- carrossel responde aos controles, teclado e limites da lista;
- `/historia` renderiza os quatro capítulos e os membros reais;
- `/membros` redireciona permanentemente para `/historia#integrantes`;
- cabeçalho aponta marca para `/home` e exibe "História";
- cena de entrada continua renderizando `GourmetScene` e seu único destino muda para `/home`.

Ao final devem passar testes unitários e de componentes, verificação de tipos, lint e build. A verificação visual no navegador deve cobrir `/`, `/home`, `/historia`, `/registros` e pelo menos um detalhe de restaurante, em 1440 px, incluindo console sem novos erros, navegação por teclado e redução de movimento.

## Critérios de aceite

- A descida pela cratera termina na nova landing page.
- A primeira dobra comunica "Bem-vindo à cratera" e permite explorar restaurantes imediatamente.
- A home mostra no máximo seis restaurantes únicos derivados apenas de registros publicados reais.
- História e integrantes possuem chamadas claras e rotas funcionais.
- `/historia` conta a narrativa aprovada e apresenta os perfis públicos.
- `/membros` continua funcional por redirecionamento.
- O visual pertence ao sistema editorial existente e não parece um template genérico.
- A cena Three.js permanece funcional, sem alterações em sua lógica de animação.
- A implementação fica dividida por responsabilidades e pode ser redesenhada por seção sem reescrever a camada de dados.
