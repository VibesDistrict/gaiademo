import { supabase } from '@/lib/supabase'

export async function resolvePaymentProofUrl(
  pathOrUrl: string | null | undefined
): Promise<string | null> {
  if (!pathOrUrl) return null
  if (pathOrUrl.startsWith('http')) return pathOrUrl

  const { data } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(pathOrUrl, 3600)

  return data?.signedUrl ?? null
}
