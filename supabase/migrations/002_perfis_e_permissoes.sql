-- =====================================================================
-- NutriDecifra — perfis de acesso (Consumidor, Nutricionista, Administrador)
-- Rode DEPOIS do 001_init.sql, inteiro, no SQL Editor do Supabase.
-- É seguro rodar de novo.
--
-- Perfis:
--   consumer      Consumidor. Lê rótulos, recebe alertas, salva produtos, ganha pontos.
--                 Só vê os próprios dados. Decide se compartilha com um nutricionista.
--   nutritionist  Nutricionista (plano Institucional/B2B). Vê, só para leitura, o perfil,
--                 as leituras e os alertas dos pacientes que autorizaram o acesso.
--   admin         Administrador. Vê métricas agregadas da plataforma e a lista de contas,
--                 e define o perfil de cada conta. Não vê as leituras de ninguém.
--
-- Todo cadastro novo nasce como 'consumer'. Só um administrador muda o perfil de uma conta.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Coluna de perfil
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'consumer';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('consumer', 'nutritionist', 'admin'));

-- ---------------------------------------------------------------------
-- 2. Vínculo paciente ↔ nutricionista (consentimento do paciente)
-- ---------------------------------------------------------------------
create table if not exists public.care_links (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references auth.users (id) on delete cascade,
  nutritionist_id  uuid not null references auth.users (id) on delete cascade,
  status           text not null default 'active' check (status in ('active', 'revoked')),
  created_at       timestamptz not null default now(),
  revoked_at       timestamptz,
  unique (patient_id, nutritionist_id),
  check (patient_id <> nutritionist_id)
);
create index if not exists care_links_nutritionist_idx on public.care_links (nutritionist_id, status);

-- ---------------------------------------------------------------------
-- 3. Funções auxiliares (security definer: leem profiles sem cair na própria RLS)
-- ---------------------------------------------------------------------
create or replace function public.current_app_role()
returns text
language sql stable security definer set search_path = ''
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'consumer');
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- true quando o usuário logado é nutricionista e o paciente autorizou o acesso
create or replace function public.is_my_patient(p_patient uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.care_links l
    join public.profiles me on me.id = auth.uid() and me.role = 'nutritionist'
    where l.nutritionist_id = auth.uid()
      and l.patient_id = p_patient
      and l.status = 'active'
  );
$$;

-- ---------------------------------------------------------------------
-- 4. RLS: quem lê o quê
-- ---------------------------------------------------------------------
alter table public.care_links enable row level security;

-- perfis: o próprio (001), o admin vê todos, o nutricionista vê os pacientes vinculados
drop policy if exists "perfil: admin lê todos"             on public.profiles;
drop policy if exists "perfil: nutricionista lê pacientes" on public.profiles;
create policy "perfil: admin lê todos"             on public.profiles for select using (public.is_admin());
create policy "perfil: nutricionista lê pacientes" on public.profiles for select using (public.is_my_patient(id));

-- leituras e alertas: o nutricionista só LÊ as dos pacientes vinculados
drop policy if exists "leituras: nutricionista lê pacientes" on public.scans;
create policy "leituras: nutricionista lê pacientes" on public.scans for select using (public.is_my_patient(user_id));

drop policy if exists "alertas: nutricionista lê pacientes" on public.alerts;
create policy "alertas: nutricionista lê pacientes" on public.alerts for select using (public.is_my_patient(user_id));

-- vínculos: cada lado vê os seus; qualquer lado pode encerrar; só o paciente pode reativar
drop policy if exists "vínculos: ler os meus"     on public.care_links;
drop policy if exists "vínculos: encerrar"        on public.care_links;
create policy "vínculos: ler os meus" on public.care_links for select
  using (auth.uid() in (patient_id, nutritionist_id) or public.is_admin());
create policy "vínculos: encerrar" on public.care_links for update
  using (auth.uid() in (patient_id, nutritionist_id))
  with check (status = 'revoked' or auth.uid() = patient_id);

-- ---------------------------------------------------------------------
-- 5. Permissões por coluna: ninguém altera o próprio perfil de acesso ou plano pela API
-- ---------------------------------------------------------------------
revoke insert, update on public.profiles from authenticated;
grant insert (id, email, name) on public.profiles to authenticated;
grant update (name, restrictions, goal, sugar_limit_g, sodium_limit_mg, realtime_alerts, notifications, accessibility)
  on public.profiles to authenticated;

grant select on public.care_links to authenticated;
grant update (status, revoked_at) on public.care_links to authenticated;
revoke all on public.care_links from anon;

-- ---------------------------------------------------------------------
-- 6. Ações (RPC)
-- ---------------------------------------------------------------------

