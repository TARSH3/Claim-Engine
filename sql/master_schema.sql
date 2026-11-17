-- ============================================================================
-- MASTER DATABASE INITIALIZATION SCRIPT (POSTGRESQL)
-- Domain: Claims Engine (Intake, Policy, Status Audit & Settlement)
-- ============================================================================

DROP TABLE IF EXISTS Claim_Payouts CASCADE;
DROP TABLE IF EXISTS Claim_Status_History CASCADE;
DROP TABLE IF EXISTS Claims CASCADE;
DROP TABLE IF EXISTS Policies CASCADE;
DROP TABLE IF EXISTS Users CASCADE;
DROP VIEW IF EXISTS vw_AdjusterPendingClaims CASCADE;

-- 1. Users table with Role-Based Access Control
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('Policyholder', 'Adjuster', 'Admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Policies table
CREATE TABLE Policies (
    policy_id SERIAL PRIMARY KEY,
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE RESTRICT,
    policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('Homeowners', 'Commercial Property', 'Auto Physical Damage')),
    total_coverage NUMERIC(12, 2) NOT NULL CHECK (total_coverage > 0),
    remaining_coverage NUMERIC(12, 2) NOT NULL CHECK (remaining_coverage >= 0),
    deductible NUMERIC(10, 2) NOT NULL CHECK (deductible >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_policy_dates CHECK (end_date > start_date)
);

-- 3. Claims table
CREATE TABLE Claims (
    claim_id SERIAL PRIMARY KEY,
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    policy_id INT NOT NULL REFERENCES Policies(policy_id) ON DELETE RESTRICT,
    filing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    incident_date DATE NOT NULL,
    claimed_amount NUMERIC(12, 2) NOT NULL CHECK (claimed_amount > 0),
    approved_amount NUMERIC(12, 2) DEFAULT 0.00 CHECK (approved_amount >= 0),
    status VARCHAR(30) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SETTLED')),
    assigned_adjuster_id INT REFERENCES Users(user_id) ON DELETE SET NULL
);

-- 4. Audit History table
CREATE TABLE Claim_Status_History (
    history_id SERIAL PRIMARY KEY,
    claim_id INT NOT NULL REFERENCES Claims(claim_id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by INT REFERENCES Users(user_id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Financial Settlement Ledger
CREATE TABLE Claim_Payouts (
    payout_id SERIAL PRIMARY KEY,
    claim_id INT UNIQUE NOT NULL REFERENCES Claims(claim_id) ON DELETE RESTRICT,
    net_payout NUMERIC(12, 2) NOT NULL CHECK (net_payout >= 0),
    disbursement_status VARCHAR(20) DEFAULT 'DISBURSED' CHECK (disbursement_status IN ('PENDING', 'DISBURSED', 'FAILED')),
    payout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Performance Indexes
CREATE INDEX idx_claims_policy_status ON Claims(policy_id, status);
CREATE INDEX idx_claims_adjuster ON Claims(assigned_adjuster_id);

-- ============================================================================
-- ADVANCED FEATURES: TRIGGERS, VIEWS & PROCEDURES
-- ============================================================================

-- Feature 1: Trigger for automatic status audit logging (Member 1)
CREATE OR REPLACE FUNCTION fn_audit_claim_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO Claim_Status_History (claim_id, previous_status, new_status, changed_by)
        VALUES (NEW.claim_id, OLD.status, NEW.status, NEW.assigned_adjuster_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_claim_status ON Claims;
CREATE TRIGGER trg_audit_claim_status
AFTER UPDATE OF status ON Claims
FOR EACH ROW
EXECUTE FUNCTION fn_audit_claim_status();

-- Feature 2: View for Adjuster Dashboard (Member 2 & Interop)
CREATE OR REPLACE VIEW vw_AdjusterPendingClaims AS
SELECT 
    c.claim_id,
    c.claim_number,
    c.filing_date,
    c.incident_date,
    c.claimed_amount,
    c.claimed_amount AS amount_claimed,
    c.status,
    c.assigned_adjuster_id,
    p.policy_id,
    p.policy_number,
    p.policy_type,
    p.policy_type AS claim_type,
    p.total_coverage,
    p.remaining_coverage,
    p.deductible,
    u.user_id AS policyholder_id,
    u.full_name AS claimant_name,
    u.full_name,
    u.email AS claimant_email,
    u.email,
    u.phone,
    COUNT(c.claim_id) OVER(PARTITION BY u.user_id) AS total_claims_filed,
    COALESCE(SUM(c.approved_amount) OVER(PARTITION BY p.policy_id), 0.00) AS total_paid_on_policy
FROM Claims c
JOIN Policies p ON c.policy_id = p.policy_id
JOIN Users u ON p.user_id = u.user_id
WHERE c.status IN ('SUBMITTED', 'UNDER_REVIEW');

-- Feature 3: Stored Procedure for Validation Claim Submission (Member 1)
CREATE OR REPLACE PROCEDURE sp_FileClaim(
    p_policy_id INT,
    p_incident_date DATE,
    p_claimed_amount NUMERIC,
    INOUT p_claim_id INT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_active BOOLEAN;
    v_end_date DATE;
    v_rem_coverage NUMERIC;
    v_claim_num VARCHAR(50);
BEGIN
    -- Validate policy state
    SELECT is_active, end_date, remaining_coverage 
    INTO v_is_active, v_end_date, v_rem_coverage
    FROM Policies 
    WHERE policy_id = p_policy_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Policy ID % does not exist.', p_policy_id;
    END IF;

    IF v_is_active = FALSE OR CURRENT_DATE > v_end_date THEN
        RAISE EXCEPTION 'Cannot file claim: Policy is inactive or expired.';
    END IF;

    IF p_incident_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Incident date cannot be in the future.';
    END IF;

    IF p_claimed_amount > v_rem_coverage THEN
        RAISE EXCEPTION 'Claimed amount (%) exceeds remaining coverage (%).', p_claimed_amount, v_rem_coverage;
    END IF;

    -- Generate Unique Claim Number
    v_claim_num := 'CLM-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS') || '-' || LPAD(p_policy_id::TEXT, 4, '0');

    -- Insert Claim
    INSERT INTO Claims (claim_number, policy_id, incident_date, claimed_amount, status)
    VALUES (v_claim_num, p_policy_id, p_incident_date, p_claimed_amount, 'SUBMITTED')
    RETURNING claim_id INTO p_claim_id;
END;
$$;

-- Feature 4: Atomic Settlement Transaction (Member 2)
CREATE OR REPLACE PROCEDURE sp_SettleClaim(
    p_claim_id INT,
    p_adjuster_id INT,
    p_approved_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_status VARCHAR(30);
    v_policy_id INT;
    v_deductible NUMERIC;
    v_remaining_cov NUMERIC;
    v_net_payout NUMERIC;
BEGIN
    -- Verify Adjuster Role
    IF NOT EXISTS (SELECT 1 FROM Users WHERE user_id = p_adjuster_id AND role = 'Adjuster') THEN
        RAISE EXCEPTION 'User ID % is not an authorized Adjuster.', p_adjuster_id;
    END IF;

    -- Fetch and lock claim row
    SELECT status, policy_id INTO v_status, v_policy_id 
    FROM Claims 
    WHERE claim_id = p_claim_id 
    FOR UPDATE;

    IF v_status = 'SETTLED' THEN
        RAISE EXCEPTION 'Claim % has already been settled.', p_claim_id;
    END IF;

    -- Lock and check policy coverage
    SELECT deductible, remaining_coverage INTO v_deductible, v_remaining_cov
    FROM Policies
    WHERE policy_id = v_policy_id
    FOR UPDATE;

    IF p_approved_amount > v_remaining_cov THEN
        RAISE EXCEPTION 'Approved amount exceeds remaining policy coverage.';
    END IF;

    -- Net payout after deductible
    v_net_payout := GREATEST(0.00, p_approved_amount - v_deductible);

    -- 1. Deduct coverage balance
    UPDATE Policies 
    SET remaining_coverage = remaining_coverage - p_approved_amount
    WHERE policy_id = v_policy_id;

    -- 2. Update claim status & assignment (Trigger will log to Claim_Status_History)
    UPDATE Claims 
    SET status = 'SETTLED',
        approved_amount = p_approved_amount,
        assigned_adjuster_id = p_adjuster_id
    WHERE claim_id = p_claim_id;

    -- 3. Write payout ledger record
    INSERT INTO Claim_Payouts (claim_id, net_payout, disbursement_status)
    VALUES (p_claim_id, v_net_payout, 'DISBURSED');
END;
$$;

-- ============================================================================
-- SEED DML STATEMENTS
-- ============================================================================

INSERT INTO Users (full_name, email, phone, role) VALUES
('Ramesh Kumar', 'ramesh.k@example.com', '9876543210', 'Policyholder'),
('Priya Sharma', 'priya.s@example.com', '9876543211', 'Policyholder'),
('Ananya Deshmukh', 'ananya.d@insurance.com', '9876543212', 'Adjuster'),
('Siddharth Nair', 'siddharth.n@insurance.com', '9876543213', 'Adjuster')
ON CONFLICT (email) DO NOTHING;

INSERT INTO Policies (policy_number, user_id, policy_type, total_coverage, remaining_coverage, deductible, start_date, end_date) VALUES
('POL-PROP-2026-001', 1, 'Homeowners', 5000000.00, 5000000.00, 25000.00, '2026-01-01', '2027-01-01'),
('POL-AUTO-2026-002', 2, 'Auto Physical Damage', 1200000.00, 1200000.00, 10000.00, '2026-03-15', '2027-03-15'),
('POL-COMM-2026-003', 1, 'Commercial Property', 8000000.00, 8000000.00, 50000.00, '2026-02-01', '2027-02-01')
ON CONFLICT (policy_number) DO NOTHING;

-- Initial Demo Claims
INSERT INTO Claims (claim_number, policy_id, incident_date, claimed_amount, status) VALUES
('CLM-20261101-0001', 1, '2026-10-25', 150000.00, 'SUBMITTED'),
('CLM-20261105-0002', 1, '2026-11-02', 45000.00, 'UNDER_REVIEW'),
('CLM-20261110-0003', 2, '2026-11-08', 85000.00, 'SUBMITTED')
ON CONFLICT (claim_number) DO NOTHING;
