import { supabase } from '@/lib/supabase'
import type { CustomerAddress } from '@/lib/types'

export function formatCustomerAddress(row: Pick<CustomerAddress, 'label' | 'address'>) {
  const label = row.label.trim()
  const address = row.address.trim()
  if (label && address) return `${label} — ${address}`
  return address || label
}

export async function fetchCustomerAddresses(
  userId: string
): Promise<CustomerAddress[]> {
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data as CustomerAddress[]) ?? []
}

export async function createCustomerAddress(input: {
  userId: string
  label: string
  address: string
  isDefault?: boolean
}) {
  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({
      user_id: input.userId,
      label: input.label.trim(),
      address: input.address.trim(),
      is_default: input.isDefault ?? false,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as CustomerAddress
}

export async function updateCustomerAddress(
  id: string,
  input: {
    label?: string
    address?: string
    isDefault?: boolean
  }
) {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.label !== undefined) patch.label = input.label.trim()
  if (input.address !== undefined) patch.address = input.address.trim()
  if (input.isDefault !== undefined) patch.is_default = input.isDefault

  const { data, error } = await supabase
    .from('customer_addresses')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as CustomerAddress
}

export async function deleteCustomerAddress(id: string) {
  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', id)

  if (error) throw error
}
