-- Tabla para programaciones semanales compartidas
CREATE TABLE shared_schedules (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);

ALTER TABLE shared_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read shared schedules" ON shared_schedules FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert" ON shared_schedules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON shared_schedules FOR UPDATE USING (auth.role() = 'authenticated');
