-- Base relational tables. If Member 1 already created these, keep his version and
-- only make sure the column names used by 02/03 match (see docs/MEMBER2_REPORT.md §6).
CREATE TABLE IF NOT EXISTS policyholders (
  policyholder_id SERIAL PRIMARY KEY,
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT
);

CREATE TABLE IF NOT EXISTS policies (
  policy_id          SERIAL PRIMARY KEY,
  policyholder_id    INT NOT NULL REFERENCES policyholders(policyholder_id),
  policy_number      TEXT UNIQUE NOT NULL,
  coverage_limit     NUMERIC(12,2) NOT NULL CHECK (coverage_limit >= 0),
  remaining_coverage NUMERIC(12,2) NOT NULL CHECK (remaining_coverage >= 0)
);

CREATE TABLE IF NOT EXISTS claims (
  claim_id        SERIAL PRIMARY KEY,
  policy_id       INT NOT NULL REFERENCES policies(policy_id),
  claim_type      TEXT NOT NULL,
  amount_claimed  NUMERIC(12,2) NOT NULL CHECK (amount_claimed > 0),
  status          TEXT NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending','Under Review','Approved','Rejected')),
  incident_date   DATE NOT NULL,
  filed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_amount  NUMERIC(12,2),
  adjuster_note   TEXT,
  resolved_at     TIMESTAMPTZ
);

-- Ledger of every money movement / decision
CREATE TABLE IF NOT EXISTS claim_transactions (
  transaction_id SERIAL PRIMARY KEY,
  claim_id       INT NOT NULL REFERENCES claims(claim_id),
  policy_id      INT NOT NULL REFERENCES policies(policy_id),
  txn_type       TEXT NOT NULL CHECK (txn_type IN ('PAYOUT','REJECTION')),
  amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_after  NUMERIC(12,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_policy ON claims(policy_id);
