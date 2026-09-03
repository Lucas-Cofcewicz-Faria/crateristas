# Movimento ritual e atmosfera cromática

**Status:** aprovado pelo usuário em 2026-09-03
**Data:** 2026-09-03
**Escopo:** páginas públicas `/home`, `/registros`, `/historia` e `/restaurantes/[slug]`

## Contexto

O Crateristas já possui uma linguagem editorial escura e uma entrada Three.js autoral. As páginas públicas seguintes, porém, ainda dependem principalmente de composições estáticas. A evolução aprovada deve dar vida ao livro de registros sem transformar cada seção em um catálogo de efeitos e sem competir com a cena da cratera.

A intensidade escolhida foi chamada de **5**: a presença ritualística da opção mais teatral, controlada pela legibilidade e pela disciplina cinematográfica da opção intermediária. O conceito que unifica o movimento é **conteúdo sendo desenterrado da Cratera**.

## Objetivos

- Criar uma linguagem de movimento reutilizável para títulos, registros, capítulos, integrantes, fotografias, notas e comentários.
- Dar a cada página pública um momento autoral ligado à Cratera.
- Fazer a página de cada restaurante assumir uma atmosfera cromática derivada de sua primeira fotografia publicada.
- Usar a fotografia `C:\Users\patho\Desktop\cratera.png` como momento focal da landing page.
- Manter conteúdo, navegação, foco e mudanças de estado legíveis com ou sem animação.
- Preservar a arquitetura atual e criar componentes isolados que possam ser refinados sem reescrever as páginas.
- Manter a solução sem custo adicional e sem nova dependência de animação ou processamento de imagens.

## Não objetivos

- Alterar `src/components/GourmetScene.tsx`, sua câmera, iluminação, ciclo temporal, modelos ou fluxo de navegação.
- Criar scroll hijacking, rolagem obrigatória, áudio automático ou animações que atrasem ações.
- Alterar dados, banco, APIs, autenticação, publicação, notas ou comentários.
- Persistir paletas cromáticas no banco nesta etapa.
- Criar uma versão mobile completa.
- Aplicar coreografia editorial ao painel administrativo ou aos formulários de autenticação.
- Gerar veredito textual ou qualquer interpretação automática das avaliações.

## Tese de movimento

### Momento focal

Na landing page, a fotografia real do local surge atrás de “Bem-vindo à Cratera” através de uma abertura orgânica. Contornos topográficos acompanham a expansão da abertura até a imagem assumir uma composição panorâmica. O título permanece a primeira leitura e a rolagem continua nativa.

### Continuidade

- Seções públicas aparecem como camadas sucessivas do arquivo.
- Registros entram como evidências recém-desenterradas.
- Capítulos da história alternam direção conforme sua composição atual.
- Comentários convergem para a mesa coletiva e permanecem estáveis depois da entrada.
- A abertura das notas individuais preserva a relação espacial entre o comentário e seus valores.

### Feedback

- Botões, links, filtros, controles do carrossel e disclosures respondem em 100–300 ms.
- Mudanças de página ou seção podem usar transições de 300–500 ms quando explicarem continuidade.
- Entradas autorais podem durar entre 500–800 ms e acontecem somente uma vez por visita à página.
- Saídas são mais rápidas que entradas e não usam bounce ou elasticidade.

### Orçamento

- Existe no máximo uma animação ambiental contínua em cada página.
- Animações ambientais pausam quando ficam fora da viewport ou quando a aba deixa de estar visível.
- Efeitos priorizam `transform`, `opacity` e máscaras limitadas a regiões isoladas.
- Não há loop global de `requestAnimationFrame`.
- A extração cromática amostra apenas 24 × 24 pixels e executa uma vez por página de restaurante.

## Arquitetura

### `MotionScope`

Um componente cliente reutilizável, previsto em `src/components/motion/MotionScope.tsx`, envolve cada superfície pública animada e mantém um único `IntersectionObserver` para seus descendentes marcados. As páginas e componentes continuam definindo sua estrutura no servidor.

Elementos optam por movimento com atributos semânticos:

- `data-motion="inscription"`: títulos e números são revelados como inscrições.
- `data-motion="excavation"`: cards e fotografias emergem de uma camada visual.
- `data-motion="constellation"`: integrantes e comentários ocupam sua composição final em sequência curta.
- `data-motion="measure"`: notas, escalas e indicadores completam sua leitura.

