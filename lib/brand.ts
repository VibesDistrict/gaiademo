/** Gaia Pasta brand tokens and copy */

export const BRAND = {
  name: 'Gaia Pasta',
  shortName: 'Gaia',
  tagline: 'Pasta hecha con amor',
  logoPath: '/brand/gaia-logo.png',
  patternPath: '/brand/gaia-pattern.png',
  foodPath: '/brand/gaia-food.png',
  productPath: '/brand/gaia-product-1.png',
  neonPath: '/brand/gaia-neon.png',
  storefrontPath: '/brand/gaia-storefront.png',
} as const

export const PRODUCT_FALLBACKS = [
  BRAND.productPath,
  BRAND.foodPath,
  BRAND.productPath,
  BRAND.foodPath,
  BRAND.storefrontPath,
  BRAND.productPath,
] as const

/** Imagen local por producto (si Supabase no tiene image_url) */
export function fallbackProductImage(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % PRODUCT_FALLBACKS.length
  }
  return PRODUCT_FALLBACKS[Math.abs(hash) % PRODUCT_FALLBACKS.length]
}

export const COLORS = {
  red: '#E31B23',
  yellow: '#F5C050',
  cream: '#F7F1E8',
  white: '#FFFFFF',
  ink: '#1C1410',
  muted: '#7A6A5C',
  redDeep: '#C4161E',
  charcoal: '#2A1F1A',
} as const

export type MenuCategoryId =
  | 'all'
  | 'clasicas'
  | 'rellenas'
  | 'mariscos'
  | 'especiales'

export const MENU_CATEGORIES: {
  id: MenuCategoryId
  label: string
  image: string
  match: (name: string, description: string) => boolean
}[] = [
  {
    id: 'all',
    label: 'Todas',
    image: BRAND.logoPath,
    match: () => true,
  },
  {
    id: 'clasicas',
    label: 'Clásicas',
    image: BRAND.foodPath,
    match: (n, d) =>
      /spaghetti|penne|fettuccine|bolognese|arrabbiata|alfredo|pesto/i.test(
        `${n} ${d}`
      ),
  },
  {
    id: 'rellenas',
    label: 'Rellenas',
    image: BRAND.productPath,
    match: (n, d) => /ravioli|lasagna|cannelloni|rellen/i.test(`${n} ${d}`),
  },
  {
    id: 'mariscos',
    label: 'Mariscos',
    image: BRAND.storefrontPath,
    match: (n, d) =>
      /camaron|shrimp|marisco|pescado|calamar/i.test(`${n} ${d}`),
  },
  {
    id: 'especiales',
    label: 'Chef',
    image: BRAND.neonPath,
    match: (n, d) =>
      /especial|chef|trufa|combo|familiar/i.test(`${n} ${d}`),
  },
]
