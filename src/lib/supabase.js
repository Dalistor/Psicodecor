import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    'Supabase não configurado. Crie um arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY',
  )
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '')

// Funções auxiliares
export async function ensureUserLogged() {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    // Faz login anônimo
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()
    if (anonError) throw anonError
    return anonData.user
  }

  return data.user
}
