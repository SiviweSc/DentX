-- Generic branding settings used by generated documents and future white-label surfaces

CREATE TABLE IF NOT EXISTS branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_key TEXT NOT NULL UNIQUE DEFAULT 'default',
  institution_name TEXT NOT NULL,
  website TEXT,
  phone TEXT,
  location TEXT,
  primary_hex TEXT NOT NULL DEFAULT '#9A7B1D',
  primary_light_hex TEXT NOT NULL DEFAULT '#F5F1E8',
  text_hex TEXT NOT NULL DEFAULT '#1F2937',
  muted_hex TEXT NOT NULL DEFAULT '#6B7280',
  logo_base64 TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT branding_primary_hex_format CHECK (primary_hex ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT branding_primary_light_hex_format CHECK (primary_light_hex ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT branding_text_hex_format CHECK (text_hex ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT branding_muted_hex_format CHECK (muted_hex ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_branding_settings_single_active
  ON branding_settings ((is_active))
  WHERE is_active;

INSERT INTO branding_settings (
  brand_key,
  institution_name,
  website,
  phone,
  location,
  primary_hex,
  primary_light_hex,
  text_hex,
  muted_hex,
  is_active
)
VALUES (
  'default',
  'Dental Practice',
  'dentxquarters.co.za',
  '+27 68 534 0763',
  'City Center Nelspruit, Main Road, Mbombela 312-JT, Mbombela, 1201',
  '#9A7B1D',
  '#F5F1E8',
  '#1F2937',
  '#6B7280',
  true
)
ON CONFLICT (brand_key) DO UPDATE SET
  institution_name = EXCLUDED.institution_name,
  website = EXCLUDED.website,
  phone = EXCLUDED.phone,
  location = EXCLUDED.location,
  primary_hex = EXCLUDED.primary_hex,
  primary_light_hex = EXCLUDED.primary_light_hex,
  text_hex = EXCLUDED.text_hex,
  muted_hex = EXCLUDED.muted_hex,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on branding_settings" ON branding_settings;

CREATE POLICY "Allow all operations on branding_settings"
  ON branding_settings FOR ALL USING (true);

DROP TRIGGER IF EXISTS update_branding_settings_updated_at ON branding_settings;
CREATE TRIGGER update_branding_settings_updated_at
BEFORE UPDATE ON branding_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
