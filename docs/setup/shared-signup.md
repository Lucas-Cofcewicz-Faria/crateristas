# Convite compartilhado

## Publicação

O administrador publica os registros pelo painel. Não há quórum nem publicação automática: salvar avaliações nunca altera a visibilidade. Um registro com ao menos uma contribuição pode ser publicado, ocultado ou republicado; novas notas continuam atualizando as médias.

## Cadastro

Após o deploy e a aplicação de `005_shared_membership.sql`, entre como administrador e use **Convide os Crateristas → Criar convite do grupo → Copiar convite**. Compartilhe no WhatsApp. O mesmo link permite cadastrar várias pessoas. Gerar outro link ou desativar o convite invalida o anterior, sem excluir membros já cadastrados.

A tela pede nome público, e-mail e senha. Novos cadastros recebem exclusivamente o papel `member`. O e-mail e identificadores de autenticação não são publicados. A contagem vem de `members`, sem limite de oito. A mesa mostra oito lugares por vez e oferece navegação para os demais participantes.

Se a configuração do Neon exigir verificação de e-mail, a pessoa confirma o e-mail e entra com sua senha no mesmo navegador para concluir. Em caso de cadastro interrompido, entrar permite retomar; se o comprovante tiver expirado, abra novamente o convite atual antes de entrar. Comprovantes duram sete dias e dependem de convite ativo.

## Remover integrantes pelo painel

Após aplicar `006_member_removal.sql`, o administrador encontra **Gerenciar integrantes** no painel.
A confirmação exige digitar exatamente `Remover integrante`, validado também no servidor.
Contas de administrador são protegidas. A seção mostra o número de avaliações antes de confirmar.

A remoção marca o perfil com data e administrador responsável, sem excluir a conta no Neon Auth.
O aplicativo recusa o acesso privado desse perfil em novas requisições, inclusive com uma sessão
Neon ainda válida. O perfil sai do diretório e da contagem pública; avaliações, comentários,
fotos e suas atribuições continuam nos registros. A lista de removidos só aparece para o administrador.

O mesmo e-mail ou identidade não consegue retornar por convite nem reutilizando um comprovante
de cadastro antigo. Isso não identifica uma pessoa que use outro e-mail e outra conta: o convite
compartilhado continua permitindo novos cadastros. Não há restauração automática pelo painel.
Não altere os registros do Neon manualmente para tentar restaurar o acesso.

## Configuração preservada

- Não há nova variável de ambiente. O convite usa assinatura com separação de domínio e o `NEON_AUTH_COOKIE_SECRET` já configurado. Rotacionar esse segredo também invalida os links.
- Mantenha `NEON_AUTH_ALLOWED_EMAILS` para os acessos previamente autorizados, como o administrador. Não é preciso adicionar cada amigo nessa variável.
- O webhook Neon `user.before_create` deve continuar apontando para `/webhooks/neon-auth` no deployment conectado ao **mesmo banco**. O callback verifica a assinatura Neon antes de consultar uma autorização temporária de cadastro.
- Não habilite cadastro genérico no proxy `/api/auth/[...path]`. O fluxo permitido é a Server Action que valida o convite.
- Senhas nunca são gravadas no banco do aplicativo, logs, documentação ou arquivos de exemplo.
- A migração preserva perfis, números existentes, registros e histórico de publicação. Campos históricos de quórum permanecem por compatibilidade, sem controlar comportamento.

## Verificação desta implementação

Build e TypeScript passaram. A seleção de testes executada passou (278 testes); dois testes adicionais executaram as consultas reais em um PostgreSQL 17 temporário local, incluindo mais de oito cadastros, revogação, vínculo idempotente e nove notas sem publicação automática. Conferência visual desktop em 1440 e 1280 px usou dados sintéticos e não criou contas Neon.

Deploy de produção concluído em 06/09/2026: `dpl_7prCmrQmc97BJM4cPEov6jME4zoM` (READY), disponível em https://crateristas.vercel.app. A migração `005_shared_membership.sql` foi aplicada ao Neon pelo prebuild. Cada comando usa seu próprio statement-breakpoint, conforme exigido pelas consultas preparadas; teste de regressão adicionado.

O fluxo completo de cadastro com uma conta real e eventual envio de e-mail do Neon ainda precisa do primeiro teste pelo convite. O PostgreSQL temporário local foi encerrado e sua pasta preservada.
