-- Align Staff role permissions with Receptionist, plus payslip access

WITH receptionist_role AS (
  SELECT permissions
  FROM role_definitions
  WHERE role = 'receptionist'
  LIMIT 1
)
UPDATE role_definitions
SET
  permissions = COALESCE(
    (
      SELECT
        jsonb_set(
          jsonb_set(
            receptionist_role.permissions,
            '{payslips}',
            'true'::jsonb,
            true
          ),
          '{managePayslips}',
          'false'::jsonb,
          true
        )
      FROM receptionist_role
    ),
    jsonb_set(
      jsonb_set(
        COALESCE(role_definitions.permissions, '{}'::jsonb),
        '{payslips}',
        'true'::jsonb,
        true
      ),
      '{managePayslips}',
      'false'::jsonb,
      true
    )
  ),
  updated_at = NOW()
WHERE role = 'staff';
