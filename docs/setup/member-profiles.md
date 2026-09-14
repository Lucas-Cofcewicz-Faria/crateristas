# Perfis dos crateristas

- **Navbar → Perfil** abre `/perfil`: foto, descrição opcional (até 280 caracteres), link para o perfil público e saída da plataforma.
- **História → integrante** abre `/membros/[slug]`. Visitantes não precisam entrar. E-mail, identificador de autenticação e permissões não são enviados para o perfil público.
- **Painel → Gerenciar integrantes → Definir cargo** é exclusivo do administrador. O título aceita até 60 caracteres; vazio remove o cargo. O cargo não concede permissões de administrador.

## Dados e fotos

Reutiliza `members.bio`, `avatar_url` e `society_title`, sem migração nem serviço adicional. As fotos usam o Vercel Blob já configurado (`BLOB_READ_WRITE_TOKEN`); não é necessário cadastrar outra variável.

O navegador comprime JPEG/PNG/WebP para WebP de até 750 KB. O servidor decodifica e reprocessa a imagem, remove metadados e grava em `members/<id autenticado>/<uuid>.webp`. A edição nunca aceita o ID de outro integrante, URL de imagem, cargo ou papel enviado pelo cliente.

Trocar ou remover a foto atualiza o perfil antes de tentar excluir o arquivo anterior, apenas quando ele pertence ao caminho desse integrante. Uma falha de limpeza não desfaz o perfil salvo. Se houver timeout do banco após o upload, o arquivo novo é preservado: o banco pode já ter confirmado a operação. Esse caso pode deixar um arquivo órfão para manutenção posterior.

Integrantes removidos não aparecem no diretório ou no perfil público e não podem salvar alterações. A autorização administrativa também é conferida na consulta que atualiza o cargo.

## Verificação

Testes focados: `node node_modules/vitest/vitest.mjs run src/features/members src/components/shell/AppHeader.test.tsx`.

Build sem disparar migrações: `node node_modules/next/dist/bin/next build`.

Após o deploy, conferir com contas reais: trocar foto/descrição, abrir o perfil deslogado, atribuir cargo pelo administrador e sair da plataforma. A conferência visual local usa dados sintéticos e não substitui a validação da conexão com Neon e Blob no ambiente publicado.
