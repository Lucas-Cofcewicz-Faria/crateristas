# Configuração do Neon Auth

O Crateristas é um grupo fechado de exatamente oito pessoas. O aplicativo não oferece cadastro
e só encaminha os endpoints necessários para entrada por e-mail e senha, sessão, saída e
recuperação de conta. Essa guarda local não basta sozinha: por padrão, o Neon Auth aceita
cadastros feitos diretamente na Auth URL, sem passar por `/api/auth` do aplicativo.

A proteção principal é o webhook bloqueante `user.before_create`. Ele consulta uma allowlist
server-side de um a oito e-mails antes de qualquer usuário ser gravado. Isso permite começar a
homologação com uma pessoa e adicionar os demais integrantes gradualmente, sem ultrapassar os
oito lugares da sociedade. A implementação
segue a documentação oficial de [fluxo de autenticação](https://neon.com/docs/auth/authentication-flow)
e [webhooks](https://neon.com/docs/auth/guides/webhooks).

## 1. Ativar o Auth no Neon

1. Abra o projeto no [Neon Console](https://console.neon.tech).
2. Selecione a branch usada pelo site.
3. Acesse **Auth** e clique em **Enable Auth**.
4. Em **Auth → Configuration**, mantenha a entrada por e-mail e senha habilitada.
5. Copie a **Auth URL** exibida nessa tela. Ela termina em `/neondb/auth`.

O Auth é configurado por branch. Produção e branches de teste têm usuários, URLs e configuração
de webhook próprios.

## 2. Configurar as variáveis obrigatórias

Adicione estas variáveis a `.env.local` no desenvolvimento e ao ambiente da hospedagem:

```dotenv
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.us-east-1.aws.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=substitua-por-um-segredo-com-32-ou-mais-caracteres
NEON_AUTH_ALLOWED_EMAILS=membro01@example.com,membro02@example.com,membro03@example.com,membro04@example.com,membro05@example.com,membro06@example.com,membro07@example.com,membro08@example.com
```

- `NEON_AUTH_BASE_URL`: a Auth URL copiada do Neon Console; precisa usar HTTPS.
- `NEON_AUTH_COOKIE_SECRET`: segredo exclusivo, com no mínimo 32 caracteres. Use o mesmo valor
  em todas as instâncias do mesmo ambiente e nunca o envie ao Git.
- `NEON_AUTH_ALLOWED_EMAILS`: de um a oito e-mails autorizados, separados por vírgula. A aplicação
  remove espaços e compara em minúsculas. A configuração falha fechada se a lista estiver vazia,
  contiver mais de oito valores, e-mail inválido ou duplicação após a normalização. Ao adicionar
  integrantes, atualize a variável antes de criar as novas contas.

Para gerar um segredo no PowerShell:

```powershell
$bytes = [byte[]]::new(32)
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
[Convert]::ToBase64String($bytes)
```

O acesso aos membros também depende da `DATABASE_URL` descrita na configuração do banco. O
repositório não contém credenciais reais; todas essas variáveis devem existir antes da
verificação de implantação da Task 14.

## 3. Implantar e ativar o webhook bloqueante

Siga esta ordem. Não crie nenhuma conta antes de concluir os quatro primeiros passos.

1. Configure as três variáveis acima na hospedagem.
2. Implante o aplicativo com o endpoint HTTPS público
   `https://SEU-DOMINIO/webhooks/neon-auth`.
3. Ative o webhook do Neon somente para o evento `user.before_create` na mesma branch do Auth.
4. Consulte a configuração e confirme a URL, o evento e `enabled: true`.
5. Só então crie ou provisione as oito contas autorizadas.

O webhook é configurado por projeto e branch pela API do Neon. Substitua os marcadores e use uma
chave de API do Neon apenas no seu terminal:

```powershell
curl.exe -X PUT "https://console.neon.tech/api/v2/projects/{project_id}/branches/{branch_id}/auth/webhooks" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:NEON_API_KEY" `
  --data-binary '{"enabled":true,"webhook_url":"https://SEU-DOMINIO/webhooks/neon-auth","enabled_events":["user.before_create"],"timeout_seconds":5}'
```

Confira o valor efetivo:

```powershell
curl.exe "https://console.neon.tech/api/v2/projects/{project_id}/branches/{branch_id}/auth/webhooks" `
  -H "Authorization: Bearer $env:NEON_API_KEY"
```

O endpoint preserva o corpo bruto e valida a assinatura JWS destacada Ed25519 usando o `kid` e o
JWKS publicado em `<NEON_AUTH_BASE_URL>/.well-known/jwks.json`. Também exige timestamp dentro de
cinco minutos e confere `user.before_create` tanto no header quanto no corpo assinado. Só devolve
`{"allowed":true}` para um dos e-mails configurados. Configuração ausente ou inválida, JWKS indisponível,
assinatura inválida, evento divergente e qualquer outro e-mail falham fechados.

A decisão depende apenas do evento assinado e da allowlist, por isso uma repetição com o mesmo
evento recebe a mesma resposta. Como o Neon rejeita todos os cadastros quando esse webhook fica
indisponível, monitore o endpoint e mantenha o tempo de resposta abaixo do limite configurado.

## 4. Criar as contas fechadas

1. Acesse **Auth → Users** na mesma branch.
2. Crie somente os usuários presentes em `NEON_AUTH_ALLOWED_EMAILS`, começando por uma conta de
   homologação se necessário e chegando a no máximo oito. O Console pode pedir apenas nome e
   e-mail; criar o registro não envia automaticamente um convite nem define uma senha.
3. Depois de implantar o site, abra `/entrar`, escolha **Esqueci minha senha** e informe o mesmo
   e-mail. O integrante recebe um link temporário e define a própria senha em
   `/redefinir-senha`. A resposta da tela é igual para e-mails cadastrados e desconhecidos.
4. Copie o ID de cada usuário. Esse é o valor que será gravado em `members.auth_user_id`.
5. Não habilite OAuth, magic link, OTP, organizações, acesso anônimo ou outro plugin sem revisar
   as duas allowlists: a de endpoints do aplicativo e a de e-mails do webhook.

Não existe um controle global documentado no Console que desative todo cadastro por e-mail e
senha. Portanto, não trate a ausência de uma tela de cadastro como proteção. O handler local
aceita somente uma allowlist explícita por método e caminho canônico: login por e-mail/senha,
logout, sessão/tokens e os endpoints necessários de recuperação e verificação. Cadastro,
`sign-in/social`, magic link, OTP, criação administrativa, usuário anônimo, organizações e fluxos
de plugins recebem `404`, inclusive variantes com barras codificadas.

Na Task 14, teste a proteção real pela Auth URL, e não apenas pela rota local. Uma tentativa com
um e-mail configurado deve ser autorizada durante o provisionamento; uma tentativa com qualquer
outro e-mail deve ser rejeitada em `POST <NEON_AUTH_BASE_URL>/sign-up/email`.

O papel administrativo do site vem de `members.role`, não do papel interno do Neon Auth. Uma
única linha deve receber `admin`; todas as demais devem permanecer como `member`.

## 5. Vincular Auth e membros

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

## 6. Limites de segurança

O `src/proxy.ts` redireciona visitantes sem sessão nas rotas `/painel` e `/visitas`, mas esse é
apenas um filtro otimista. Toda operação privada deve chamar `requireMember()` e toda operação
administrativa deve chamar `requireAdmin()` junto à leitura ou alteração dos dados.
