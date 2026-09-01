-- ============================================================================
-- GymRat Notes — Schema completo de Supabase
-- Ejecutar en orden. Cada sección es idempotente (usa IF NOT EXISTS).
-- Se puede re-ejecutar sin riesgo sobre una BD existente.
-- ============================================================================

-- ── V1: Schema base (datos de usuario con RLS) ─────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Exercises (solo custom; las de seed son locales)
CREATE TABLE IF NOT EXISTS public.exercises (
  id          text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text,
  "nameEN"    text,
  type        text,
  "muscleGroup"   text,
  "movementType"  text,
  "isCustom"  boolean DEFAULT true,
  updated_at  bigint NOT NULL,
  created_at  bigint NOT NULL
);

-- Routines
CREATE TABLE IF NOT EXISTS public.routines (
  id          text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text,
  exercises   jsonb,
  "restTime"  integer,
  updated_at  bigint NOT NULL,
  created_at  bigint NOT NULL
);

-- Weekly schedule
CREATE TABLE IF NOT EXISTS public.weekly_schedule (
  id            text PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "dayOfWeek"   integer,
  "routineId"   text,
  updated_at    bigint NOT NULL,
  created_at    bigint NOT NULL
);

-- Workouts
CREATE TABLE IF NOT EXISTS public.workouts (
  id            text PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          bigint,
  "routineId"   text,
  status        text,
  exercises     jsonb,
  "prefilledExercises" jsonb,
  "finishedAt"  bigint,
  updated_at    bigint NOT NULL,
  created_at    bigint NOT NULL
);

-- Body measurements
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id          text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        bigint,
  data        jsonb,
  updated_at  bigint NOT NULL,
  created_at  bigint NOT NULL
);

-- User settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id          text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text,
  language    text,
  theme       text,
  "restEnabled"   boolean,
  "restSoundType" text,
  "restVolume"    numeric,
  "measurementFields" jsonb,
  updated_at  bigint NOT NULL,
  created_at  bigint NOT NULL
);

-- RLS: cada usuario ve solo sus datos
ALTER TABLE public.exercises         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_schedule   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings     ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['exercises','routines','weekly_schedule','workouts','body_measurements','user_settings']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'Own data only'
    ) THEN
      EXECUTE format('CREATE POLICY "Own data only" ON public.%I FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t);
    END IF;
  END LOOP;
END $$;

-- Índices para sync (pull por updated_at)
CREATE INDEX IF NOT EXISTS idx_exercises_sync         ON public.exercises        (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_routines_sync          ON public.routines         (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_sync   ON public.weekly_schedule  (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_workouts_sync          ON public.workouts         (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_body_measurements_sync ON public.body_measurements(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_user_settings_sync     ON public.user_settings    (user_id, updated_at);


-- ── V2: Rutinas compartidas (lectura pública, escritura auth) ───────────────

CREATE TABLE IF NOT EXISTS public.shared_routines (
  id          uuid PRIMARY KEY,
  data        jsonb NOT NULL,
  updated_at  bigint NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);

ALTER TABLE public.shared_routines ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shared_routines' AND policyname = 'Anyone can read shared routines') THEN
    CREATE POLICY "Anyone can read shared routines" ON public.shared_routines FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shared_routines' AND policyname = 'Authenticated users can insert shared routines') THEN
    CREATE POLICY "Authenticated users can insert shared routines" ON public.shared_routines FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- UPDATE deshabilitado: las rutinas compartidas son inmutables
END $$;


-- ── V3: Programaciones semanales compartidas ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shared_schedules (
  id          text PRIMARY KEY,
  data        jsonb NOT NULL,
  updated_at  bigint NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);

ALTER TABLE public.shared_schedules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shared_schedules' AND policyname = 'Anyone can read shared schedules') THEN
    CREATE POLICY "Anyone can read shared schedules" ON public.shared_schedules FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shared_schedules' AND policyname = 'Authenticated users can insert shared schedules') THEN
    CREATE POLICY "Authenticated users can insert shared schedules" ON public.shared_schedules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- UPDATE deshabilitado: las programaciones compartidas son inmutables
END $$;
