-- ============================================
-- Availability configuration for services and practitioners
-- ============================================

CREATE TABLE IF NOT EXISTS service_availability (
  service_id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practitioner_availability (
  service_id TEXT NOT NULL REFERENCES service_availability(service_id) ON DELETE CASCADE,
  practitioner_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (service_id, practitioner_id)
);

INSERT INTO service_availability (service_id, enabled)
VALUES
  ('dental', true),
  ('medical', true),
  ('iv-therapy', true),
  ('physiotherapy', true)
ON CONFLICT (service_id) DO UPDATE
SET enabled = EXCLUDED.enabled,
    updated_at = NOW();

INSERT INTO practitioner_availability (service_id, practitioner_id, enabled)
VALUES
  ('dental', 'general-dentist', true),
  ('dental', 'dental-therapist', true),
  ('dental', 'emergency', true),
  ('dental', 'not-sure', true),
  ('medical', 'general-practitioner', true),
  ('medical', 'clinical-associate', true),
  ('medical', 'not-sure', true),
  ('iv-therapy', 'hydration', true),
  ('iv-therapy', 'vitamin-boost', true),
  ('iv-therapy', 'immunity', true),
  ('iv-therapy', 'consultation', true),
  ('physiotherapy', 'sports-injury', true),
  ('physiotherapy', 'pain-management', true),
  ('physiotherapy', 'rehabilitation', true),
  ('physiotherapy', 'not-sure', true)
ON CONFLICT (service_id, practitioner_id) DO UPDATE
SET enabled = EXCLUDED.enabled,
    updated_at = NOW();

CREATE INDEX IF NOT EXISTS idx_practitioner_availability_service_id
  ON practitioner_availability(service_id);

ALTER TABLE service_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on service_availability" ON service_availability;
DROP POLICY IF EXISTS "Allow all operations on practitioner_availability" ON practitioner_availability;

CREATE POLICY "Allow all operations on service_availability"
  ON service_availability FOR ALL USING (true);

CREATE POLICY "Allow all operations on practitioner_availability"
  ON practitioner_availability FOR ALL USING (true);

DROP TRIGGER IF EXISTS update_service_availability_updated_at ON service_availability;
CREATE TRIGGER update_service_availability_updated_at
BEFORE UPDATE ON service_availability
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_practitioner_availability_updated_at ON practitioner_availability;
CREATE TRIGGER update_practitioner_availability_updated_at
BEFORE UPDATE ON practitioner_availability
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();