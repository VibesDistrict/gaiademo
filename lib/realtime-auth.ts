import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export async function syncSupabaseRealtimeAuth(session: Session | null) {
  if (session?.access_token) {
    await supabase.realtime.setAuth(session.access_token)
    return
  }

  await supabase.realtime.setAuth(null)
}
