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


-- Allow visitors to submit contact messages without creating an account.
grant insert on table public.messages to anon, authenticated;
grant select, delete on table public.messages to authenticated;


-- Request workflow and admin activity history.
alter table public.messages
  add column if not exists status text not null default 'new'
  check (status in ('new','in_progress','completed'));

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);
alter table public.activity_logs enable row level security;
drop policy if exists "Admin read activity logs" on public.activity_logs;
create policy "Admin read activity logs" on public.activity_logs
for select to authenticated using (public.is_admin());
drop policy if exists "Admin insert activity logs" on public.activity_logs;
create policy "Admin insert activity logs" on public.activity_logs
for insert to authenticated with check (public.is_admin() and actor_id = (select auth.uid()));
grant select, insert on public.activity_logs to authenticated;
grant select, update on public.messages to authenticated;


-- Request workflow and admin activity history.
alter table public.messages
  add column if not exists status text not null default 'new'
  check (status in ('new','in_progress','completed'));

drop policy if exists "Admin update messages" on public.messages;
create policy "Admin update messages" on public.messages
for update to authenticated using (public.is_admin())
with check (public.is_admin());

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);
alter table public.activity_logs enable row level security;
drop policy if exists "Admin read activity logs" on public.activity_logs;
create policy "Admin read activity logs" on public.activity_logs
for select to authenticated using (public.is_admin());
drop policy if exists "Admin insert activity logs" on public.activity_logs;
create policy "Admin insert activity logs" on public.activity_logs
for insert to authenticated with check (public.is_admin() and actor_id = (select auth.uid()));
grant select, insert on public.activity_logs to authenticated;
grant select, update on public.messages to authenticated;


-- AZ Blog publishing
create table if not exists public.blog_posts (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 2 and 140),
 summary text not null check(char_length(summary) between 5 and 300),
 body text not null check(char_length(body) between 10 and 10000),
 published boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.blog_posts enable row level security;
drop policy if exists "Public read published blog" on public.blog_posts;
create policy "Public read published blog" on public.blog_posts for select to anon,authenticated using(published or public.is_admin());
drop policy if exists "Admin manage blog" on public.blog_posts;
create policy "Admin manage blog" on public.blog_posts for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select on public.blog_posts to anon,authenticated;
grant insert,update,delete on public.blog_posts to authenticated;



