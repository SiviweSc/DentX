-- ============================================
-- Role definitions and permissions
-- ============================================

CREATE TABLE IF NOT EXISTS role_definitions (
  role TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_definitions_label ON role_definitions(label);

INSERT INTO role_definitions (role, label, permissions)
VALUES
  (
    'doctor',
    'Doctor',
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
  ),
  (
    'practice_manager',
    'Practice Manager',
    '{
      "dashboard": true,
      "calendar": true,
      "bookings": true,
      "bookingsConfirm": true,
      "patients": true,
      "practice": true,
      "activity": true,
      "settings": true,
      "bookingsComplete": false,
      "manageUsers": true,
      "manageAvailability": true
    }'::jsonb
  ),
  (
    'admin',
    'Admin',
    '{
      "dashboard": true,
      "calendar": true,
      "bookings": true,
      "bookingsConfirm": false,
      "patients": true,
      "practice": true,
      "activity": true,
      "settings": true,
      "bookingsComplete": false,
      "manageUsers": false,
      "manageAvailability": false
    }'::jsonb
  ),
  (
    'receptionist',
    'Receptionist',
    '{
      "dashboard": true,
      "calendar": true,
      "bookings": true,
      "bookingsConfirm": false,
      "patients": false,
      "practice": false,
      "activity": false,
      "settings": false,
      "bookingsComplete": false,
      "manageUsers": false,
      "manageAvailability": false
    }'::jsonb
  ),
  (
    'nurse',
    'Nurse',
    '{
      "dashboard": true,
      "calendar": true,
      "bookings": true,
      "bookingsConfirm": false,
      "patients": true,
      "practice": false,
      "activity": true,
      "settings": false,
      "bookingsComplete": false,
      "manageUsers": false,
      "manageAvailability": false
    }'::jsonb
  )
ON CONFLICT (role) DO UPDATE
SET
  label = EXCLUDED.label,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

ALTER TABLE role_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on role_definitions" ON role_definitions;
CREATE POLICY "Allow all operations on role_definitions" ON role_definitions FOR ALL USING (true);

DROP TRIGGER IF EXISTS update_role_definitions_updated_at ON role_definitions;
CREATE TRIGGER update_role_definitions_updated_at BEFORE UPDATE ON role_definitions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure existing users have a valid role
UPDATE admin_users
SET role = 'admin'
WHERE role IS NULL
   OR trim(role) = ''
   OR lower(role) NOT IN (SELECT role FROM role_definitions);
