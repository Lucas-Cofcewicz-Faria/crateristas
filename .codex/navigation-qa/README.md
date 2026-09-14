# Verificação local de navegação

Na raiz do repositório:

```powershell
node node_modules/next/dist/bin/next dev .codex/navigation-qa --webpack --port 3108
```

Abra `http://localhost:3108/home`. Esta aplicação isolada usa o layout e a navbar reais, mas substitui autenticação por um integrante fictício, sem acessar Neon. História e Registros demoram propositalmente 1,8 segundo para expor os estados de carregamento. Confira se Perfil e o cabeçalho permanecem estáveis durante a navegação, também no menu mobile. O logout aqui é inerte. Isto não valida autenticação real nem os dados de produção.