O controlador usa Web Animations API apenas quando sequenciamento ou interrupção forem necessários. Transições simples permanecem em CSS. O conteúdo é visível por padrão; a ausência ou falha de JavaScript nunca deixa texto escondido.

### Tokens de movimento

Tokens CSS centralizam duração, easing, distância e atraso máximo. A curva principal é `cubic-bezier(0.16, 1, 0.3, 1)`. Listas podem usar stagger, mas o atraso total é limitado para que o último item não pareça lento.

Os módulos de cada página definem a composição visual específica, enquanto `MotionScope` controla apenas observação, preferências de movimento, estado de visibilidade e execução. Essa separação evita um componente genérico repleto de conhecimento sobre todas as páginas.

### `RestaurantAtmosphere`

Uma camada cliente isolada, prevista em `src/features/restaurant/RestaurantAtmosphere.tsx`, envolve `RestaurantReview` sem transformar toda a rota em uma aplicação cliente. Ela encontra a primeira fotografia renderizada, aguarda seu carregamento e envia uma amostra reduzida para uma função pura de seleção cromática.

A seleção de cor fica em um módulo independente, previsto em `src/features/restaurant/photo-palette.ts`. O módulo recebe pixels, descarta transparência, tons quase cinza e extremos muito claros ou escuros, agrupa matizes e escolhe o grupo visualmente dominante. Saturação e luminosidade são normalizadas antes de gerar uma paleta segura.

A página recebe variáveis CSS locais, sem modificar `:root`:

- `--atmosphere-accent`
- `--atmosphere-accent-bright`
- `--atmosphere-surface`
- `--atmosphere-glow`
- `--atmosphere-line`

Essas cores afetam fundos, contornos, brilhos, indicadores e detalhes decorativos. Texto principal, texto secundário e foco visível continuam usando cores de contraste conhecidas. Caso a imagem não carregue, o canvas seja bloqueado ou não exista um matiz utilizável, nenhuma variável é sobrescrita e o laranja atual permanece como fallback.

## Landing page e fotografia da Cratera

O arquivo original `C:\Users\patho\Desktop\cratera.png` tem 1701 × 925 pixels e permanece intacto. Durante a implementação, uma cópia será adicionada a `public/images/cratera.png` e entregue por `next/image`, com otimização automática no navegador.

A fotografia será parte do hero, não um fundo genérico:

1. “Bem-vindo à Cratera” aparece primeiro na ordem visual e no DOM.
2. A imagem surge por uma abertura irregular inspirada no formato de uma cratera.
3. Linhas topográficas acompanham a borda e reforçam a expansão.
4. O início da rolagem amplia a composição até um panorama quase completo, sem controlar a posição de scroll do usuário.
5. Um tratamento escuro localizado protege o contraste onde texto e imagem se encontram.
6. Um pequeno selo editorial identifica a fotografia como “Registro do local da Cratera”.

O efeito aceita enquadramento diferente em larguras desktop, mas preserva o prédio, o horizonte e a leitura do título. A imagem não substitui nem altera a cena Three.js anterior.

## Comportamento por superfície

### `/home`

- Hero com a revelação panorâmica aprovada.
- Títulos de seção usam `inscription`.
- O carrossel preserva controles, teclado e leitura anunciada; a troca usa recorte e profundidade, sem deslocamento brusco.
- Prévia da história emerge como uma nova camada editorial.
- Retratos dos integrantes usam `constellation` com atraso total curto.
- Um único contorno topográfico pode respirar lentamente enquanto estiver visível.

### `/registros`

- O título entra como inscrição.
- Filtros mantêm feedback imediato e não aguardam animação.
- Cards usam `excavation`, com stagger limitado por linha.
- Fotografias recebem mudança sutil de escala e enquadramento no hover de dispositivos compatíveis.
- Resultados vazios e erros permanecem estáticos e claros, exceto pelo feedback necessário das ações.

### `/historia`

- O título principal usa uma revelação autoral única.
- Capítulos entram alternadamente conforme a composição já existente.
- O número do capítulo é gravado antes do corpo do texto.
- Retratos formam uma constelação visual sem alterar a ordem semântica.
- Easter eggs aparecem somente em trechos específicos e não escondem informação funcional.

