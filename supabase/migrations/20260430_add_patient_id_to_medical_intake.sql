-- Add patient_id column to medical_intake table to directly link to patients
ALTER TABLE IF EXISTS medical_intake 
ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE CASCADE;

-- Create index on patient_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_medical_intake_patient_id ON medical_intake(patient_id);
