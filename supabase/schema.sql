-- Integration groundwork only. Review and apply to a dedicated Supabase project.
create table public.organizers (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 name text not null,
 created_at timestamptz not null default now()
);
create table public.tournaments (
 id uuid primary key default gen_random_uuid(),
 organizer_id uuid not null references public.organizers(id),
 name text not null,
 season text not null,
 currency text not null default 'LKR',
 accent text not null default '#dfb86c',
 created_at timestamptz not null default now()
);
create table public.teams (
 id uuid primary key default gen_random_uuid(),
 tournament_id uuid not null references public.tournaments(id),
 name text not null,
 budget numeric not null check(budget > 0),
 squad_limit integer not null check(squad_limit > 0),
 color text not null,
 unique (id,tournament_id)
);
create table public.players (
 id uuid primary key default gen_random_uuid(),
 tournament_id uuid not null references public.tournaments(id),
 name text not null,
 role text not null,
 country text,
 photo_path text,
 base_price numeric not null check(base_price >= 0),
 status text not null default 'waiting' check(status in ('waiting','sold','unsold')),
 team_id uuid,
 sale_price numeric,
 foreign key (team_id,tournament_id) references public.teams(id,tournament_id),
 check ((status = 'sold' and team_id is not null and sale_price is not null and sale_price >= base_price) or (status <> 'sold' and team_id is null and sale_price is null))
);
alter table public.organizers enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
create policy organizer_owner on public.organizers for all to authenticated using(owner_id = auth.uid()) with check(owner_id = auth.uid());
create policy tournament_owner on public.tournaments for all to authenticated using(exists(select 1 from public.organizers o where o.id = organizer_id and o.owner_id = auth.uid())) with check(exists(select 1 from public.organizers o where o.id = organizer_id and o.owner_id = auth.uid()));
create policy team_owner on public.teams for all to authenticated using(exists(select 1 from public.tournaments t join public.organizers o on o.id = t.organizer_id where t.id = tournament_id and o.owner_id = auth.uid())) with check(exists(select 1 from public.tournaments t join public.organizers o on o.id = t.organizer_id where t.id = tournament_id and o.owner_id = auth.uid()));
create policy player_owner on public.players for all to authenticated using(exists(select 1 from public.tournaments t join public.organizers o on o.id = t.organizer_id where t.id = tournament_id and o.owner_id = auth.uid())) with check(exists(select 1 from public.tournaments t join public.organizers o on o.id = t.organizer_id where t.id = tournament_id and o.owner_id = auth.uid()));
-- Do not grant public display access or direct auction mutation until atomic RPCs exist.
