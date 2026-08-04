import { createClient } from '@supabase/supabase-js'

function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
}

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  return createClient(normalizeSupabaseUrl(url), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
