-- ============================================
-- Operating hours for online booking windows
-- ============================================

CREATE TABLE IF NOT EXISTS operating_hours (
  day_of_week INTEGER PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT operating_hours_day_of_week_check
    CHECK (day_of_week >= 0 AND day_of_week <= 6)
);

INSERT INTO operating_hours (day_of_week, enabled, start_time, end_time)
VALUES
  (0, false, '09:00', '13:30'),
  (1, true, '08:30', '16:30'),
  (2, true, '08:30', '16:30'),
  (3, true, '08:30', '16:30'),
  (4, true, '08:30', '16:30'),
  (5, true, '08:30', '16:30'),
  (6, true, '09:00', '13:30')
ON CONFLICT (day_of_week) DO UPDATE
SET enabled = EXCLUDED.enabled,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    updated_at = NOW();

ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on operating_hours" ON operating_hours;

CREATE POLICY "Allow all operations on operating_hours"
  ON operating_hours FOR ALL USING (true);

DROP TRIGGER IF EXISTS update_operating_hours_updated_at ON operating_hours;
CREATE TRIGGER update_operating_hours_updated_at
BEFORE UPDATE ON operating_hours
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();