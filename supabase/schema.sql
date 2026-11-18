-- Developer Aziz Supabase setup. Run in Supabase SQL Editor.
-- Browser code uses anon/publishable key only. Never expose service_role.

create extension if not exists pgcrypto;
create table if not exists public.user_roles(user_id uuid primary key references auth.users(id) on delete cascade,role text not null check(role='admin'));
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role='admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated;

create table if not exists public.profiles(id integer primary key check(id=1),display_name text not null default 'Developer Aziz',headline text not null default 'BUILD. CREATE. INNOVATE.',about text not null default 'A curious mind building skills one project at a time.',location text default 'Qatar',contact_email text,updated_at timestamptz not null default now());
insert into public.profiles(id) values(1) on conflict(id) do nothing;
create table if not exists public.projects(id uuid primary key default gen_random_uuid(),title text not null,description text not null,category text not null default 'Development',url text,image_path text,featured boolean not null default false,sort_order integer not null default 0,created_at timestamptz not null default now());
create table if not exists public.messages(id uuid primary key default gen_random_uuid(),name text not null,email text not null,message text not null,created_at timestamptz not null default now());

alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Read own role" on public.user_roles;
create policy "Read own role" on public.user_roles for select to authenticated using(user_id=(select auth.uid()));

drop policy if exists "Public read profile" on public.profiles;
create policy "Public read profile" on public.profiles for select to anon,authenticated using(true);
drop policy if exists "Admin insert profile" on public.profiles;
create policy "Admin insert profile" on public.profiles for insert to authenticated with check(public.is_admin());
drop policy if exists "Admin update profile" on public.profiles;
create policy "Admin update profile" on public.profiles for update to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "Public read projects" on public.projects;
create policy "Public read projects" on public.projects for select to anon,authenticated using(true);
drop policy if exists "Admin insert projects" on public.projects;
create policy "Admin insert projects" on public.projects for insert to authenticated with check(public.is_admin());
drop policy if exists "Admin update projects" on public.projects;
create policy "Admin update projects" on public.projects for update to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "Admin delete projects" on public.projects;
create policy "Admin delete projects" on public.projects for delete to authenticated using(public.is_admin());

drop policy if exists "Visitor send message" on public.messages;
create policy "Visitor send message" on public.messages for insert to anon,authenticated with check(char_length(trim(name)) between 2 and 80 and char_length(email) between 5 and 254 and char_length(trim(message)) between 10 and 3000);
drop policy if exists "Admin read messages" on public.messages;
create policy "Admin read messages" on public.messages for select to authenticated using(public.is_admin());
drop policy if exists "Admin delete messages" on public.messages;
create policy "Admin delete messages" on public.messages for delete to authenticated using(public.is_admin());

-- Optional public storage bucket for project images; upload/delete is admin-only.
insert into storage.buckets(id,name,public) values('project-media','project-media',true) on conflict(id) do nothing;
drop policy if exists "Public view project media" on storage.objects;
create policy "Public view project media" on storage.objects for select to anon,authenticated using(bucket_id='project-media');
drop policy if exists "Admin upload project media" on storage.objects;
create policy "Admin upload project media" on storage.objects for insert to authenticated with check(bucket_id='project-media' and public.is_admin());
drop policy if exists "Admin update project media" on storage.objects;
create policy "Admin update project media" on storage.objects for update to authenticated using(bucket_id='project-media' and public.is_admin()) with check(bucket_id='project-media' and public.is_admin());
drop policy if exists "Admin delete project media" on storage.objects;
create policy "Admin delete project media" on storage.objects for delete to authenticated using(bucket_id='project-media' and public.is_admin());

-- Create your user under Authentication > Users, copy its UUID, then run:
-- insert into public.user_roles(user_id,role) values('YOUR_USER_UUID','admin');


-- Privacy-friendly daily page-view analytics.
create table if not exists public.page_views (
  view_date date primary key default current_date,
  views bigint not null default 0 check (views >= 0)
);
alter table public.page_views enable row level security;
drop policy if exists "Admin read page views" on public.page_views;
create policy "Admin read page views" on public.page_views
for select to authenticated using (public.is_admin());

create or replace function public.record_page_view()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.page_views(view_date, views)
  values (current_date, 1)
  on conflict (view_date)
  do update set views = public.page_views.views + 1;
$$;
revoke all on function public.record_page_view() from public;
grant execute on function public.record_page_view() to anon, authenticated;
