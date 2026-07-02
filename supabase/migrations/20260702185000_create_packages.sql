create extension if not exists pgcrypto;

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  duration text not null default '',
  price numeric not null default 0,
  price_unit text not null default 'per person',
  category text not null default 'Custom',
  rating numeric not null default 0,
  reviews integer not null default 0,
  cover text not null default '',
  gallery text[] not null default '{}'::text[],
  places text[] not null default '{}'::text[],
  highlights text[] not null default '{}'::text[],
  inclusions text[] not null default '{}'::text[],
  exclusions text[] not null default '{}'::text[],
  itinerary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_packages_updated_at on public.packages;

create trigger set_packages_updated_at
before update on public.packages
for each row
execute function public.set_updated_at();

alter table public.packages enable row level security;

drop policy if exists "Public can read packages" on public.packages;
create policy "Public can read packages"
on public.packages
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated can manage packages" on public.packages;
create policy "Authenticated can manage packages"
on public.packages
for all
to authenticated
using (true)
with check (true);
