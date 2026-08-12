# Configuração do Neon Auth

O Crateristas é um grupo fechado. O site terá somente a tela de entrada; não existe página,
ação ou formulário público de cadastro. As oito contas devem ser criadas pelo administrador e
depois vinculadas às oito linhas da tabela `members`.

## 1. Ativar o Auth no Neon

1. Abra o projeto no [Neon Console](https://console.neon.tech).
2. Selecione a branch usada pelo site.
3. Acesse **Auth** e clique em **Enable Auth**.
4. Em **Auth → Configuration**, mantenha a entrada por e-mail e senha habilitada.
5. Copie a **Auth URL** exibida nessa tela. Ela termina em `/neondb/auth`.

O Auth é configurado por branch. Produção e branches de teste têm usuários e URLs próprios.

## 2. Variáveis obrigatórias

Adicione estas variáveis a `.env.local` no desenvolvimento e ao ambiente da hospedagem:

```dotenv
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.us-east-1.aws.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=substitua-por-um-segredo-com-32-ou-mais-caracteres
```

- `NEON_AUTH_BASE_URL`: a Auth URL copiada do Neon Console.
- `NEON_AUTH_COOKIE_SECRET`: segredo exclusivo, com no mínimo 32 caracteres. Use o mesmo valor
  em todas as instâncias do mesmo ambiente e nunca o envie ao Git.

Para gerar um segredo no PowerShell:

```powershell
$bytes = [byte[]]::new(32)
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

O acesso aos membros também depende da `DATABASE_URL` descrita na configuração do banco. O
repositório não contém credenciais reais; elas devem ser configuradas antes da verificação de
implantação da Task 14.

## 3. Criar as oito contas fechadas

1. Acesse **Auth → Users** na mesma branch.
2. Crie exatamente oito usuários com nome, e-mail e uma senha inicial forte. Entregue cada senha
   apenas ao respectivo integrante e solicite sua troca por um canal privado.
3. Copie o ID de cada usuário. Esse é o valor que será gravado em `members.auth_user_id`.
4. Não crie uma tela ou ação `signUp` no aplicativo. O SDK inclui o endpoint Better Auth
   `POST /api/auth/sign-up/email` em seu handler genérico, mas a rota do Crateristas intercepta
   qualquer caminho `sign-up/*` e responde `404` antes de encaminhá-lo ao Neon. Não remova essa
   guarda. A interface pública oferece apenas login.
5. Não habilite OAuth, magic link, OTP ou outro provedor capaz de criar usuários implicitamente
   sem antes adicionar uma guarda equivalente. O fluxo inicial fechado usa apenas e-mail e senha.

A documentação pública atual do Neon não descreve um controle global de auto-cadastro para
e-mail e senha no Console. Por isso, a segurança do grupo fechado não depende de um botão externo:
o bloqueio de `sign-up/*` na rota da aplicação é obrigatório e coberto por teste. Se um provedor
adicional oferecer **Allow New User Registration** (como o Magic Link), mantenha essa opção
desativada como defesa complementar.

O papel administrativo do site vem de `members.role`, não do papel interno do Neon Auth. Uma
única linha deve receber `admin`; as outras sete devem permanecer como `member`.

## 4. Vincular Auth e membros

Depois de aplicar `db/migrations/001_crater_logbook.sql`, substitua todos os valores de exemplo
abaixo pelos IDs, e-mails, nomes e perfis reais. Execute o `INSERT` no SQL Editor da mesma branch:

```sql
INSERT INTO members
  (auth_user_id, email, slug, display_name, member_number, bio, role)
VALUES
  ('AUTH_ID_01', 'membro01@example.com', 'membro-01', 'Membro 01', 1, 'Fundador da sociedade.', 'admin'),
  ('AUTH_ID_02', 'membro02@example.com', 'membro-02', 'Membro 02', 2, 'Integrante da sociedade.', 'member'),
  ('AUTH_ID_03', 'membro03@example.com', 'membro-03', 'Membro 03', 3, 'Integrante da sociedade.', 'member'),
  ('AUTH_ID_04', 'membro04@example.com', 'membro-04', 'Membro 04', 4, 'Integrante da sociedade.', 'member'),
  ('AUTH_ID_05', 'membro05@example.com', 'membro-05', 'Membro 05', 5, 'Integrante da sociedade.', 'member'),
  ('AUTH_ID_06', 'membro06@example.com', 'membro-06', 'Membro 06', 6, 'Integrante da sociedade.', 'member'),
  ('AUTH_ID_07', 'membro07@example.com', 'membro-07', 'Membro 07', 7, 'Integrante da sociedade.', 'member'),
  ('AUTH_ID_08', 'membro08@example.com', 'membro-08', 'Membro 08', 8, 'Integrante da sociedade.', 'member');
```

Confirme que cada ID foi associado ao e-mail correto:

```sql
SELECT member_number, display_name, email, auth_user_id, role
FROM members
ORDER BY member_number;
```

O sistema só autoriza uma sessão quando `session.user.id` encontra uma linha em
`members.auth_user_id`. Portanto, uma conta existente no Neon Auth, mas ausente em `members`, não
consegue acessar o painel.

## 5. Limites de segurança

O `src/proxy.ts` redireciona visitantes sem sessão nas rotas `/painel` e `/visitas`, mas esse é
apenas um filtro otimista. Toda operação privada deve chamar `requireMember()` e toda operação
administrativa deve chamar `requireAdmin()` junto à leitura ou alteração dos dados.
