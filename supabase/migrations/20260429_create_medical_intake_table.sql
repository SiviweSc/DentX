-- Create medical_intake table for storing patient medical history forms
CREATE TABLE IF NOT EXISTS medical_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Patient Details
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  id_number TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,

  -- Person Responsible
  responsible_name TEXT,
  responsible_relationship TEXT,
  responsible_phone TEXT,

  -- Medical Aid
  medical_aid TEXT,
  medical_aid_number TEXT,
  medical_aid_member_id TEXT,

  -- Nearest Family/Friend
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_address TEXT,

  -- Referred By
  referral_source TEXT,
  referral_doctor_name TEXT,
  referral_facility TEXT,

  -- Medical History
  family_history TEXT,
  current_medications TEXT,
  allergies TEXT,
  medical_conditions TEXT,
  surgical_history TEXT,
  additional_notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on booking_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_medical_intake_booking_id ON medical_intake(booking_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_medical_intake_created_at ON medical_intake(created_at DESC);
