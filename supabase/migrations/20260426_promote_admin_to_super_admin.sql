-- Promote Admin account to Super Admin
-- Safe to run multiple times

INSERT INTO role_definitions (role, label, permissions)
VALUES (
  'super_admin',
  'Super Admin',
  '{
    "dashboard": true,
    "calendar": true,
    "bookings": true,
    "bookingsConfirm": true,
    "patients": true,
    "practice": true,
    "activity": true,
    "settings": true,
    "bookingsComplete": true,
    "manageUsers": true,
    "manageAvailability": true
  }'::jsonb
)
ON CONFLICT (role) DO UPDATE
SET
  label = EXCLUDED.label,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

UPDATE admin_users
SET
  role = 'super_admin'
WHERE lower(trim(username)) IN ('lonwabo', 'admin');
