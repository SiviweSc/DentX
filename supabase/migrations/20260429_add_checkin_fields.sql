ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS checked_in_source TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_checked_in_at
ON bookings(checked_in_at);