-- Developer Aziz platform expansion phase 1. Safe to re-run.
alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check check(role in ('owner','admin','editor','support'));
create table if not exists public.service_requests(id uuid primary key default gen_random_uuid(),name text not null,email text not null,service text not null,details text not null,status text not null default 'new' check(status in ('new','reviewing','in_progress','completed','cancelled')),created_at timestamptz not null default now());
alter table public.service_requests enable row level security;
drop policy if exists "Visitors submit service requests" on public.service_requests;
create policy "Visitors submit service requests" on public.service_requests for insert to anon,authenticated with check(char_length(trim(name)) between 2 and 80 and char_length(email) between 5 and 254 and char_length(trim(details)) between 10 and 2500);
drop policy if exists "Admins manage service requests" on public.service_requests;
create policy "Admins manage service requests" on public.service_requests for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant insert on public.service_requests to anon,authenticated; grant select,update,delete on public.service_requests to authenticated;
create table if not exists public.client_projects(id uuid primary key default gen_random_uuid(),client_id uuid not null references auth.users(id) on delete cascade,title text not null,description text not null default '',status text not null default 'planning' check(status in ('planning','in_progress','review','completed')),progress smallint not null default 0 check(progress between 0 and 100),updated_at timestamptz not null default now());
alter table public.client_projects enable row level security;
drop policy if exists "Clients read own projects" on public.client_projects;
create policy "Clients read own projects" on public.client_projects for select to authenticated using(client_id=(select auth.uid()) or public.is_admin());
drop policy if exists "Admins manage client projects" on public.client_projects;
create policy "Admins manage client projects" on public.client_projects for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select,insert,update,delete on public.client_projects to authenticated;
create table if not exists public.chat_messages(id uuid primary key default gen_random_uuid(),project_id uuid references public.client_projects(id) on delete cascade,sender_id uuid not null references auth.users(id) on delete cascade,body text not null check(char_length(trim(body)) between 1 and 3000),created_at timestamptz not null default now());
alter table public.chat_messages enable row level security;
drop policy if exists "Project participants read chat" on public.chat_messages;
create policy "Project participants read chat" on public.chat_messages for select to authenticated using(public.is_admin() or exists(select 1 from public.client_projects p where p.id=project_id and p.client_id=(select auth.uid())));
drop policy if exists "Project participants send chat" on public.chat_messages;
create policy "Project participants send chat" on public.chat_messages for insert to authenticated with check(sender_id=(select auth.uid()) and (public.is_admin() or exists(select 1 from public.client_projects p where p.id=project_id and p.client_id=(select auth.uid()))));
grant select,insert on public.chat_messages to authenticated;
create table if not exists public.client_files(id uuid primary key default gen_random_uuid(),project_id uuid not null references public.client_projects(id) on delete cascade,object_path text not null unique,file_name text not null,uploaded_by uuid not null references auth.users(id),created_at timestamptz not null default now());
alter table public.client_files enable row level security;
drop policy if exists "Project participants read file records" on public.client_files;
create policy "Project participants read file records" on public.client_files for select to authenticated using(public.is_admin() or exists(select 1 from public.client_projects p where p.id=project_id and p.client_id=(select auth.uid())));
drop policy if exists "Admins manage file records" on public.client_files;
create policy "Admins manage file records" on public.client_files for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select,insert,delete on public.client_files to authenticated;
insert into storage.buckets(id,name,public,file_size_limit) values('client-files','client-files',false,10485760) on conflict(id) do nothing;
drop policy if exists "Client project files access" on storage.objects;
create policy "Client project files access" on storage.objects for select to authenticated using(bucket_id='client-files' and (public.is_admin() or exists(select 1 from public.client_files f join public.client_projects p on p.id=f.project_id where f.object_path=name and p.client_id=(select auth.uid()))));
drop policy if exists "Admins upload client files" on storage.objects;
create policy "Admins upload client files" on storage.objects for insert to authenticated with check(bucket_id='client-files' and public.is_admin());
drop policy if exists "Admins delete client files" on storage.objects;
create policy "Admins delete client files" on storage.objects for delete to authenticated using(bucket_id='client-files' and public.is_admin());
create table if not exists public.reviews(id uuid primary key default gen_random_uuid(),name text not null,rating smallint not null check(rating between 1 and 5),body text not null check(char_length(trim(body)) between 5 and 1200),approved boolean not null default false,created_at timestamptz not null default now());
alter table public.reviews enable row level security;
drop policy if exists "Public read approved reviews" on public.reviews;
create policy "Public read approved reviews" on public.reviews for select to anon,authenticated using(approved or public.is_admin());
drop policy if exists "Visitors submit reviews" on public.reviews;
create policy "Visitors submit reviews" on public.reviews for insert to anon,authenticated with check(approved=false and char_length(trim(name)) between 2 and 80);
drop policy if exists "Admins moderate reviews" on public.reviews;
create policy "Admins moderate reviews" on public.reviews for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select,insert on public.reviews to anon,authenticated; grant update,delete on public.reviews to authenticated;
create table if not exists public.academy_lessons(id uuid primary key default gen_random_uuid(),title text not null,description text not null default '',url text,published boolean not null default false,created_at timestamptz not null default now());
alter table public.academy_lessons enable row level security;
drop policy if exists "Public read published lessons" on public.academy_lessons;
create policy "Public read published lessons" on public.academy_lessons for select to anon,authenticated using(published or public.is_admin());
drop policy if exists "Admins manage lessons" on public.academy_lessons;
create policy "Admins manage lessons" on public.academy_lessons for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select on public.academy_lessons to anon,authenticated; grant insert,update,delete on public.academy_lessons to authenticated;
create table if not exists public.digital_products(id uuid primary key default gen_random_uuid(),title text not null,description text not null default '',url text,price_label text,published boolean not null default false,created_at timestamptz not null default now());
alter table public.digital_products enable row level security;
drop policy if exists "Public read published products" on public.digital_products;
create policy "Public read published products" on public.digital_products for select to anon,authenticated using(published or public.is_admin());
drop policy if exists "Admins manage products" on public.digital_products;
create policy "Admins manage products" on public.digital_products for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select on public.digital_products to anon,authenticated; grant insert,update,delete on public.digital_products to authenticated;
create table if not exists public.bug_reports(id uuid primary key default gen_random_uuid(),name text not null,email text not null,details text not null,status text not null default 'open' check(status in ('open','investigating','fixed','closed')),created_at timestamptz not null default now());
alter table public.bug_reports enable row level security;
drop policy if exists "Visitors submit bug reports" on public.bug_reports;
create policy "Visitors submit bug reports" on public.bug_reports for insert to anon,authenticated with check(char_length(trim(details)) between 10 and 2500);
drop policy if exists "Admins manage bug reports" on public.bug_reports;
create policy "Admins manage bug reports" on public.bug_reports for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant insert on public.bug_reports to anon,authenticated; grant select,update,delete on public.bug_reports to authenticated;
create table if not exists public.system_status(id integer primary key check(id=1),state text not null default 'operational' check(state in ('operational','degraded','outage')),message text not null default 'All systems operational',updated_at timestamptz not null default now());
insert into public.system_status(id) values(1) on conflict(id) do nothing;
alter table public.system_status enable row level security;
drop policy if exists "Public read system status" on public.system_status;
create policy "Public read system status" on public.system_status for select to anon,authenticated using(true);
drop policy if exists "Admins update system status" on public.system_status;
create policy "Admins update system status" on public.system_status for update to authenticated using(public.is_admin()) with check(public.is_admin());
grant select on public.system_status to anon,authenticated; grant update on public.system_status to authenticated;
create table if not exists public.security_events(id uuid primary key default gen_random_uuid(),event_type text not null,details text not null default '',created_at timestamptz not null default now());
alter table public.security_events enable row level security;
drop policy if exists "Admins read security events" on public.security_events;
create policy "Admins read security events" on public.security_events for select to authenticated using(public.is_admin());
grant select on public.security_events to authenticated;

