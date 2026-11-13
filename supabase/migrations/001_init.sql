-- =====================================================================
-- NutriDecifra — estrutura do banco de dados (Supabase / Postgres)
-- Rode este arquivo inteiro uma única vez no SQL Editor do Supabase.
-- É seguro rodar de novo: usa "if not exists" / "or replace".
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PERFIS — um por usuário (criado automaticamente no cadastro)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  name              text,
  email             text,
  -- restrições: 'gluten', 'lactose', 'sugar', 'sodium'
  restrictions      text[]  not null default '{}',
  -- objetivo: 'reduce_sugar' | 'reduce_sodium' | 'eat_better' | 'avoid_ultra'
  goal              text    not null default 'reduce_sugar',
  sugar_limit_g     integer not null default 25  check (sugar_limit_g between 5 and 200),
  sodium_limit_mg   integer not null default 400 check (sodium_limit_mg between 50 and 5000),
  realtime_alerts   boolean not null default true,
  notifications     boolean not null default true,
  -- preferências de acessibilidade (texto maior, contraste, voz, etc.)
  accessibility     jsonb   not null default '{}'::jsonb,
  plan              text    not null default 'free',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. LEITURAS — cada produto lido pelo scanner
-- ---------------------------------------------------------------------
create table if not exists public.scans (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  barcode            text not null,
  product_name       text not null,
  brand              text,
  quantity           text,
  image_url          text,
  nutriscore         text,             -- 'a'..'e' ou null quando desconhecido
  nova_group         integer,
  sugars_100g        numeric,
  sat_fat_100g       numeric,
  sodium_100g        numeric,          -- em gramas por 100 g
  fiber_100g         numeric,
  additives_count    integer,
  serving_g          numeric,          -- porção declarada (g/ml), se houver
  category           text,
  -- cópia dos dados do Open Food Facts usados na análise
  product            jsonb not null,
  saved              boolean not null default false,
  favorite           boolean not null default false,
  -- quando o usuário trocou um produto por uma alternativa
  replaced_scan_id   uuid references public.scans (id) on delete set null,
  created_at         timestamptz not null default now()
);
create index if not exists scans_user_created_idx on public.scans (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. ALERTAS — gerados a partir das leituras e do perfil
-- ---------------------------------------------------------------------
create table if not exists public.alerts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  scan_id       uuid references public.scans (id) on delete cascade,
  kind          text not null,            -- 'gluten', 'lactose', 'sugar', 'daily_sugar', 'sat_fat', 'sodium', 'additives', 'ultra', 'good_choice'
  severity      text not null check (severity in ('critical', 'attention', 'positive')),
  title         text not null,
  description   text not null,
  product_name  text,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists alerts_user_created_idx on public.alerts (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 4. PONTOS — cada ação que gera pontos (gamificação)
-- ---------------------------------------------------------------------
create table if not exists public.points_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  points      integer not null check (points > 0),
  reason      text not null,          -- 'save', 'healthy_choice', 'alternative', 'weekly_challenge'
  ref         text,                   -- ex.: id da leitura ou semana do desafio
  created_at  timestamptz not null default now(),
  unique (user_id, reason, ref)
);
create index if not exists points_user_idx on public.points_events (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 5. SEGURANÇA (RLS): cada usuário só enxerga e altera os próprios dados
-- ---------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.scans         enable row level security;
alter table public.alerts        enable row level security;
alter table public.points_events enable row level security;

drop policy if exists "perfil: ler o próprio"      on public.profiles;
drop policy if exists "perfil: alterar o próprio"  on public.profiles;
drop policy if exists "perfil: criar o próprio"    on public.profiles;
create policy "perfil: ler o próprio"     on public.profiles for select using (auth.uid() = id);
create policy "perfil: alterar o próprio" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "perfil: criar o próprio"   on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "leituras: tudo nas próprias" on public.scans;
create policy "leituras: tudo nas próprias" on public.scans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "alertas: tudo nos próprios" on public.alerts;
create policy "alertas: tudo nos próprios" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- pontos: o usuário pode ler e registrar, mas nunca editar ou apagar
drop policy if exists "pontos: ler os próprios"      on public.points_events;
drop policy if exists "pontos: registrar os próprios" on public.points_events;
create policy "pontos: ler os próprios"       on public.points_events for select using (auth.uid() = user_id);
create policy "pontos: registrar os próprios" on public.points_events for insert with check (auth.uid() = user_id and points <= 200);

-- ---------------------------------------------------------------------
-- 6. PERMISSÕES da API (as tabelas novas não são expostas automaticamente)
-- ---------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update          on public.profiles      to authenticated;
grant select, insert, update, delete  on public.scans         to authenticated;
grant select, insert, update, delete  on public.alerts        to authenticated;
grant select, insert                  on public.points_events to authenticated;
revoke all on public.profiles, public.scans, public.alerts, public.points_events from anon;

-- ---------------------------------------------------------------------
-- 7. Criar o perfil automaticamente quando alguém se cadastra
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      initcap(split_part(new.email, '@', 1))
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- manter updated_at em dia
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
