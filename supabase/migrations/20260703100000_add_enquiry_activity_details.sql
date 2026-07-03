alter table public.enquiries
  add column if not exists selected_variant_id text,
  add column if not exists selected_variant_label text,
  add column if not exists selected_variant_price numeric,
  add column if not exists selected_variant_duration text,
  add column if not exists selected_variant_note text,
  add column if not exists booking_details jsonb not null default '{}'::jsonb;
