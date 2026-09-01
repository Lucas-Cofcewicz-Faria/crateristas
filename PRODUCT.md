# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Oito amigos que visitam restaurantes juntos e registram suas avaliações como integrantes dos Crateristas.
- Visitantes públicos que consultam os restaurantes, as notas coletivas, os comentários e a história do grupo.

## Product Purpose

Crateristas transforma as refeições do grupo em um livro público de registros. Cada integrante contribui com notas e um comentário curto; o sistema reúne as avaliações individuais em médias coletivas sem produzir um veredito textual para o visitante.

## Positioning

O produto não é um catálogo genérico de restaurantes. Ele é o arquivo de uma sociedade de amigos, organizado ao redor da cratera inexplicável em frente ao restaurante favorito do grupo e construído a partir de avaliações coletivas de experiências realmente compartilhadas.

## Operating Context

- Depois de uma refeição conjunta, os integrantes autenticados avaliam a mesma visita.
- Cada integrante informa notas, comentário curto e o prato pedido.
- A publicação se torna pública após a quantidade configurada de contribuições, ou antes disso por decisão do administrador supremo.
- Visitantes consultam os registros publicados, os restaurantes e a identidade dos integrantes sem precisar entrar.

## Capabilities and Constraints

- A entrada Three.js da cratera permanece em `/`; ao concluir a descida, o visitante segue para a landing page em `/home`.
- A landing page apresenta título, restaurantes publicados mais recentes, história e integrantes, com chamadas para suas páginas correspondentes.
- O livro público de restaurantes permanece em `/registros`.
- A história da cratera e os integrantes passam a compartilhar a página pública `/historia`; `/membros` permanece apenas como redirecionamento de compatibilidade.
- As notas individuais são públicas sob demanda, enquanto as médias coletivas permanecem como leitura principal.
- Não há veredito gerado: comentários e notas deixam a interpretação final para o visitante.
- Toda a interface e o conteúdo do produto são escritos em português brasileiro.
- O foco atual é exclusivamente desktop; uma adaptação mobile será tratada depois de um resultado desktop satisfatório.
- A solução deve permanecer compatível com infraestrutura de custo zero.

## Brand Commitments

- Nome público: Crateristas.
- A cratera, o livro de registros e a sociedade formam a identidade narrativa do produto.
- A cena Three.js da entrada é uma experiência aprovada e deve ser preservada, exceto quando mudanças forem explicitamente autorizadas.
- O tom combina registro editorial com pequenos indícios e easter eggs sobre a sociedade da cratera, sem explicar todo o mistério.
- O cânone da sociedade inclui Lucas como descobridor da cratera, os Discípulos, o Monarca Guizão e a preservação da fauna local de mosquitos.

## Evidence on Hand

- Registros públicos, notas, comentários, pratos e fotos de restaurantes são provenientes do banco de dados do produto.
- Perfis e fotos dos integrantes são provenientes do diretório público existente.
- A experiência visual da cratera está implementada em `src/components/GourmetScene.tsx`.
- A cratera é grande, fica ao lado de um restaurante considerado muito bom pelo grupo e foi descoberta por Lucas.
- As visitas recorrentes ao restaurante se tornaram uma peregrinação; os Discípulos passaram a venerar a cratera junto ao Monarca Guizão.
- A cratera é considerada uma importante forma de conservação da fauna local de mosquitos.
- Datas e uma cronologia mais precisa ainda não foram fornecidas; futuras versões não devem inventá-las sem confirmação.

## Product Principles

- Preservar a natureza coletiva de cada avaliação.
- Mostrar evidências reais do grupo em vez de fabricar autoridade editorial.
- Fazer a sociedade da cratera emergir aos poucos, sem eliminar o mistério.
- Manter ações administrativas explícitas, seguras e reversíveis quando possível.
- Priorizar uma experiência desktop autoral antes de expandir para outros dispositivos.

## Accessibility & Inclusion

- Navegação por teclado, foco visível e semântica adequada devem continuar disponíveis.
- Movimentos decorativos respeitam `prefers-reduced-motion` sem apagar mudanças de estado importantes.
