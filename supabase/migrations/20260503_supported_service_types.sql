-- ============================================
-- Supported service types (dynamic, DB-driven)
-- ============================================

CREATE TABLE IF NOT EXISTS supported_service_types (
  service_type TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO supported_service_types (service_type, label)
VALUES
  ('dental', 'Dental Care'),
  ('medical', 'General Medicine'),
  ('iv-therapy', 'IV Drip Therapy'),
  ('physiotherapy', 'Physiotherapy')
ON CONFLICT (service_type) DO UPDATE
SET label = EXCLUDED.label,
    updated_at = NOW();

ALTER TABLE supported_service_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on supported_service_types"
  ON supported_service_types;

CREATE POLICY "Allow all operations on supported_service_types"
  ON supported_service_types FOR ALL USING (true);

DROP TRIGGER IF EXISTS update_supported_service_types_updated_at ON supported_service_types;
CREATE TRIGGER update_supported_service_types_updated_at
BEFORE UPDATE ON supported_service_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE doctor_service_assignments
  DROP CONSTRAINT IF EXISTS doctor_service_assignments_service_type_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'doctor_service_assignments_service_type_fkey'
  ) THEN
    ALTER TABLE doctor_service_assignments
      ADD CONSTRAINT doctor_service_assignments_service_type_fkey
      FOREIGN KEY (service_type)
      REFERENCES supported_service_types(service_type)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END $$;
