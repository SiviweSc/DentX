-- ============================================
-- Doctor service assignments
-- ============================================

CREATE TABLE IF NOT EXISTS doctor_service_assignments (
  doctor_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (doctor_id, service_type),
  CONSTRAINT doctor_service_assignments_service_type_check CHECK (
    service_type IN ('dental', 'medical', 'iv-therapy', 'physiotherapy')
  )
);

CREATE INDEX IF NOT EXISTS idx_doctor_service_assignments_service_type
  ON doctor_service_assignments(service_type);

ALTER TABLE doctor_service_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on doctor_service_assignments"
  ON doctor_service_assignments;

CREATE POLICY "Allow all operations on doctor_service_assignments"
  ON doctor_service_assignments FOR ALL USING (true);
