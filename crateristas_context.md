# Contexto do projeto: Crateristas

## Produto

Crateristas é um livro de registros gastronômicos coletivo para exatamente oito integrantes. Visitantes consultam somente visitas publicadas, médias coletivas, comentários atribuídos e o diretório público de membros. Integrantes autenticados criam visitas, enviam a própria ficha e gerenciam fotos; o administrador pode publicar antes do quórum, ocultar e republicar.

A primeira entrega é desktop-first, validada entre `1280` e `1920 px`. A experiência mobile fica para uma fase posterior.

## Stack e arquitetura

- Next.js `16.2.7`, App Router, React `19.2.4` e TypeScript strict.
- Server Components para leituras e redirects; Route Handlers finos para mutações autenticadas.
- Domínio independente em `src/domain/reviews`: notas, agregação, publicação, schemas, contratos e serviço.
- Persistência em Neon Postgres por `src/lib/repositories/neon-review-repository.ts`.
- Sessões fechadas em Neon Auth; autorização efetiva no servidor com `requireMember()` e `requireAdmin()`.
- Fotos em Vercel Blob, com compressão WebP no cliente e limites repetidos no token/callback e no banco.
- CSS Modules e CSS vanilla; o frontend é dividido em shell, UI, registros, restaurante, membros, autenticação e visitas para permitir evolução isolada.

## Modelo atual

Uma visita pertence a um restaurante e nasce privada, com quórum padrão de seis. Cada membro envia uma ficha com notas inteiras de `0` a `10` para:

- comida (`food`);
- serviço (`service`);
- ambiente (`ambience`);
- custo-benefício (`value`);
- acesso/localização (`access`);
- tempo de espera (`waitTime`).

O comentário é obrigatório, tem até 180 caracteres e uma ficha por membro/visita é garantida no banco. A publicação automática ocorre na sexta participação; a projeção pública retorna somente médias, contagem e comentários, sem e-mail, auth ID ou notas individuais.

## Rotas principais

- Públicas: `/`, `/registros`, `/restaurantes/[slug]`, `/membros`, `/entrar`.
- Privadas: `/painel`, `/visitas/nova`, `/visitas/[id]/avaliar`.
- Compatibilidade: `/home` e `/restaurant/[id]` redirecionam permanentemente para `/registros`; `/add-restaurant` para `/visitas/nova`.
- APIs atuais: Auth, criação/avaliação/publicação/fotos de visitas, webhook Neon Auth e o importador autenticado `/api/parse-maps`.

O protótipo `/api/reviews`, seus painéis de banco, componentes antigos, mocks e fallback em `localStorage` foram removidos. A migration `002_purge_legacy_reviews.sql` apaga somente as linhas de `reviews` se a tabela existir; não migra esses registros, não derruba o schema e não toca nas tabelas novas.

## Fronteiras de segurança

- Não há cadastro público. O webhook `user.before_create` deve aceitar exatamente os oito e-mails configurados em `NEON_AUTH_ALLOWED_EMAILS`; a lista real não pertence ao repositório.
- O Proxy é apenas otimista. Toda leitura/mutação privada revalida a sessão e o papel junto da operação.
- A assistência Google Maps existe somente no fluxo autenticado de criação. Ela valida HTTPS, host, redirects, timeout, tamanho de resposta e um retorno estreito; os campos continuam editáveis.
- Cada visita aceita até cinco WebP, `1600 px` e `750.000 bytes` por arquivo. Falhas de callback têm confirmação autenticada e recuperação segura.
- `npm run db:migrate` escreve em banco externo. Só pode ser usado com uma `DATABASE_URL` já configurada e comprovadamente não produtiva; nunca com placeholder.

## Fronteira Three.js

`src/components/GourmetScene.tsx` e a landing preservam loop, câmera, geometrias, materiais, luzes, partículas, thresholds, temporização, eventos, efeitos e JSX. A única mudança funcional aprovada em `src/app/page.tsx` é o destino final da descida, de `/home` para `/registros`. Não alterar Three.js durante refactors do produto.

## Operação e custo

As variáveis necessárias são `DATABASE_URL`, `TEST_DATABASE_URL` para integrações opcionais, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `NEON_AUTH_ALLOWED_EMAILS` e `BLOB_READ_WRITE_TOKEN`. Consulte `README.md` e `docs/setup/neon-auth.md` antes de configurar ambientes.

Operar sem custo é uma meta condicional às cotas gratuitas atuais de Neon, Vercel Hobby e Blob, não uma garantia ilimitada. Monitore armazenamento e operações, preserve scale-to-zero e não ative add-ons pagos ou gasto sob demanda sem autorização.
