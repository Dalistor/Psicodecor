-- SQL para criar as tabelas no Supabase
-- Execute isto no SQL Editor do seu projeto Supabase
-- Configurado para uso pessoal (sem multi-usuário)

-- Tabela de saves
CREATE TABLE saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  project_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para mapear logos com seus arquivos no storage
CREATE TABLE save_logo_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  save_id UUID NOT NULL REFERENCES saves(id) ON DELETE CASCADE,
  logo_id TEXT NOT NULL, -- ID do logo no projeto
  storage_path TEXT NOT NULL, -- Caminho no storage (bucket/arquivo)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index para melhor performance
CREATE INDEX saves_created_at_idx ON saves(created_at DESC);
CREATE INDEX save_logo_files_save_id_idx ON save_logo_files(save_id);

-- RLS desabilitado para uso pessoal (sem multi-usuário)
