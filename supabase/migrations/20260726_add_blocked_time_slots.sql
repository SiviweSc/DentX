-- ============================================
-- Blocked time slots for recurring and once-off unavailability
-- ============================================

CREATE TABLE IF NOT EXISTS blocked_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT true,
  reason TEXT NOT NULL DEFAULT 'Blocked',
  frequency TEXT NOT NULL,
  blocked_date DATE,
  day_of_week INTEGER,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT blocked_time_slots_frequency_check
    CHECK (frequency IN ('once', 'weekly')),
  CONSTRAINT blocked_time_slots_day_of_week_check
    CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  CONSTRAINT blocked_time_slots_time_range_check
    CHECK (end_time > start_time),
  CONSTRAINT blocked_time_slots_once_shape_check
    CHECK (
      (frequency = 'once' AND blocked_date IS NOT NULL AND day_of_week IS NULL)
      OR
      (frequency = 'weekly' AND blocked_date IS NULL AND day_of_week IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_blocked_date
  ON blocked_time_slots(blocked_date);

CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_day_of_week
  ON blocked_time_slots(day_of_week);

ALTER TABLE blocked_time_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on blocked_time_slots" ON blocked_time_slots;

CREATE POLICY "Allow all operations on blocked_time_slots"
  ON blocked_time_slots FOR ALL USING (true);

DROP TRIGGER IF EXISTS update_blocked_time_slots_updated_at ON blocked_time_slots;
CREATE TRIGGER update_blocked_time_slots_updated_at
BEFORE UPDATE ON blocked_time_slots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
