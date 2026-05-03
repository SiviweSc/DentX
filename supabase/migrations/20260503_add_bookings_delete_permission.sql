-- Add bookingsDelete permission and ensure Super Admin can delete bookings

UPDATE role_definitions
SET
  permissions = jsonb_set(
    COALESCE(permissions, '{}'::jsonb),
    '{bookingsDelete}',
    CASE
      WHEN role = 'super_admin' THEN 'true'::jsonb
      ELSE 'false'::jsonb
    END,
    true
  ),
  updated_at = NOW();