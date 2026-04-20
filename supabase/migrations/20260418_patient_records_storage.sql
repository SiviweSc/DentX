-- ============================================
-- Patient records, notes, and file storage
-- ============================================

CREATE TABLE IF NOT EXISTS patient_medical_details (
  patient_id UUID PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
  blood_type TEXT,
  allergies TEXT,
  chronic_conditions TEXT,
  current_medications TEXT,
  primary_physician TEXT,
  family_history TEXT,
  insurance_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  author_name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT patient_documents_category_check CHECK (
    category IN (
      'medical-record',
      'x-ray',
      'dr-note',
      'lab-result',
      'prescription',
      'consent-form',
      'referral',
      'invoice',
      'other'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_patient_clinical_notes_patient_id
  ON patient_clinical_notes(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id
  ON patient_documents(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_documents_category
  ON patient_documents(category);

ALTER TABLE patient_medical_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on patient_medical_details" ON patient_medical_details;
DROP POLICY IF EXISTS "Allow all operations on patient_clinical_notes" ON patient_clinical_notes;
DROP POLICY IF EXISTS "Allow all operations on patient_documents" ON patient_documents;

CREATE POLICY "Allow all operations on patient_medical_details"
  ON patient_medical_details FOR ALL USING (true);

CREATE POLICY "Allow all operations on patient_clinical_notes"
  ON patient_clinical_notes FOR ALL USING (true);

CREATE POLICY "Allow all operations on patient_documents"
  ON patient_documents FOR ALL USING (true);

DROP TRIGGER IF EXISTS update_patient_medical_details_updated_at ON patient_medical_details;
CREATE TRIGGER update_patient_medical_details_updated_at
BEFORE UPDATE ON patient_medical_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patient_clinical_notes_updated_at ON patient_clinical_notes;
CREATE TRIGGER update_patient_clinical_notes_updated_at
BEFORE UPDATE ON patient_clinical_notes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patient_documents_updated_at ON patient_documents;
CREATE TRIGGER update_patient_documents_updated_at
BEFORE UPDATE ON patient_documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('patient-files', 'patient-files', false, 52428800)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow patient file read" ON storage.objects;
DROP POLICY IF EXISTS "Allow patient file insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow patient file update" ON storage.objects;
DROP POLICY IF EXISTS "Allow patient file delete" ON storage.objects;

CREATE POLICY "Allow patient file read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'patient-files');

CREATE POLICY "Allow patient file insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'patient-files');

CREATE POLICY "Allow patient file update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'patient-files')
  WITH CHECK (bucket_id = 'patient-files');

CREATE POLICY "Allow patient file delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'patient-files');
