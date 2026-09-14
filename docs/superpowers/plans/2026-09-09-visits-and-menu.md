# Visitas por restaurante e avaliações de menu

## Escopo aprovado

- Restaurante reúne visitas por data; a página abre a visita publicada mais recente e permite escolher anteriores.
- Nova visita reutiliza o restaurante. Entrada pelo painel ou pelo final da página pública.
- Cadastro e gestão seguem o visual atual; notas e sliders têm ondas de cor, respeitando movimento reduzido.
- Importação explícita aceita o link share.google fornecido, mantendo validação de destinos.
- Menu opcional por restaurante, com catálogo e filtros próprios e identidade derivada da capa do restaurante.
- Cada prato reúne contribuições de integrantes: sabor, custo-benefício, UX/apresentação, espera opcional (0–10), RNG opcional (0–100%).
- RNG mede dependência da sorte (alto = mais imprevisível) e não entra na média de qualidade. Campos omitidos não contam como zero.
- Publicação de pratos é manual pelo administrador, como as visitas. Pratos não aparecem no livro global de restaurantes.

## Execução

- [x] Persistência, compatibilidade de links e seleção de visitas.
- [x] Criação e gestão de visitas com restaurante existente e menu opcional.
- [x] Importador share.google e componentes de notas animados.
- [x] Catálogo, detalhe e criação/avaliação/publicação/fotos dos pratos.
- [x] Testes de autorização, agregação, datas e navegação; build e conferência visual local.

## Limites

As páginas públicas só mostram conteúdo publicado; integrantes acessam rascunhos para contribuir. Preservar avaliações, fotos e referências existentes. Nenhuma credencial em arquivos de exemplo. Deploy será verificado separadamente; não criar registros de teste em produção.

## Verificação de 09/09/2026

- 155 testes focados passaram; 26 casos opt-in não foram executados nessa rodada. Os 6 testes novos com PostgreSQL local foram executados separadamente e passaram, incluindo concorrência de fotos e reuso de restaurante.
- Build Next e TypeScript passaram. ESLint passou nos arquivos novos de menu, catálogo, notas compartilhadas, rotas de restaurante e upload.
- Conferência local em 1440 px e 390 px: catálogo, detalhe e formulário; filtros, notas individuais, slider inteiro e payload do formulário com ações simuladas. Nenhuma gravação em produção ou envio real ao Blob. A fonte Manrope falhou na fixture Vite e usou fallback; não foi alterada a configuração de fontes do app.
- Revisão prática feita localmente após interrupção dos subagentes por limite de uso. Não houve revisão independente final nem teste autenticado no deploy.
- Graphify atualizado apenas no repositório, AST sem API. SQL não indexado porque `tree_sitter_sql` não está instalado; a validação SQL foi feita com PostgreSQL real.
- Ativação e limites: `docs/setup/visits-and-menu.md`.
