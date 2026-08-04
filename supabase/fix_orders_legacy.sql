-- Legacy orders table: align columns + CHECK constraints with Gaia Pasta checkout
-- Run entire file once in Supabase SQL Editor

alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists order_type text;
alter table public.orders add column if not exists items jsonb;
alter table public.orders add column if not exists payment_status text;
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists fulfillment text;
alter table public.orders add column if not exists status text;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_ref text;
alter table public.orders add column if not exists subtotal_usd numeric(10,2);
alter table public.orders add column if not exists delivery_fee_usd numeric(10,2);
alter table public.orders add column if not exists total_usd numeric(10,2);
alter table public.orders add column if not exists total_bs numeric(12,2);
alter table public.orders add column if not exists bcv_rate numeric(12,4);
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists rate_bs numeric(12,4);

alter table public.orders alter column customer_name set default 'Cliente';
alter table public.orders alter column order_type set default 'pickup';
alter table public.orders alter column items set default '[]'::jsonb;
alter table public.orders alter column payment_status set default 'pending';
alter table public.orders alter column delivery_address set default '';
alter table public.orders alter column total_bs set default 0;
alter table public.orders alter column bcv_rate set default 0;

-- Replace legacy CHECK constraints so app values are allowed
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check (
  payment_status is null
  or payment_status in (
    'pending',
    'pending_review',
    'paid',
    'verified',
    'rejected',
    'cancelled',
    'unpaid'
  )
);

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (
  status is null
  or status in (
    'pending_payment',
    'payment_review',
    'confirmed',
    'preparing',
    'ready',
    'delivered',
    'picked_up',
    'cancelled',
    'pending',
    'completed',
    'processing'
  )
);

alter table public.orders drop constraint if exists orders_fulfillment_check;
alter table public.orders add constraint orders_fulfillment_check check (
  fulfillment is null or fulfillment in ('pickup', 'delivery')
);

alter table public.orders drop constraint if exists orders_order_type_check;
alter table public.orders add constraint orders_order_type_check check (
  order_type is null or order_type in ('pickup', 'delivery')
);

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check check (
  payment_method is null
  or payment_method in ('pago_movil', 'tarjeta', 'binance')
);
