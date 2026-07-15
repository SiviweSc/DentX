WITH ranked_duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        (date::date),
        time,
        regexp_replace(regexp_replace(COALESCE(phone, ''), '\s+', '', 'g'), '[^0-9+]', '', 'g')
      ORDER BY
        CASE status
          WHEN 'completed' THEN 4
          WHEN 'confirmed' THEN 3
          WHEN 'pending' THEN 2
          WHEN 'cancelled' THEN 1
          ELSE 0
        END DESC,
        COALESCE(updated_at, created_at, NOW()) DESC,
        id DESC
    ) AS row_number_within_slot
  FROM bookings
  WHERE status IN ('pending', 'confirmed', 'completed')
    AND BTRIM(COALESCE(phone, '')) <> ''
)
UPDATE bookings AS booking
SET
  status = 'cancelled',
  cancellation_reason = COALESCE(
    NULLIF(booking.cancellation_reason, ''),
    'Cancelled automatically because another active booking already existed for the same phone and slot'
  ),
  cancelled_at = COALESCE(booking.cancelled_at, NOW()),
  updated_at = NOW()
FROM ranked_duplicates AS duplicate
WHERE booking.id = duplicate.id
  AND duplicate.row_number_within_slot > 1;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_phone_slot_unique_idx
ON bookings (
  (date::date),
  time,
  regexp_replace(regexp_replace(COALESCE(phone, ''), '\s+', '', 'g'), '[^0-9+]', '', 'g')
)
WHERE status IN ('pending', 'confirmed', 'completed')
  AND BTRIM(COALESCE(phone, '')) <> '';