-- Owner-managed team accounts and granular permissions.
alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check check(role in ('owner','admin','staff'));
-- IMPORTANT: replace this email with the email of YOUR existing admin account.
-- This promotes only your account to owner; other admins are not promoted.
update public.user_roles
set role='owner'
where user_id = (
  select id from auth.users
  where lower(email) = lower('YOUR_ADMIN_EMAIL')
)
and role in ('admin','owner');

-- Stop safely if the email was not found in the existing admin accounts.
do $
begin
  if not exists (
    select 1
    from public.user_roles r
    join auth.users u on u.id = r.user_id
    where lower(u.email) = lower('YOUR_ADMIN_EMAIL')
      and r.role = 'owner'
  ) then
    raise exception 'Owner account not found. Check YOUR_ADMIN_EMAIL and ensure this user already has an admin role.';
  end if;
end $;

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
