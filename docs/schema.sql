-- =============================================================
-- SQL SCHEMA SETUP: IQ-RA SHARIA DIGITAL COOPERATIVE SYSTEM
-- Target: Supabase PostgreSQL Database (DSN-MUI Compliant)
-- =============================================================

-- Enable pgvector extension (for vector semantic search fatwa MUI)
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop tables if they exist (Reset DB)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS financing_contracts CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('jamaah', 'takmir', 'dps', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: members
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    nik VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: accounts
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('pokok', 'wajib', 'wadiah', 'mudharabah')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table: transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    reference_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table: financing_contracts
CREATE TABLE financing_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('murabahah', 'qard')),
    principal_amount NUMERIC(15, 2) NOT NULL CHECK (principal_amount > 0),
    margin_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (margin_amount >= 0),
    installment_period INTEGER NOT NULL CHECK (installment_period > 0),
    remaining_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verified_by_takmir', 'approved_by_dps', 'active', 'paid_off', 'rejected')),
    item_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table: journal_entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(100), -- Reference number of transaction or contract
    code_coa VARCHAR(50) NOT NULL,
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table: audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- SEED DATA SETUP: CORE USERS & MEMBERS
-- =============================================================

-- Seed default authenticated users
INSERT INTO users (id, email, password_hash, role) VALUES
('6e2f43cf-c774-4b53-8326-0e1be8775f0a', 'ahmad@ksd.id', 'ahmad123', 'jamaah'),
('0bb65d21-f3b1-4f1e-a4d1-817684346eb4', 'takmir@ksd.id', 'takmir123', 'takmir'),
('bca40a43-6902-4029-9e8c-572719231f29', 'dps@ksd.id', 'dps123', 'dps'),
('a348079a-f432-4752-9118-80f135b378af', 'admin@ksd.id', 'admin123', 'admin');

-- Seed default member profiles (KYC Verified)
INSERT INTO members (id, user_id, full_name, nik, address, phone, status) VALUES
('b3014c4a-67a4-4f24-9b7c-fa095cf04b73', '6e2f43cf-c774-4b53-8326-0e1be8775f0a', 'Ahmad Rafiq', '3201020304050001', 'Jl. Merdeka No. 45, Jakarta', '081234567890', 'verified');

-- Seed default savings accounts for Ahmad Rafiq
INSERT INTO accounts (id, member_id, account_type, balance) VALUES
('a2c304bf-e734-4b2a-89a3-5c0a34b22001', 'b3014c4a-67a4-4f24-9b7c-fa095cf04b73', 'pokok', 100000.00),
('a2c304bf-e734-4b2a-89a3-5c0a34b22002', 'b3014c4a-67a4-4f24-9b7c-fa095cf04b73', 'wajib', 10000.00),
('a2c304bf-e734-4b2a-89a3-5c0a34b22003', 'b3014c4a-67a4-4f24-9b7c-fa095cf04b73', 'wadiah', 1500000.00),
('a2c304bf-e734-4b2a-89a3-5c0a34b22004', 'b3014c4a-67a4-4f24-9b7c-fa095cf04b73', 'mudharabah', 2400000.00);

-- =============================================================
-- SECURITY: ENABLE ROW LEVEL SECURITY (RLS) policies
-- =============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic Read-All policies for development simulation
CREATE POLICY "Enable read access for authenticated users" ON users 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON members 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON accounts 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON transactions 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON financing_contracts 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON journal_entries 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON audit_logs 
    FOR SELECT TO authenticated USING (true);
