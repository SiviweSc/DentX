-- Doctor assignment and availability

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS assigned_doctor_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_doctor_username TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_bookings_assigned_doctor_id ON bookings(assigned_doctor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time_status ON bookings(date, time, status);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_available ON admin_users(role, is_available);

UPDATE admin_users
SET is_available = true
WHERE is_available IS DISTINCT FROM true
  AND lower(role) = 'doctor';
