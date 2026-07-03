alter table public.enquiries
  add column if not exists quoted_total numeric,
  add column if not exists quote_summary jsonb not null default '[]'::jsonb;
