-- Habilitar UUID
create extension if not exists "pgcrypto";

-- Exercises (solo custom; las de seed son locales)
create table public.exercises (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text,
  "nameEN"    text,
  type        text,
  "muscleGroup"   text,
  "movementType"  text,
  "isCustom"  boolean default true,
  updated_at  bigint not null,
  created_at  bigint not null
);

-- Routines
create table public.routines (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text,
  exercises   jsonb,
  "restTime"  integer,
  updated_at  bigint not null,
  created_at  bigint not null
);

-- Weekly schedule
create table public.weekly_schedule (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  "dayOfWeek"   integer,
  "routineId"   text,
  updated_at    bigint not null,
  created_at    bigint not null
);

-- Workouts
create table public.workouts (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          bigint,
  "routineId"   text,
  status        text,
  exercises     jsonb,
  "prefilledExercises" jsonb,
  "finishedAt"  bigint,
  updated_at    bigint not null,
  created_at    bigint not null
);

-- Body measurements
create table public.body_measurements (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        bigint,
  data        jsonb,
  updated_at  bigint not null,
  created_at  bigint not null
);

-- User settings
create table public.user_settings (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text,
  language    text,
  theme       text,
  "restEnabled"   boolean,
  "restSoundType" text,
  "restVolume"    numeric,
  "measurementFields" jsonb,
  updated_at  bigint not null,
  created_at  bigint not null
);

-- Row Level Security
alter table public.exercises        enable row level security;
alter table public.routines         enable row level security;
alter table public.weekly_schedule  enable row level security;
alter table public.workouts         enable row level security;
alter table public.body_measurements enable row level security;
alter table public.user_settings    enable row level security;

-- Policies: cada usuario ve solo sus datos
do $$ 
declare
  t text;
begin
  foreach t in array array['exercises','routines','weekly_schedule','workouts','body_measurements','user_settings']
  loop
    execute format('create policy "Own data only" on public.%I using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- Índices de sync (pull por updated_at)
create index on public.exercises        (user_id, updated_at);
create index on public.routines         (user_id, updated_at);
create index on public.weekly_schedule  (user_id, updated_at);
create index on public.workouts         (user_id, updated_at);
create index on public.body_measurements(user_id, updated_at);
create index on public.user_settings    (user_id, updated_at);
