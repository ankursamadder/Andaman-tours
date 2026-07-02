create extension if not exists pgcrypto;

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  travelers text not null,
  travel_month text,
  message text,
  selected_package_ids text[] not null default '{}'::text[],
  selected_package_names text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

alter table public.enquiries enable row level security;

drop policy if exists "Allow public enquiry inserts" on public.enquiries;

create policy "Allow public enquiry inserts"
on public.enquiries
for insert
to anon, authenticated
with check (true);