-- Maintenance mode: visitors see a maintenance screen while admins retain dashboard access.
alter table public.system_status add column if not exists maintenance_enabled boolean not null default false;
alter table public.system_status add column if not exists maintenance_message text not null default 'The website is currently undergoing scheduled maintenance. Please check back soon.';


-- Owner-managed team accounts and granular permissions.
alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check check(role in ('owner','admin','staff'));
update public.user_roles set role='owner' where role='admin';

create table if not exists public.admin_permissions(
 user_id uuid not null references auth.users(id) on delete cascade,
 permission text not null check(permission in ('profile','projects','messages','requests','blog','reviews','academy','store','maintenance','analytics','clients','bugs')),
 created_at timestamptz not null default now(),
 primary key(user_id,permission)
);
alter table public.admin_permissions enable row level security;
drop policy if exists "Users read own permissions" on public.admin_permissions;
create policy "Users read own permissions" on public.admin_permissions for select to authenticated using(user_id=(select auth.uid()));
grant select on public.admin_permissions to authenticated;

create or replace function public.has_permission(p_permission text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role='owner')
 or exists(select 1 from public.admin_permissions p where p.user_id=(select auth.uid()) and p.permission=p_permission);
$$;
revoke all on function public.has_permission(text) from public;
grant execute on function public.has_permission(text) to authenticated;

create or replace function public.owner_list_team()
returns table(user_id uuid,email text,role text,permissions text[])
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.user_roles where user_roles.user_id=(select auth.uid()) and user_roles.role='owner') then raise exception 'Owner access required'; end if;
 return query select r.user_id,u.email,r.role,coalesce(array_agg(p.permission) filter(where p.permission is not null),'{}'::text[])
 from public.user_roles r join auth.users u on u.id=r.user_id
 left join public.admin_permissions p on p.user_id=r.user_id
 group by r.user_id,u.email,r.role order by r.role,u.email;
