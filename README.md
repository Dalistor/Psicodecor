# Psicodecor Editor (psicodecor)

Um programa de edição de uma logo padrão

## Instalação de dependências

```bash
npm install
```

### Desenvolvimento com Electron (modo hot-reload)

```bash
npm run dev
```

A aplicação abrirá em uma janela Electron maximizada.

### Lint dos arquivos

```bash
npm run lint
```

### Formatação de arquivos

```bash
npm run format
```

### Build para produção (Electron)

```bash
npm run build
```

Os instaladores serão gerados em `dist/electron/Packaged/` para:

- **Windows**: arquivos `.exe` e `.msi`
- **macOS**: arquivos `.dmg` e `.zip`
- **Linux/Ubuntu**: arquivos `.AppImage` e `.deb`

### Build e Release automático com GitHub Actions

Para gerar instaladores automaticamente para todas as plataformas:

1. Faça push das suas mudanças para o repositório
2. Vá para a aba **Actions** no GitHub
3. Selecione o workflow **Build Release Installers**
4. Clique em **Run workflow**
5. Insira a versão do release (ex: `v1.0.0`)
6. O workflow irá:
   - Fazer build em Windows, macOS e Linux em paralelo
   - Gerar os instaladores para cada plataforma
   - Criar uma release no GitHub com todos os arquivos

### Configuração Electron

A aplicação está configurada para:

- ✅ Iniciar maximizada (sem fullscreen, permitindo uso da barra do SO)
- ✅ Remover a barra de menu em produção
- ✅ Gerar instaladores nativos para cada plataforma

### Recursos da aplicação

- 🎨 Editor interativo 3D com Three.js
- 📝 Edição de texto com múltiplas fontes Google Fonts
- 🖼️ Upload de imagens PNG para logo
- 🎯 Controle de posição horizontal e vertical
- 🌙 Tema escuro por padrão
- 📦 Menu lateral redimensionável

### Customização

Veja [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
