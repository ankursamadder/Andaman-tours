alter table public.enquiries
  alter column travelers drop not null,
  alter column travelers drop default;

alter table public.enquiries
  alter column travel_month drop default;