end $$;
grant execute on function public.owner_list_team() to authenticated;

create or replace function public.owner_set_team_permissions(p_user_id uuid,p_permissions text[])
returns void language plpgsql security definer set search_path='' as $$
declare v_role text;
begin
 if not exists(select 1 from public.user_roles where user_roles.user_id=(select auth.uid()) and user_roles.role='owner') then raise exception 'Owner access required'; end if;
 select role into v_role from public.user_roles where user_id=p_user_id;
 if v_role is null or v_role='owner' then raise exception 'Cannot change this account'; end if;
 delete from public.admin_permissions where user_id=p_user_id;
 insert into public.admin_permissions(user_id,permission)
 select p_user_id,x from unnest(coalesce(p_permissions,'{}'::text[])) x
 where x in ('profile','projects','messages','requests','blog','reviews','academy','store','maintenance','analytics','clients','bugs')
 on conflict do nothing;
end $$;
grant execute on function public.owner_set_team_permissions(uuid,text[]) to authenticated;

create or replace function public.owner_remove_team_member(p_user_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.user_roles where user_roles.user_id=(select auth.uid()) and user_roles.role='owner') then raise exception 'Owner access required'; end if;
 if exists(select 1 from public.user_roles where user_id=p_user_id and role='owner') then raise exception 'Cannot remove an owner'; end if;
 delete from public.user_roles where user_id=p_user_id;
 delete from public.admin_permissions where user_id=p_user_id;
end $$;
grant execute on function public.owner_remove_team_member(uuid) to authenticated;

