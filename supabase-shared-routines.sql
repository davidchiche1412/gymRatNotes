CREATE TABLE shared_routines (
  id UUID PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);

-- Permitir lectura pública (sin auth)
ALTER TABLE shared_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read shared routines" ON shared_routines FOR SELECT USING (true);
-- Solo usuarios autenticados pueden publicar
CREATE POLICY "Authenticated users can insert" ON shared_routines FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON shared_routines FOR UPDATE USING (auth.role() = 'authenticated');
