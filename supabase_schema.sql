-- SQL Script untuk Inisialisasi Database IQ-RA System
-- Jalankan ini di SQL Editor Supabase Anda

-- 1. Tabel Profil Pengguna (Integrasi dengan Auth Supabase)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'member', -- 'admin', 'staff', 'member'
  identity_number TEXT UNIQUE, -- NIK
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Anggota (KYC)
CREATE TABLE members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  address TEXT,
  phone_number TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'rejected'
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabel Journal Entries (Akuntansi Syariah Dasar)
CREATE TABLE journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  description TEXT,
  account_code TEXT, -- Kode Akun (COA)
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  reference_id TEXT, -- Link ke transaksi Murabahah, dll
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
