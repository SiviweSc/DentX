-- Adjust baseline role permissions
-- Admin should not confirm bookings or manage operating hours

UPDATE role_definitions
SET
  permissions = jsonb_set(
    jsonb_set(
      COALESCE(permissions, '{}'::jsonb),
      '{bookingsConfirm}',
      'false'::jsonb,
      true
    ),
    '{manageAvailability}',
    'false'::jsonb,
    true
  ),
  updated_at = NOW()
WHERE role = 'admin';

UPDATE role_definitions
SET
  permissions = jsonb_set(
    COALESCE(permissions, '{}'::jsonb),
    '{bookingsConfirm}',
    CASE
      WHEN role IN ('doctor', 'practice_manager', 'super_admin') THEN 'true'::jsonb
      ELSE 'false'::jsonb
    END,
    true
  ),
  updated_at = NOW()
WHERE role IN ('doctor', 'practice_manager', 'receptionist', 'nurse', 'super_admin');
