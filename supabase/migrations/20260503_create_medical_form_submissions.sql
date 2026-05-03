-- Dedicated submission records for medical intake forms and generated PDFs

CREATE TABLE IF NOT EXISTS medical_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  medical_intake_id UUID REFERENCES medical_intake(id) ON DELETE SET NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'patient-files',
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  form_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_form_submissions_patient_id
  ON medical_form_submissions(patient_id);

CREATE INDEX IF NOT EXISTS idx_medical_form_submissions_booking_id
  ON medical_form_submissions(booking_id);

CREATE INDEX IF NOT EXISTS idx_medical_form_submissions_medical_intake_id
  ON medical_form_submissions(medical_intake_id);

ALTER TABLE medical_form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on medical_form_submissions" ON medical_form_submissions;

CREATE POLICY "Allow all operations on medical_form_submissions"
  ON medical_form_submissions FOR ALL USING (true);

DROP TRIGGER IF EXISTS update_medical_form_submissions_updated_at ON medical_form_submissions;
CREATE TRIGGER update_medical_form_submissions_updated_at
BEFORE UPDATE ON medical_form_submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
