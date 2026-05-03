-- ============================================
-- Per-user permission overrides for admin users
-- ============================================

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS permissions_override JSONB NOT NULL DEFAULT '{}'::jsonb;