### `/restaurantes/[slug]`

- A atmosfera cromática transiciona suavemente quando a primeira fotografia produz uma paleta.
- O título e os metadados entram antes da galeria.
- Fotografias surgem como evidências sendo abertas.
- O círculo da nota coletiva completa sua medida uma vez ao entrar na viewport.
- Comentários convergem ao redor do painel central e permanecem estáveis depois da composição.
- “Ver notas” mantém comportamento de botão, foco e `aria-expanded`; a expansão visual acompanha o conteúdo sem animar alturas fixas frágeis.
- Visitas sem fotografia usam a identidade padrão da Cratera e o placeholder existente.

### Superfícies operacionais

Login, painel e fluxos administrativos recebem somente transições funcionais de foco, hover, abertura, sucesso, erro e mudança de estado. A linguagem ritual não pode tornar tarefas administrativas mais lentas.

## Acessibilidade

- `prefers-reduced-motion: reduce` remove deslocamentos, paralaxe, expansão panorâmica e convergência espacial.
- A versão reduzida preserva opacidade, cor e feedback necessários para comunicar estado.
- Nenhuma informação depende de animação, hover ou cor isoladamente.
- Ordem visual e ordem do DOM continuam equivalentes para títulos, capítulos, registros e integrantes.
- Navegação por teclado, foco visível, `aria-live`, `aria-expanded` e rótulos existentes são preservados.
- Contraste textual não depende da paleta extraída da fotografia.

## Falhas e degradação progressiva

- Sem JavaScript, todas as páginas continuam totalmente legíveis e utilizáveis.
- Sem `IntersectionObserver` ou Web Animations API, os elementos permanecem em seu estado final.
- Falha de leitura da fotografia não é exibida como erro ao visitante; a página mantém a paleta padrão.
- Uma imagem sem pixels cromáticos suficientes mantém a paleta padrão.
- Animações interrompidas por navegação, redução de movimento ou mudança de aba terminam em estado visual coerente.
- Nenhum erro de animação interfere em filtros, navegação, disclosures ou ações administrativas.

## Estratégia de testes

### Testes automatizados

- Testar a função pura que converte pixels em paleta: cor dominante, pixels transparentes, imagem acromática e fallback.
- Testar `MotionScope` com `IntersectionObserver`, preferência de movimento reduzido e ausência das APIs opcionais.
- Testar que conteúdo permanece presente e acessível antes da animação.
- Testar que `RestaurantAtmosphere` limita variáveis à página e mantém o fallback em falhas.
- Preservar e executar os testes existentes de home, registros, história, galeria, notas e comentários.

### Verificação estática

- Executar testes, ESLint e build de produção.
- Executar o detector mecânico do Impeccable uma vez ao final dos arquivos de UI alterados.
- Atualizar o grafo do repositório após as mudanças de código.

### Verificação visual

Realizar uma rodada de inspeção em desktop nas larguras 1280, 1440 e 1920 pixels, cobrindo:

- landing page no início e durante a expansão da fotografia;
- livro com registros e estado vazio;
- história, capítulos e integrantes;
- restaurante com fotografia e paleta dinâmica;
- restaurante sem fotografia e fallback;
- disclosure de notas por teclado;
- preferência de movimento reduzido;
- erros de console e estabilidade durante rolagem rápida.

Os defeitos encontrados nessa rodada são corrigidos em um lote, seguido de no máximo uma confirmação visual adicional.

## Critérios de aceite

- A fotografia real da Cratera protagoniza o hero aprovado sem prejudicar o título.
- As quatro superfícies públicas compartilham uma linguagem de movimento reconhecível, mas possuem momentos próprios.
- A página de restaurante assume uma atmosfera coerente com sua primeira fotografia sem alterar o banco.
- Falhas de imagem ou JavaScript mantêm a aparência padrão e todo o conteúdo disponível.
- Movimento reduzido oferece uma experiência deliberada, não apenas animações aceleradas.
- Nenhuma mudança é feita na lógica ou nos arquivos da cena Three.js.
- Não há nova dependência, custo de infraestrutura ou alteração de contrato de dados.
- A implementação permanece dividida em módulos pequenos e substituíveis.
