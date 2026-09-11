# Cadastro compartilhado e publicação manual

## Regras aprovadas

- Um convite reutilizável, destinado ao grupo de WhatsApp, sem expiração automática.
- Administrador pode criar, copiar, substituir ou desativar o convite. Substituir invalida o anterior.
- Cadastro pede nome do craterista, e-mail e senha. Apenas o Neon trata senhas; nunca persistir ou registrar senhas no aplicativo.
- Cadastro cria somente integrante, nunca administrador. Contagem pública vem dos membros efetivamente vinculados.
- Nenhum limite de oito integrantes ou avaliações. Mesa preserva sua composição com navegação entre participantes quando necessário.
- Salvar uma nota jamais publica. Administrador publica com uma ou mais contribuições; novas contribuições continuam atualizando a média.
- Preservar registros existentes, histórico administrativo, identidade visual atual, Three.js e a branch main.

## Execução

- [ ] Remover transição automática de publicação no domínio e na transação SQL; testar o estado privado após seis ou mais notas e atualização de registros públicos.
- [ ] Migrar a numeração de integrantes para sequência sem limite de oito, preservando números existentes.
- [ ] Implementar convite assinado com versão persistida, gerenciado exclusivamente por admin. Não criar convite em leitura/GET.
- [ ] Implementar autorização temporária de cadastro para o webhook Neon, após validação do convite. Assinatura do webhook continua obrigatória.
- [ ] Vincular integrante somente à identidade autenticada e ao comprovante de cadastro guardado em cookie HttpOnly. Tratar verificação de e-mail e retomada após falha sem duplicar perfis.
- [ ] Reutilizar identidade visual do login em cadastro e controles de convite; erros recuperáveis e cópia explícita sobre encaminhamento do link.
- [ ] Atualizar textos e contagens; mostrar todos os integrantes e tornar todos os comentários acessíveis.
- [ ] Executar testes focados, TypeScript e revisão prática; atualizar Graphify. Deploy não faz parte desta etapa.

## Cuidados de integração

Cadastro deve continuar bloqueado diretamente na rota proxy genérica. A autorização temporária do webhook dura cinco minutos e não concede acesso ao app: o vínculo exige sessão válida e cookie secreto de cadastro, com validade de sete dias e convite ainda ativo. O login existente continua funcionando sem esse cookie. Novos perfis usam somente projeções públicas existentes, nunca expõem e-mail ou auth_user_id.
