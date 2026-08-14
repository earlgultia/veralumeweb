-- Run this once in Supabase: SQL Editor > New query > Run.
-- It exposes only the total for reading and a narrowly scoped increment RPC.

create table if not exists public.download_counter (
  id integer primary key check (id = 1),
  total_downloads bigint not null default 0
);

insert into public.download_counter (id, total_downloads)
values (1, 0)
on conflict (id) do nothing;

alter table public.download_counter enable row level security;

create policy "Anyone can read the download total"
on public.download_counter
for select
to anon
using (id = 1);

create or replace function public.record_download()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_total bigint;
begin
  update public.download_counter
  set total_downloads = total_downloads + 1
  where id = 1
  returning total_downloads into updated_total;

  return updated_total;
end;
$$;

revoke all on function public.record_download() from public;
grant execute on function public.record_download() to anon;

-- Required for the browser's Supabase Realtime subscription.
alter publication supabase_realtime add table public.download_counter;
