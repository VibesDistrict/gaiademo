import { supabase } from '@/lib/supabase'

const BUCKET = 'product-images'

export function getProductImagePublicUrl(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return null
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('/')
  ) {
    return pathOrUrl
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(pathOrUrl)
  return data.publicUrl
}

export async function uploadProductImage(file: File, productId: string) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${productId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw error
  return getProductImagePublicUrl(path)
}
