# Verificação do backend — 06/09/2026

## Correções

- Recuperação de senha: `NEXT_PUBLIC_APP_URL` continua tendo prioridade; na ausência dela, usar o domínio recebido na requisição antes dos hostnames temporários da Vercel. O Neon rejeitava o retorno temporário com `INVALID_REDIRECT_URL`.
- Login: distinguir credenciais inválidas de erros operacionais. Reconhecer também `invalid_credentials`, código normalizado pelo SDK instalado. Logs contêm apenas operação, código permitido e status HTTP, nunca mensagens brutas ou credenciais.
- Exclusão: retirar o limite residual de oito contribuições, mantendo confirmação exata, contagem inteira não negativa, autorização de administrador e proteção contra contagem desatualizada.

## Testes locais

370 testes focados passaram. Outros 23 são opt-in e foram omitidos nessa execução: 20 dependem de `TEST_DATABASE_URL`, e três usam o PostgreSQL local isolado.

Os três testes locais de PostgreSQL foram executados separadamente e passaram:

- Convite reutilizável, cadastro acima de oito integrantes, vínculo idempotente, revogação e impedimento de promoção a administrador.
- Nove notas sem publicação automática, publicação manual e atualização posterior de médias.
- Serviço e SQL reais de criação, prato/comentário, anexo e remoção de metadados de fotos, autorização, publicação, ocultação, republicação e exclusão com contribuição de outro integrante.

O cluster usa exclusivamente `127.0.0.1:55439`, dados sintéticos e nenhum `DATABASE_URL`. Foi encerrado após os testes; a pasta foi preservada. O teste de fotos não envia arquivos ao Blob.

## Verificação do deploy

Produção READY: `dpl_AccpCmoZi19WZHENBZMv2zrkLfcm`, https://crateristas.vercel.app. Build Next.js e TypeScript passaram (build remoto: 54 segundos). Publicação a partir da árvore local develop, sem commit ou alteração da main.

`node scripts/check-deployment.mjs https://crateristas.vercel.app` verifica páginas públicas, bloqueio do painel e de gravações anônimas, o formulário real de recuperação com e-mail inexistente e rejeição de credenciais sintéticas. Não usa sessão real nem cria registros.

Todos esses checks passaram no deployment final.

Uma página de restaurante existente e uma foto WebP no Blob responderam HTTP 200.

## Limites e próximos passos

- Ainda confirmar recebimento do e-mail, redefinição e login com a conta real do administrador; não solicitar senhas nem links secretos no chat.
- Ainda completar o primeiro cadastro real pelo convite e um upload autenticado no deployment. Testes locais e de rotas não substituem esse passo.
- Google Maps permanece pendente de validação com um link real; a verificação atual cobre regras e bloqueio de acesso anônimo, não garante extração ao vivo.
- Nenhum registro, conta ou imagem de produção foi criado ou excluído nos testes.
- Mobile não foi iniciado nesta etapa.
