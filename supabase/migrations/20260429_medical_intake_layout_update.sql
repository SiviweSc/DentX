-- Extend medical_intake table for the full bilingual MEDICAL FILE layout
ALTER TABLE medical_intake
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS family_details JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS form_payload JSONB;
