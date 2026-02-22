# Configuração do Supabase para Sistema de Saves

## O que é Supabase?

Supabase é um backend PostgreSQL open-source com autenticação, storage e realtime. Perfeito para armazenar saves com suporte a arquivos grandes (PNG/SVG).

## Setup Rápido

### 1. Criar Conta e Projeto Supabase

1. Acesse https://supabase.com
2. Clique em "Sign Up" e crie uma conta (GitHub, Google ou email)
3. Crie um novo projeto:
   - Nome: `Psicodecor` (ou qualquer um)
   - Região: Mais próxima de você
   - Senha do banco: Guarde com segurança

### 2. Obter Credenciais

Após criar o projeto:

1. Vá para **Project Settings** (ícone de engrenagem)
2. Clique em **API**
3. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** (chave) → `VITE_SUPABASE_ANON_KEY`

### 3. Configurar Aplicação Local

1. Crie `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto-aqui.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 4. Criar Tabelas no Banco

1. No Supabase, vá para **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo de `docs/SUPABASE_SETUP.sql`
4. Clique em **Run**

### 5. Criar Storage Bucket

1. Vá para **Storage** (no menu esquerdo)
2. Clique em **Create a new bucket**
3. Nome do bucket: `project-logos`
4. Deixar como **Public** (marque a checkbox)
5. Clique em **Create bucket**

### 6. Habilitar Autenticação Anônima

1. Vá para **Authentication** → **Providers**
2. Verifique se "Anonymous Sign-ins" está ativado (deve estar por padrão)
3. Se não estiver, clique em "Anonymous" e ative

## Como Funciona

A arquitetura divide responsabilidades:

```
Frontend (Vue 3)
    ↓
Supabase Client
    ↓
├─ Database (PostgreSQL)
│   └─ Tabelas: saves, save_logo_files
│
└─ Storage (S3-compatible)
    └─ Bucket: project-logos/
```

**Fluxo de Save:**

1. Usuário clica "Save" no SaveManager
2. Dados do projeto salvam em PostgreSQL (`saves` table)
3. Imagens PNG/SVG são enviadas ao Storage (`project-logos` bucket)
4. Caminhos de arquivo são rastreados em `save_logo_files`

**Fluxo de Load:**

1. Usuário clica "Load" em um save anterior
2. Dados JSON são recuperados do banco
3. Imagens são baixadas do Storage como URLs públicas
4. Geometrias 3D são recriadas com as imagens

**Fluxo de Delete:**

1. Cascata automática: deletar save remove logo files do Storage
2. Cleanup eficiente via RLS policies

## Limitações do Plano Gratuito

- **Database**: 500MB
- **Storage**: 1GB
- **Realtime**: limitado
- **Auth**: ilimitado

Para saves com múltiplas imagens PNG/SVG:

- ~100KB média por PNG/SVG
- ~1MB por projeto completo
- Suporta ~1000 projetos com imagens

## Validar Setup Completo

Após executar os 6 passos acima:

1. **Abra o app**: `npm run dev`
2. **Crie um projeto** com:
   - Título em 3D
   - Logo PNG ou SVG
3. **Clique "Save"**:
   - ✅ SaveManager mostra mensagem de sucesso
   - ✅ Projeto aparece na lista de saves
4. **Abra SaveManager novamente**:
   - ✅ Save aparece na lista
5. **Clique "Load"**:
   - ✅ Projeto carrega com título e logo visíveis
6. **Clique "Delete"** e confirme
   - ✅ Save some da lista

Se tudo passar, está funcionando! 🎉

## Troubleshooting

| Erro                    | Solução                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| "Erro ao salvar"        | Verifique credenciais em `.env.local`                                  |
| "Bucket não encontrado" | Verifique se `project-logos` existe em Storage e está Public           |
| "Arquivo muito grande"  | PNG/SVG devem ter < 10MB (alterar em `savesSupabase.js` se necessário) |
| "Tabelas não existem"   | Execute novamente `docs/SUPABASE_SETUP.sql` no SQL Editor              |
| "CORS error"            | Verifique se bucket é Public (não Private)                             |
| "Sem internet Electron" | Salvos requerem conexão; próximo: suporte offline com sincronização    |

## Próximos Passos Opcionais

- Autenticação real (login/senha, Google, GitHub)
- Sincronização em tempo real com outros usuários
- Histórico de versões com undo/redo
- Compartilhamento de projetos
- Export para STL/GLTF para impressão 3D
