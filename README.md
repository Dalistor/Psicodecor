# Psicodecor Editor

Um editor 3D interativo para criação de placas personalizadas para impressão 3D, com texto customizável, logos e design profissional.

## 📋 Instalação de dependências

```bash
npm install
```

## 🚀 Desenvolvimento

### Modo desenvolvimento com Electron (hot-reload)

```bash
npm run dev
```

A aplicação abrirá em uma janela Electron maximizada com live reload.

### Lint e formatação

```bash
# Verificar erros de código
npm run lint

# Formatar código automaticamente
npm run format
```

## 🏗️ Build para produção

```bash
# Build para Linux (AppImage)
npm run build:linux

# Build para Windows (requer Wine no Linux)
npm run build:win
```

Os instaladores serão gerados em `dist/electron/Packaged/`:

- **Linux**: `.AppImage`
- **Windows**: `.exe` (instalador NSIS)

### Requisitos para build cross-platform

Para gerar instaladores Windows a partir do Linux, instale o Wine:

```bash
# Ubuntu/Debian
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install wine64 wine32
```

## ✨ Funcionalidades

### Editor 3D

- 🎨 **Renderização em tempo real** com Three.js
- 🔄 **OrbitControls** para navegação
- 📐 **Redimensionamento responsivo** (ResizeObserver + resize)
- 🌓 **Tema escuro** por padrao

### Customizacao de Texto

- ✍️ **Titulo e Subtitulo** com controles separados
- 🔤 **26 fontes** do Google Fonts (Cinzel, Abril Fatface, Pacifico, Orbitron, etc.)
- 📏 **Tamanho de fonte** ajustavel
- 📊 **Espacamento de letras** configuravel
- 📍 **Posicionamento X e Y** por elemento
- 🆎 **Multilinha** no titulo
- 🎭 **Profundidade 3D** ajustavel (camadas empilhadas)

### Editor de Imagem (Logo)

- 🖼️ **Upload PNG/JPG/WEBP**
- 🧹 **Remover fundo** (cores claras) com sensibilidade
- ☀️ **Brilho** e 🔲 **Contraste**
- 🎨 **Saturacao** e 🌈 **Rotacao de matiz**
- 🔄 **Inverter cores**
- 📐 **Largura/altura** e 📍 **posicao X/Y**
- 🎭 **Profundidade 3D** da logo

### Elementos da Placa

#### Base

- 🎨 **Cor personalizavel**
- 📏 **Altura ajustavel**
- 📝 **Texto frontal (Subtitulo)** com controles completos

#### Chapa Superior (Top Plate)

- 🎨 **Cor independente**
- 📏 **Altura configuravel**
- 🔷 **6 estilos de aresta**:
  - Canto Vivo
  - Chanfrado Padrao
  - Chanfrado Leve
  - Chanfrado Forte
  - Filetado
  - Topo Rebaixado

### Interface

- 📦 **Menu lateral redimensionavel** (200-600px)
- 📋 **Secoes expansiveis** por categoria
- 🎛️ **Sliders interativos** com feedback visual
- 🎨 **Seletores de cor** integrados

### Persistência de Dados (Armazenamento Local)

- 💾 **Saves Nativos**: Projetos agora usam armazenamento no sistema de arquivos do computador hospedeiro (`userData/saves`).
- 📁 **Arquivos Isolados**: Projetos são armazenados usando serialização via Electron IPC (Inter-Process Communication).
- 〽️ **Nenhuma dependência online**: Aplicativo funciona 100% offline, mantendo logos em string base-64 no arquivo local JSON de gravação.

> **Exemplo de Interface FileSystem (Preload e Main)**
> *   `Request (Vue)`: `window.fsApi.saveProject({ name: 'Placa Dr Joao', projectData: { ... } })`
> *   `IpcMain (Electron)`: `fs.writeFile('~/.config/psicodecor/saves/123912.json', data)`
> *   `Response (Vue)`: `{ id: "123912", name: "Placa Dr Joao", created_at: "2026-03-12T...", ... }`

## 🔧 Tecnologias Utilizadas

- **Framework**: [Quasar Framework v2](https://quasar.dev/) + [Vue 3](https://vuejs.org/)
- **3D Engine**: [Three.js v0.182](https://threejs.org/)
- **Desktop**: [Electron v40](https://www.electronjs.org/)
- **Build Tool**: [Vite v7](https://vitejs.dev/)
- **Bundler**: [electron-builder v26](https://www.electron.build/)
- **Fonts**: [Google Fonts API](https://fonts.google.com/)

## 🎯 Caso de Uso

Ideal para criação de placas personalizadas para:

- 🏢 Placas de identificação profissional
- 🎁 Presentes personalizados
- 🏠 Decoração residencial
- 🏪 Sinalização comercial
- 🎨 Projetos artísticos
- 🖨️ **Impressão 3D** (exportação futura planejada)

## 🤖 Build Automático com GitHub Actions

Para gerar instaladores automaticamente para todas as plataformas:

1. Faça push das suas mudanças para o repositório
2. Acesse a aba **Actions** no GitHub
3. Selecione o workflow **Build Release Installers**
4. Clique em **Run workflow**
5. Insira a versão (ex: `v1.0.0`)

O workflow irá:

- ✅ Build em paralelo para Windows, macOS e Linux
- ✅ Gerar instaladores nativos para cada plataforma
- ✅ Criar uma release no GitHub com todos os arquivos anexados

## ⚙️ Configuração Electron

A aplicação está configurada para:

- ✅ Iniciar maximizada (permite uso da barra do SO)
- ✅ Barra de menu removida em produção
- ✅ Instaladores nativos para cada plataforma
- ✅ Auto-update pronto para implementação futura

## 🛠️ Desenvolvimento

### Estrutura de Pastas

```
psicodecor/
├── src/
│   ├── components/
│   │   └── template/
│   │       ├── SceneTemplate.vue    # Renderização 3D
│   │       └── Text3D.vue
│   ├── composables/
│   │   └── data.js                  # Estado reativo global
│   ├── layouts/
│   │   └── MainLayout.vue           # Layout com drawer
│   ├── pages/
│   │   └── IndexPage.vue            # Página principal
│   └── router/
├── src-electron/
│   ├── electron-main.js             # Processo principal
│   ├── electron-preload.js          # Preload script
│   └── icons/                       # Ícones da aplicação
└── dist/electron/Packaged/          # Instaladores gerados
```

### Performance

- 🚀 **80 camadas máximas** para profundidade 3D
- ⚡ **Debounce de 100ms** para atualização do modelo
- 🎯 **Pixel ratio limitado a 2x** para melhor performance
- 🧹 **Dispose automático** de geometrias e texturas
- 📊 **ResizeObserver** para redimensionamento eficiente

## 📝 Customização

Para customizar o projeto, consulte:

- [Quasar Config](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js)
- [Three.js Docs](https://threejs.org/docs/)
- [Electron Builder](https://www.electron.build/configuration/configuration)

## 🐛 Troubleshooting

### Build falha no Linux

Certifique-se de ter o `wine` instalado para builds Windows.

### Imagem não aparece

Verifique se o formato é PNG/JPG/WEBP e tente ajustar a sensibilidade de remoção de fundo.

### Performance lenta

- Reduza a profundidade 3D dos elementos
- Diminua o tamanho da fonte
- Use imagens menores (< 1MB)

## 📄 Licença

Projeto privado - © 2026 Dalistor

## 👨‍💻 Autor

**Dalistor** - diego.sil.cabral@gmail.com

---

Feito com ❤️ usando Vue 3, Quasar e Three.js
