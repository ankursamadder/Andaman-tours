drop policy if exists "Authenticated can read enquiries" on public.enquiries;

create policy "Authenticated can read enquiries"
on public.enquiries
for select
to authenticated
using (true);