-- Paciente autoriza um nutricionista pelo e-mail dele
create or replace function public.link_nutritionist(p_email text)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  v_nutri public.profiles;
begin
  if auth.uid() is null then raise exception 'Faça login novamente.'; end if;
  if public.current_app_role() <> 'consumer' then
    raise exception 'Apenas consumidores podem compartilhar dados com um nutricionista.';
  end if;

  select * into v_nutri from public.profiles
   where lower(email) = lower(trim(p_email)) and role = 'nutritionist';
  if not found then
    raise exception 'Nenhum nutricionista cadastrado com este e-mail.';
  end if;

  insert into public.care_links (patient_id, nutritionist_id, status)
  values (auth.uid(), v_nutri.id, 'active')
  on conflict (patient_id, nutritionist_id)
  do update set status = 'active', revoked_at = null, created_at = now();

  return json_build_object('name', v_nutri.name, 'email', v_nutri.email);
end;
$$;

-- Paciente vê com quem compartilha (nome e e-mail do nutricionista)
create or replace function public.my_nutritionists()
returns table (link_id uuid, status text, created_at timestamptz, name text, email text)
language sql stable security definer set search_path = ''
as $$
  select l.id, l.status, l.created_at, p.name, p.email
  from public.care_links l
  join public.profiles p on p.id = l.nutritionist_id
  where l.patient_id = auth.uid()
  order by l.created_at desc;
$$;

-- Administrador muda o perfil de uma conta
create or replace function public.admin_set_role(p_user uuid, p_role text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Acesso restrito a administradores.'; end if;
  if p_role not in ('consumer', 'nutritionist', 'admin') then raise exception 'Perfil inválido.'; end if;
  if p_user = auth.uid() then raise exception 'Você não pode mudar o seu próprio perfil.'; end if;

  update public.profiles set role = p_role where id = p_user;
  if not found then raise exception 'Conta não encontrada.'; end if;

  -- deixou de ser nutricionista: encerra os acessos aos pacientes
  if p_role <> 'nutritionist' then
    update public.care_links set status = 'revoked', revoked_at = now()
     where nutritionist_id = p_user and status = 'active';
  end if;
end;
$$;

-- Administrador: números agregados da plataforma (sem dados individuais de leitura)
create or replace function public.admin_overview()
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  result json;
begin
  if not public.is_admin() then raise exception 'Acesso restrito a administradores.'; end if;

  select json_build_object(
    'users',          (select count(*) from public.profiles),
    'consumers',      (select count(*) from public.profiles where role = 'consumer'),
    'nutritionists',  (select count(*) from public.profiles where role = 'nutritionist'),
    'admins',         (select count(*) from public.profiles where role = 'admin'),
    'new_users_7d',   (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'scans',          (select count(*) from public.scans),
    'scans_7d',       (select count(*) from public.scans where created_at >= now() - interval '7 days'),
    'saved',          (select count(*) from public.scans where saved),
    'healthy_saved',  (select count(*) from public.scans where saved and nutriscore in ('a', 'b')),
    'swaps',          (select count(*) from public.scans where replaced_scan_id is not null),
    'alerts_critical',(select count(*) from public.alerts where severity = 'critical'),
    'alerts_attention',(select count(*) from public.alerts where severity = 'attention'),
    'active_links',   (select count(*) from public.care_links where status = 'active'),
    'grades', (
      select coalesce(json_object_agg(g, n), '{}'::json)
      from (select coalesce(nutriscore, '?') as g, count(*) as n from public.scans group by 1) t
    ),
    'scans_by_day', (
      select coalesce(json_agg(json_build_object('day', d, 'n', n) order by d), '[]'::json)
      from (
        select gs::date as d, (select count(*) from public.scans s where s.created_at::date = gs::date) as n
        from generate_series(current_date - 6, current_date, interval '1 day') gs
      ) t
    ),
    'top_products', (
      select coalesce(json_agg(json_build_object('name', product_name, 'n', n) order by n desc), '[]'::json)
      from (
        select product_name, count(*) as n from public.scans
        group by product_name order by count(*) desc limit 5
      ) t
    )
  ) into result;
  return result;
end;
$$;

revoke all on function public.current_app_role()        from public, anon;
revoke all on function public.is_admin()                from public, anon;
revoke all on function public.is_my_patient(uuid)       from public, anon;
revoke all on function public.link_nutritionist(text)   from public, anon;
revoke all on function public.my_nutritionists()        from public, anon;
revoke all on function public.admin_set_role(uuid, text) from public, anon;
revoke all on function public.admin_overview()          from public, anon;
grant execute on function public.current_app_role()        to authenticated;
grant execute on function public.is_admin()                to authenticated;
grant execute on function public.is_my_patient(uuid)       to authenticated;
grant execute on function public.link_nutritionist(text)   to authenticated;
grant execute on function public.my_nutritionists()        to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_overview()          to authenticated;

-- ---------------------------------------------------------------------
-- 7. Primeiro administrador
-- Depois de criar sua conta pelo app, rode (trocando o e-mail):
--   update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
-- Os próximos perfis podem ser definidos pela tela de administração.
-- ---------------------------------------------------------------------
