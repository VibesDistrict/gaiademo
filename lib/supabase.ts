import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
  )
}

export const supabase: SupabaseClient = createClient(
  normalizeSupabaseUrl(supabaseUrl),
  supabaseAnonKey
)
