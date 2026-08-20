# Crateristas

Livro de registros gastronômicos de um grupo fechado de oito crateristas. Cada visita reúne seis notas de `0` a `10` — comida, serviço, ambiente, custo-benefício, acesso/localização e tempo de espera — e um comentário de até 180 caracteres por integrante. A sexta ficha publica a visita automaticamente; o administrador também pode publicar antecipadamente, ocultar e republicar.

## Rotas

- `/`: landing Three.js; ao fim da descida, segue para `/registros`.
- `/registros`: arquivo público filtrável das visitas publicadas.
- `/restaurantes/[slug]`: detalhe público, médias coletivas, comentários e até cinco fotos.
- `/membros`: diretório público sem e-mails, IDs de autenticação ou notas individuais.
- `/entrar`: entrada das oito contas já provisionadas; não há cadastro público.
- `/painel`: visitas em formação e publicações recentes do membro autenticado.
- `/visitas/nova`: criação autenticada de visita, com assistência opcional do Google Maps.
- `/visitas/[id]/avaliar`: ficha própria, fotos e controles administrativos autorizados.

Bookmarks antigos continuam compatíveis: `/home` e `/restaurant/[id]` redirecionam para `/registros`; `/add-restaurant` redireciona para `/visitas/nova`. O endpoint antigo `/api/reviews` foi removido.

## Regras e limites

- Exatamente oito contas permitidas por uma allowlist server-side e webhook bloqueante `user.before_create`.
- Quórum padrão de seis; cada membro envia ou edita somente uma ficha por visita.
- A saída pública mostra médias coletivas e comentários atribuídos, nunca notas numéricas individuais.
- Fotos são WebP, no máximo cinco por visita, até `1600 px` no maior lado e `750.000 bytes` por arquivo.
- A importação do Google Maps é somente assistência autenticada em `/visitas/nova`: aceita hosts oficiais, valida redirecionamentos, limita tempo/tamanho e retorna sugestões editáveis. Não há scraper público.
- Não existe fallback em `localStorage` nem dado mock publicado.

## Desenvolvimento

Requer Node.js compatível com Next.js 16 e um Postgres Neon configurado.

```powershell
npm install
npm run dev
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Variáveis de ambiente

Configure valores reais somente em `.env.local` e na hospedagem; nunca faça commit de credenciais:

- `DATABASE_URL`: conexão do Neon usada pela aplicação e pelo runner de migrations.
- `TEST_DATABASE_URL`: branch/banco descartável que habilita as integrações PostgreSQL condicionais.
- `NEON_AUTH_BASE_URL`: Auth URL HTTPS da branch Neon.
- `NEON_AUTH_COOKIE_SECRET`: segredo de cookie com pelo menos 32 caracteres.
- `NEON_AUTH_ALLOWED_EMAILS`: exatamente oito e-mails únicos, normalizados e separados por vírgula. O repositório não publica a lista real.
- `BLOB_READ_WRITE_TOKEN`: token do Vercel Blob para uploads e limpeza server-side.

O provisionamento completo das oito contas, allowlist e webhook está em [docs/setup/neon-auth.md](docs/setup/neon-auth.md).

O estado reproduzível dos testes locais e os passos ainda pendentes de banco, autenticação, Blob e inspeção desktop estão no [checklist de verificação](docs/verification/crater-logbook-checklist.md). Itens sem credenciais ou navegador real permanecem marcados como pendentes; não são tratados como aprovados por inferência.

## Banco e migrations

`db/migrations/001_crater_logbook.sql` cria o domínio atual. `002_purge_legacy_reviews.sql` mantém a tabela antiga `reviews`, mas apaga suas linhas por decisão explícita de descarte do protótipo; a operação é guardada para a relação ausente e idempotente.

```powershell
npm run db:migrate
```

Esse comando é uma escrita externa. Execute-o somente depois de confirmar que `DATABASE_URL` já aponta para a branch não produtiva pretendida; não use placeholders nem uma URL de produção para teste. A execução e inspeção remotas ficaram para a verificação da Task 14.

## Implantação

Antes de implantar, aplique as migrations na branch correta, ative Neon Auth e o webhook bloqueante, vincule as oito contas à tabela `members`, configure o Blob público e todas as variáveis na Vercel. Rode testes, lint, tipos e build localmente.

O objetivo de custo zero é condicional às cotas gratuitas vigentes de Neon, Vercel Hobby e Blob. Monitore armazenamento/operações e não habilite add-ons pagos ou gasto sob demanda sem nova decisão.
