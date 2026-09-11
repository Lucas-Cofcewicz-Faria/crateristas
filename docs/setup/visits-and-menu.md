# Visitas por data e menu

## Ativação no deploy

A migração `007_restaurant_menu.sql` adiciona a opção de menu, as tabelas de pratos, notas e fotos, além de um índice para visitas por data. Ela é aditiva: não apaga avaliações nem fotos existentes.

O comando normal `npm run build` já executa `scripts/migrate.mjs` no prebuild. No próximo deploy, confirme que `DATABASE_URL` aponta para a branch Neon correspondente ao ambiente. Não copie credenciais para arquivos de exemplo. O teste de build desta implementação usou `next build` diretamente, sem executar migrações no banco configurado.

O envio de fotos de pratos usa a integração Vercel Blob existente e a mesma credencial `BLOB_READ_WRITE_TOKEN`. Não foi adicionado serviço pago nem dependência nova.

## Como usar

1. No painel, abra **Gerenciar reviews** para editar uma visita ou **Registrar nova visita** para cadastrar um restaurante. Para revisitar um restaurante existente, use **Adicionar nova visita ao restaurante** no final da página dele: o restaurante já vem definido e não pode ser trocado nesse fluxo.
2. Marque a opção de incluir menu no cadastro da visita. Ela também pode habilitar o menu de um restaurante já existente; uma visita posterior não o desabilita.
3. Na página pública, a data selecionada inicialmente é a visita publicada mais recente, ordenada pela data da visita. **Outras visitas** permite acessar datas anteriores. Links antigos continuam resolvendo o restaurante.
4. Abra **Menu** na gestão da visita ou ao lado da navegação por datas na página do restaurante. **Adicionar prato** cadastra nome, descrição/preço opcionais e a primeira contribuição. A etapa seguinte permite enviar fotos antes de **Concluir e ver prato**. Novos pratos recebem “Sem categoria”; os valores antigos são preservados. O criador ou administrador também pode enviar fotos em **Avaliar prato**, até cinco imagens comprimidas em WebP de até 750.000 bytes cada. A página pública não contém o uploader.
5. Outros integrantes podem abrir o prato e usar **Avaliar prato**. Cada pessoa edita somente sua contribuição. O administrador controla a publicação e pode ocultar o prato novamente.

Pratos não entram no catálogo global de restaurantes. O catálogo de menu usa os mesmos campos de busca dos registros, para nome/descrição e categoria, sem listas suspensas. Visitantes só veem pratos publicados, em restaurantes com pelo menos uma visita publicada. Integrantes também veem rascunhos e pratos ocultos.

## Notas e RNG

Sabor, custo-benefício e UX são obrigatórios, com notas inteiras de 0 a 10. Tempo de espera é opcional na mesma escala. O cálculo coletivo dá peso igual à média individual de cada integrante; critérios opcionais não preenchidos são ignorados, não convertidos em zero.

RNG representa a dependência da sorte: quanto maior o percentual, pior a previsibilidade do prato. Ele tem média separada e não altera a nota de qualidade. O número de contribuições de cada campo opcional é calculado separadamente. Os percentuais cadastrados foram preservados, sem conversão automática. A interface usa apenas “RNG” e o valor, sem explicações adicionais.

RNG não aparece quando ninguém o informou; zero é uma resposta válida e continua visível. Os critérios reutilizam as placas quadradas da avaliação do restaurante. O seletor de outras visitas abre por hover e também aceita clique, teclado e Escape.

No desktop, a mesa do prato tem a nota geral centralizada e os critérios nos cantos; o RNG ocupa a posição inferior central quando informado. No mobile, permanece a composição empilhada, com a nota acima dos critérios.

O caminho `/menu-items/**` do Blob público foi incluído na configuração de imagens do Next. A ausência dessa permissão causava imagens quebradas após o upload; a correção precisa de deploy para atingir o site publicado.

As notas e os sliders usam os componentes compartilhados com ondas de cor, pausadas fora da tela, em abas ocultas e quando há preferência por movimento reduzido. O menu herda a paleta da capa pública mais recente do restaurante; sem uma capa utilizável, mantém a paleta padrão.

## Validação e pendências de ambiente

Foram verificados testes de formulários/rotas, build e permissões/concorrência com PostgreSQL local descartável. A fixture visual `.codex/menu-qa` usa dados sintéticos e ações simuladas, não autenticação real. Fotos reais no Blob e a migração no ambiente Vercel precisam de conferência após o deploy. Não houve publicação, push ou migração em produção nesta etapa.
