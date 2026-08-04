# Gaia Pasta

App de pedidos: **Dinner In (QR)**, delivery, pick up, registro y caja en tiempo real.

## Stack

- Next.js 16 + React 19 + Tailwind 4 + Framer Motion
- Supabase (Auth, Postgres, Storage, Realtime)
- Deploy: Vercel

## Variables de entorno

Copia `.env.example` → `.env.local` (local) o configúralas en Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # o sb_publishable_...
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
```

Opcional (cron tasa BCV):

```env
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=...
```

## Local

```bash
npm install
cp .env.example .env.local
# rellena keys
npm run dev
```

En Supabase → SQL Editor ejecuta `supabase/schema.sql` (y el resto de SQL si hace falta).

## Deploy (otra cuenta GitHub + Vercel)

### 1. GitHub (cuenta nueva)

1. Crea un repo vacío, por ejemplo `gaia-pasta` (sin README).
2. Desde esta carpeta:

```bash
git add .
git commit -m "Initial Gaia Pasta app"
git branch -M main
git remote add origin https://github.com/TU_OTRA_CUENTA/gaia-pasta.git
git push -u origin main
```

(Si ya hay remote, cámbialo: `git remote set-url origin ...`)

### 2. Vercel (cuenta nueva)

1. [vercel.com](https://vercel.com) → **Add New Project** → Import el repo de GitHub.
2. Framework: **Next.js** (auto).
3. **Environment Variables** (Production + Preview):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key |
| `NEXT_PUBLIC_SITE_URL` | `https://tu-proyecto.vercel.app` (ajusta tras el primer deploy) |

4. Deploy.
5. Actualiza `NEXT_PUBLIC_SITE_URL` con la URL final y redespliega.
6. En Supabase → Authentication → URL Configuration:
   - **Site URL:** tu dominio Vercel
   - **Redirect URLs:** `https://tu-dominio.vercel.app/**`

### 3. Dinner In QR

Links de mesa: `https://tu-dominio.vercel.app/m/mesa-1`  
Admin → Ajustes → Mesas → copiar links e imprimir QR.

## Estructura
Deploy: Vercel production
```
app/                 # rutas (/, /m/[code], /admin, /cart…)
components/          # layout, menu, cart, orders, admin…
lib/                 # brand, cart, auth, supabase…
supabase/            # schema + migrations
public/brand/        # logo y fotos
```
