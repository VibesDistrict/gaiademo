'use client'

import { FormEvent, useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatUsd } from '@/lib/format'
import {
  getProductImagePublicUrl,
  uploadProductImage,
} from '@/lib/product-images'
import type { Product } from '@/lib/types'
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  inputClassName,
} from '@/components/ui'

const emptyForm = {
  name: '',
  description: '',
  price_usd: '',
  available: true,
  sort_order: '0',
}

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data, error: err } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (err) {
      // fallback if sort_order missing
      const retry = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true })
      if (retry.error) setError(retry.error.message)
      else setProducts((retry.data as Product[]) ?? [])
      return
    }
    setProducts((data as Product[]) ?? [])
  }

  useEffect(() => {
    let active = true
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (!active) return
        if (err) setError(err.message)
        else setProducts((data as Product[]) ?? [])
      })
    return () => {
      active = false
    }
  }, [])

  function startCreate() {
    setEditingId('new')
    setForm(emptyForm)
    setFile(null)
    setError(null)
  }

  function startEdit(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description || '',
      price_usd: String(product.price_usd),
      available: product.available,
      sort_order: String(product.sort_order ?? 0),
    })
    setFile(null)
    setError(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price_usd: Number(form.price_usd),
      available: form.available,
      sort_order: Number(form.sort_order) || 0,
    }

    if (!payload.name || !Number.isFinite(payload.price_usd) || payload.price_usd < 0) {
      setError('Nombre y precio válidos son obligatorios.')
      setBusy(false)
      return
    }

    try {
      let productId = editingId

      if (editingId === 'new') {
        const { data, error: insertError } = await supabase
          .from('products')
          .insert(payload)
          .select('*')
          .single()
        if (insertError || !data) throw insertError ?? new Error('No se creó')
        productId = data.id
      } else if (editingId) {
        const { error: updateError } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingId)
        if (updateError) throw updateError
      }

      if (file && productId && productId !== 'new') {
        const imageUrl = await uploadProductImage(file, productId)
        const { error: imageError } = await supabase
          .from('products')
          .update({ image_url: imageUrl })
          .eq('id', productId)
        if (imageError) throw imageError
      }

      setEditingId(null)
      setForm(emptyForm)
      setFile(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  async function toggleAvailable(product: Product) {
    setBusy(true)
    const { error: err } = await supabase
      .from('products')
      .update({ available: !product.available })
      .eq('id', product.id)
    if (err) setError(err.message)
    else await load()
    setBusy(false)
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) return
    setBusy(true)
    const { error: err } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)
    if (err) setError(err.message)
    else {
      if (editingId === product.id) setEditingId(null)
      await load()
    }
    setBusy(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold">Menú</p>
          <p className="text-xs text-[var(--gp-muted)]">
            Productos, precios y fotos
          </p>
        </div>
        <PrimaryButton
          type="button"
          className="px-3 py-2 text-xs"
          onClick={startCreate}
        >
          + Nuevo
        </PrimaryButton>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {editingId ? (
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
        >
          <p className="font-bold">
            {editingId === 'new' ? 'Nuevo producto' : 'Editar producto'}
          </p>
          <Field label="Nombre">
            <input
              className={inputClassName}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </Field>
          <Field label="Descripción">
            <textarea
              className={`${inputClassName} min-h-20`}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio USD">
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClassName}
                value={form.price_usd}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price_usd: e.target.value }))
                }
                required
              />
            </Field>
            <Field label="Orden">
              <input
                type="number"
                className={inputClassName}
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sort_order: e.target.value }))
                }
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) =>
                setForm((f) => ({ ...f, available: e.target.checked }))
              }
            />
            Disponible en el menú
          </label>
          <Field label="Foto">
            <input
              type="file"
              accept="image/*"
              className={inputClassName}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <div className="flex gap-2">
            <PrimaryButton type="submit" className="flex-1" disabled={busy}>
              {busy ? 'Guardando...' : 'Guardar'}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              className="flex-1"
              onClick={() => setEditingId(null)}
            >
              Cancelar
            </SecondaryButton>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {products.map((product) => {
          const image = getProductImagePublicUrl(product.image_url)
          return (
            <div
              key={product.id}
              className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--gp-cream)]">
                {image ? (
                  <Image
                    src={image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-[var(--gp-muted)]">
                    Sin foto
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">{product.name}</p>
                <p className="text-xs text-[var(--gp-muted)]">
                  {formatUsd(Number(product.price_usd))} ·{' '}
                  {product.available ? 'Disponible' : 'Oculto'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs font-bold text-[var(--gp-red)]"
                    onClick={() => startEdit(product)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-xs font-bold text-[var(--gp-brown)]"
                    disabled={busy}
                    onClick={() => toggleAvailable(product)}
                  >
                    {product.available ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button
                    type="button"
                    className="text-xs font-bold text-red-500"
                    disabled={busy}
                    onClick={() => removeProduct(product)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