-- Apply permissions at the database layer, not only in the dashboard UI.
drop policy if exists "Admin insert profile" on public.profiles;
create policy "Admin insert profile" on public.profiles for insert to authenticated with check(public.has_permission('profile'));
drop policy if exists "Admin update profile" on public.profiles;
create policy "Admin update profile" on public.profiles for update to authenticated using(public.has_permission('profile')) with check(public.has_permission('profile'));
drop policy if exists "Admin insert projects" on public.projects;
create policy "Admin insert projects" on public.projects for insert to authenticated with check(public.has_permission('projects'));
drop policy if exists "Admin update projects" on public.projects;
create policy "Admin update projects" on public.projects for update to authenticated using(public.has_permission('projects')) with check(public.has_permission('projects'));
drop policy if exists "Admin delete projects" on public.projects;
create policy "Admin delete projects" on public.projects for delete to authenticated using(public.has_permission('projects'));
drop policy if exists "Admin read messages" on public.messages;
create policy "Admin read messages" on public.messages for select to authenticated using(public.has_permission('messages'));
drop policy if exists "Admin delete messages" on public.messages;
create policy "Admin delete messages" on public.messages for delete to authenticated using(public.has_permission('messages'));
drop policy if exists "Admin update messages" on public.messages;
create policy "Admin update messages" on public.messages for update to authenticated using(public.has_permission('messages')) with check(public.has_permission('messages'));
drop policy if exists "Admin read page views" on public.page_views;
create policy "Admin read page views" on public.page_views for select to authenticated using(public.has_permission('analytics'));
drop policy if exists "Admin read activity logs" on public.activity_logs;
create policy "Admin read activity logs" on public.activity_logs for select to authenticated using(public.has_permission('analytics'));
drop policy if exists "Admin insert activity logs" on public.activity_logs;
create policy "Admin insert activity logs" on public.activity_logs for insert to authenticated with check(public.has_permission('analytics') and actor_id=(select auth.uid()));
drop policy if exists "Admin manage blog" on public.blog_posts;
create policy "Admin manage blog" on public.blog_posts for all to authenticated using(public.has_permission('blog')) with check(public.has_permission('blog'));
drop policy if exists "Admins manage service requests" on public.service_requests;
create policy "Admins manage service requests" on public.service_requests for all to authenticated using(public.has_permission('requests')) with check(public.has_permission('requests'));
drop policy if exists "Admins manage client projects" on public.client_projects;
create policy "Admins manage client projects" on public.client_projects for all to authenticated using(public.has_permission('clients')) with check(public.has_permission('clients'));
drop policy if exists "Project participants read chat" on public.chat_messages;
create policy "Project participants read chat" on public.chat_messages for select to authenticated using(public.has_permission('clients') or exists(select 1 from public.client_projects p where p.id=project_id and p.client_id=(select auth.uid())));
drop policy if exists "Project participants send chat" on public.chat_messages;
create policy "Project participants send chat" on public.chat_messages for insert to authenticated with check(sender_id=(select auth.uid()) and (public.has_permission('clients') or exists(select 1 from public.client_projects p where p.id=project_id and p.client_id=(select auth.uid()))));
drop policy if exists "Project participants read file records" on public.client_files;
create policy "Project participants read file records" on public.client_files for select to authenticated using(public.has_permission('clients') or exists(select 1 from public.client_projects p where p.id=project_id and p.client_id=(select auth.uid())));
drop policy if exists "Admins manage file records" on public.client_files;
create policy "Admins manage file records" on public.client_files for all to authenticated using(public.has_permission('clients')) with check(public.has_permission('clients'));
drop policy if exists "Admins upload client files" on storage.objects;
create policy "Admins upload client files" on storage.objects for insert to authenticated with check(bucket_id='client-files' and public.has_permission('clients'));
drop policy if exists "Admins delete client files" on storage.objects;
create policy "Admins delete client files" on storage.objects for delete to authenticated using(bucket_id='client-files' and public.has_permission('clients'));
drop policy if exists "Admin upload project media" on storage.objects;
create policy "Admin upload project media" on storage.objects for insert to authenticated with check(bucket_id='project-media' and public.has_permission('projects'));
drop policy if exists "Admin update project media" on storage.objects;
create policy "Admin update project media" on storage.objects for update to authenticated using(bucket_id='project-media' and public.has_permission('projects')) with check(bucket_id='project-media' and public.has_permission('projects'));
drop policy if exists "Admin delete project media" on storage.objects;
create policy "Admin delete project media" on storage.objects for delete to authenticated using(bucket_id='project-media' and public.has_permission('projects'));
drop policy if exists "Admins moderate reviews" on public.reviews;
create policy "Admins moderate reviews" on public.reviews for all to authenticated using(public.has_permission('reviews')) with check(public.has_permission('reviews'));
drop policy if exists "Admins manage lessons" on public.academy_lessons;
create policy "Admins manage lessons" on public.academy_lessons for all to authenticated using(public.has_permission('academy')) with check(public.has_permission('academy'));
drop policy if exists "Admins manage products" on public.digital_products;
create policy "Admins manage products" on public.digital_products for all to authenticated using(public.has_permission('store')) with check(public.has_permission('store'));
drop policy if exists "Admins manage bug reports" on public.bug_reports;
create policy "Admins manage bug reports" on public.bug_reports for all to authenticated using(public.has_permission('bugs')) with check(public.has_permission('bugs'));
drop policy if exists "Admins update system status" on public.system_status;
create policy "Admins update system status" on public.system_status for update to authenticated using(public.has_permission('maintenance')) with check(public.has_permission('maintenance'));
drop policy if exists "Admins read security events" on public.security_events;
create policy "Admins read security events" on public.security_events for select to authenticated using(public.has_permission('analytics'));


-- Tighten and complete permission-specific read policies.
alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check check(role in ('owner','admin','staff','editor','support'));
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','admin'));
$$;
drop policy if exists "Public read published blog" on public.blog_posts;
create policy "Public read published blog" on public.blog_posts for select to anon,authenticated using(published or public.has_permission('blog'));
drop policy if exists "Public read approved reviews" on public.reviews;
create policy "Public read approved reviews" on public.reviews for select to anon,authenticated using(approved or public.has_permission('reviews'));
drop policy if exists "Public read published lessons" on public.academy_lessons;
create policy "Public read published lessons" on public.academy_lessons for select to anon,authenticated using(published or public.has_permission('academy'));
drop policy if exists "Public read published products" on public.digital_products;
create policy "Public read published products" on public.digital_products for select to anon,authenticated using(published or public.has_permission('store'));
