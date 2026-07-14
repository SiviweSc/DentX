-- ============================================
-- Consolidated service structure + duration migration
-- Use this single migration when previous 20260713 migrations were not run.
-- ============================================

-- Keep top-level toggleable services.
INSERT INTO supported_service_types (service_type, label)
VALUES
  ('dental', 'Dental Care'),
  ('medical', 'General Medicine'),
  ('iv-therapy', 'IV Drip Therapy'),
  ('physiotherapy', 'Physiotherapy')
ON CONFLICT (service_type) DO UPDATE
SET label = EXCLUDED.label,
    updated_at = NOW();

INSERT INTO service_availability (service_id, enabled)
VALUES
  ('dental', true),
  ('medical', true),
  ('iv-therapy', true),
  ('physiotherapy', true)
ON CONFLICT (service_id) DO UPDATE
SET enabled = EXCLUDED.enabled,
    updated_at = NOW();

-- Add configurable duration per service option/procedure.
ALTER TABLE practitioner_availability
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 30;

ALTER TABLE practitioner_availability
DROP CONSTRAINT IF EXISTS practitioner_availability_duration_minutes_check;

ALTER TABLE practitioner_availability
ADD CONSTRAINT practitioner_availability_duration_minutes_check
CHECK (duration_minutes >= 30 AND duration_minutes <= 240 AND duration_minutes % 30 = 0);

-- Replace old dental practitioner rows with procedure-level options.
DELETE FROM practitioner_availability
WHERE service_id = 'dental';

INSERT INTO practitioner_availability (service_id, practitioner_id, enabled, duration_minutes)
VALUES
  ('dental', 'slim-wires-bite-blocks', true, 60),
  ('dental', 'ortho-review-brace-check-up', true, 30),
  ('dental', 'consultation-brace-consultation', true, 30),
  ('dental', 'crown-denture-consult', true, 30),
  ('dental', 'crown-installation', true, 120),
  ('dental', 'brace-removal-slim-wire-or-bite-blocks-removal', true, 60),
  ('dental', 'teeth-filling', true, 60),
  ('dental', 'gold-silver-removal', true, 60),
  ('dental', 'teeth-cleaning', true, 30),
  ('dental', 'teeth-whitening', true, 90),
  ('dental', 'root-canal-treatment', true, 60),
  ('dental', 'normal-extraction', true, 30),
  ('dental', 'surgical-extraction', true, 60),
  ('dental', 'brace-installation', true, 60),
  ('dental', 'not-sure', true, 30)
ON CONFLICT (service_id, practitioner_id) DO UPDATE
SET enabled = EXCLUDED.enabled,
    duration_minutes = EXCLUDED.duration_minutes,
    updated_at = NOW();

INSERT INTO practitioner_availability (service_id, practitioner_id, enabled, duration_minutes)
VALUES
  ('medical', 'general-practitioner', true, 30),
  ('medical', 'clinical-associate', true, 30),
  ('medical', 'not-sure', true, 30),
  ('iv-therapy', 'hydration', true, 30),
  ('iv-therapy', 'vitamin-boost', true, 30),
  ('iv-therapy', 'immunity', true, 30),
  ('iv-therapy', 'consultation', true, 30),
  ('physiotherapy', 'sports-injury', true, 30),
  ('physiotherapy', 'pain-management', true, 30),
  ('physiotherapy', 'rehabilitation', true, 30),
  ('physiotherapy', 'not-sure', true, 30)
ON CONFLICT (service_id, practitioner_id) DO UPDATE
SET enabled = EXCLUDED.enabled,
    duration_minutes = EXCLUDED.duration_minutes,
    updated_at = NOW();

-- Clean up accidental top-level procedure service records.
DELETE FROM practitioner_availability
WHERE service_id IN (
  'slim-wires-bite-blocks',
  'ortho-review-brace-check-up',
  'consultation-brace-consultation',
  'crown-denture-consult',
  'crown-installation',
  'brace-removal-slim-wire-or-bite-blocks-removal',
  'teeth-filling',
  'gold-silver-removal',
  'teeth-cleaning',
  'teeth-whitening',
  'root-canal-treatment',
  'normal-extraction',
  'surgical-extraction',
  'brace-installation'
);

DELETE FROM service_availability
WHERE service_id IN (
  'slim-wires-bite-blocks',
  'ortho-review-brace-check-up',
  'consultation-brace-consultation',
  'crown-denture-consult',
  'crown-installation',
  'brace-removal-slim-wire-or-bite-blocks-removal',
  'teeth-filling',
  'gold-silver-removal',
  'teeth-cleaning',
  'teeth-whitening',
  'root-canal-treatment',
  'normal-extraction',
  'surgical-extraction',
  'brace-installation'
);

DELETE FROM supported_service_types
WHERE service_type IN (
  'slim-wires-bite-blocks',
  'ortho-review-brace-check-up',
  'consultation-brace-consultation',
  'crown-denture-consult',
  'crown-installation',
  'brace-removal-slim-wire-or-bite-blocks-removal',
  'teeth-filling',
  'gold-silver-removal',
  'teeth-cleaning',
  'teeth-whitening',
  'root-canal-treatment',
  'normal-extraction',
  'surgical-extraction',
  'brace-installation'
);
