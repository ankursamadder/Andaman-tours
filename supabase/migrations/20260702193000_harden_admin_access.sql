create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists "Authenticated can manage packages" on public.packages;
drop policy if exists "Authenticated can read enquiries" on public.enquiries;

drop policy if exists "Admin can manage packages" on public.packages;
create policy "Admin can manage packages"
on public.packages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admin can read enquiries" on public.enquiries;
create policy "Admin can read enquiries"
on public.enquiries
for select
to authenticated
using (public.is_admin());

insert into public.admin_users (email)
values (lower('ankur85k@gmail.com'))
on conflict (email) do nothing;
