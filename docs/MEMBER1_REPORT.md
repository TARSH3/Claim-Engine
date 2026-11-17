# DBMS MINI PROJECT REPORT: MEMBER 1
## INTAKE & POLICY ENGINE (RELATIONAL CORE & CLAIMANT WORKFLOW)

**Project Title:** Polyglot Insurance Claim Engine & Adjudication Platform  
**Member 1 Lead:** Tarsh Choudhary (SRN / Roll No: PES2UG24CS556)  
**Course:** Database Management Systems (UE22CS343AB1 / DBMS Mini Project)  
**Academic Year:** 2026–2027  
**Department:** Computer Science and Engineering, PES University  

---

## PRELIMS

### Certificate
This is to certify that the project entitled **"Polyglot Insurance Claim Engine: Intake, Policy Management & Relational Engine"** is a bona fide record of work carried out by **Tarsh Choudhary** (Member 1) under the supervision and guidance of the Department of Computer Science and Engineering in partial fulfillment of the requirements for the Database Management Systems Laboratory Course.

---

### Declaration
I hereby declare that the work presented in this project report has been completed independently by me (Member 1: Intake & Policy Engine) in collaboration with my team partner (Member 2: Adjudication & Audit Engine). All relational schemas, stored procedures, database triggers, API route handlers, and claimant interfaces documented herein are original and implemented in compliance with academic integrity guidelines.

**Tarsh Choudhary**  
Department of Computer Science & Engineering  

---

### Acknowledgement
I express my sincere gratitude to our DBMS course instructors, lab mentors, and teaching assistants for providing continuous support, technical feedback, and academic guidance throughout the design and implementation of this mini-project. I also extend my appreciation to my team partner for smooth integration across the polyglot persistence boundary.

---

### Abstract
Modern enterprise insurance systems require strict transaction atomicity, legal auditability, and mathematical validation during First Notice of Loss (FNOL) claim intake, balanced against the need to process rich, unstructured damage evidence. This project implements a **hybrid polyglot architecture**: a relational core powered by **PostgreSQL** to handle policyholder identity, active policy underwriting, coverage limit validation, and status change audit trails, integrated with **MongoDB** for unstructured multimodal evidence storage. 

As **Member 1 (Intake & Policy Engine Lead)**, my responsibilities encompass:
1. Architectural setup of the Next.js TypeScript application and connection pooling.
2. Complete relational database design in Third Normal Form (3NF) encompassing `Users`, `Policies`, `Claims`, `Claim_Status_History`, and `Claim_Payouts`.
3. Server-side validation stored procedure `sp_FileClaim` that programmatically guarantees claims are only filed against active, non-expired policies without exceeding remaining coverage limits or accepting future dates.
4. Autonomous event-driven status audit trigger `trg_audit_claim_status` logging every state transition into an immutable audit ledger.
5. Formulation and benchmarking of analytical SQL queries utilizing aggregations, windowing, and nested/correlated subqueries.
6. Responsive Policyholder UI (`/claimant`, `/claimant/new`) with real-time coverage consumption bars and API route handlers (`POST /api/claims`, `GET /api/claims`, `GET /api/policies`).

---

## CHAPTER 1: INTRODUCTION & PROBLEM DEFINITION

### 1.1 Context & Domain Overview
Property and casualty insurance operations rely heavily on contractual terms specified in insurance policies. When an insured entity encounters loss (e.g., residential fire, auto accident, commercial structural failure), filing a claim initiates a high-stakes financial pipeline. Historically, insurance software suffered from two failure modes:
1. **Application-Level Validation Leaks:** Validating limits solely in client or application layers allows race conditions, phantom reads, and overdrawn coverage limits when concurrent claims are submitted.
2. **Loss of Historical Auditability:** Claim statuses frequently change from `SUBMITTED` to `UNDER_REVIEW`, `APPROVED`, or `SETTLED` without maintaining an immutable row-level history of who made the change and when.

### 1.2 Problem Definition
To build a resilient enterprise claim engine, the database itself must act as the primary enforcement barrier:
- **ACID Transactions & Invariants:** Enforcing check constraints (`remaining_coverage >= 0`, `end_date > start_date`, `claimed_amount > 0`).
- **Defensive Stored Procedures:** Encapsulating claim creation within `sp_FileClaim` so invalid claims (expired policy, future incident date, excessive amount) fail at the database engine level with actionable exceptions.
- **Automated Ledgering:** Leveraging PL/pgSQL database triggers to track every status transition without requiring manual logging statements from developers.
- **Polyglot Boundary:** Storing contractual financial entities in PostgreSQL while streaming narrative loss descriptions and photo links into MongoDB.

---

## CHAPTER 2: CONCEPTUAL MODEL & RELATIONAL MAPPING ALGORITHM

### 2.1 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ POLICIES : "holds / owns"
    USERS ||--o{ CLAIMS : "assigned adjuster"
    POLICIES ||--o{ CLAIMS : "covers"
    CLAIMS ||--o{ CLAIM_STATUS_HISTORY : "triggers audit log"
    CLAIMS ||--o| CLAIM_PAYOUTS : "settled via ledger"

    USERS {
        int user_id PK
        string full_name
        string email UK
        string phone
        string role "Policyholder | Adjuster | Admin"
        timestamp created_at
    }

    POLICIES {
        int policy_id PK
        string policy_number UK
        int user_id FK
        string policy_type "Homeowners | Commercial Property | Auto Physical Damage"
        numeric total_coverage
        numeric remaining_coverage
        numeric deductible
        date start_date
        date end_date
        boolean is_active
    }

    CLAIMS {
        int claim_id PK
        string claim_number UK
        int policy_id FK
        timestamp filing_date
        date incident_date
        numeric claimed_amount
        numeric approved_amount
        string status "SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | SETTLED"
        int assigned_adjuster_id FK
    }

    CLAIM_STATUS_HISTORY {
        int history_id PK
        int claim_id FK
        string previous_status
        string new_status
        int changed_by FK
        timestamp changed_at
    }

    CLAIM_PAYOUTS {
        int payout_id PK
        int claim_id FK_UK
        numeric net_payout
        string disbursement_status "PENDING | DISBURSED | FAILED"
        timestamp payout_date
    }
```

### 2.2 Relational Mapping Algorithm (ER to 3NF)

The conceptual schema is mapped to physical relational tables using formal normalization and relational mapping rules:

1. **Strong Entity Mapping (`Users`, `Policies`):**
   - Each strong entity becomes a relation with its primary key (`user_id`, `policy_id`).
   - All simple attributes map to atomic columns.
   - Functional dependency $FD_1: \text{user\_id} \rightarrow \{\text{full\_name}, \text{email}, \text{phone}, \text{role}\}$. Since candidate key is `user_id`, it satisfies BCNF.

2. **1:N Binary Relationship Mapping (`Users` to `Policies`):**
   - Represented by importing the primary key of `Users` (`user_id`) as a foreign key in `Policies`.
   - Referential integrity enforced via `REFERENCES Users(user_id) ON DELETE RESTRICT`.
   - Check constraint `chk_policy_dates` ensures $\text{end\_date} > \text{start\_date}$.

3. **1:N Binary Relationship Mapping (`Policies` to `Claims`):**
   - Primary key `claim_id` with imported foreign key `policy_id`.
   - Optional 1:N relationship with `Users` (`assigned_adjuster_id` refers to an Adjuster `user_id`).
   - Domain check constraint: `status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SETTLED')`.

4. **1:N Historical / Weak Entity Mapping (`Claims` to `Claim_Status_History`):**
   - Primary key `history_id` with cascade deletion `REFERENCES Claims(claim_id) ON DELETE CASCADE`.
   - Populated exclusively by PL/pgSQL database triggers.

5. **1:1 Transactional Ledger Mapping (`Claims` to `Claim_Payouts`):**
   - `claim_id` is defined as a unique foreign key (`claim_id INT UNIQUE`), guaranteeing that any single claim can only produce exactly one disbursement ledger entry.

---

## CHAPTER 3: DDL STATEMENTS, CONSTRAINTS & ADVANCED FEATURES

### 3.1 Relational DDL Specifications

```sql
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
```

---

### 3.2 Automated Status Audit Trigger (`trg_audit_claim_status`)

Whenever an adjuster updates the claim status (e.g. from `SUBMITTED` to `UNDER_REVIEW` or `SETTLED`), the trigger intercepts the operation and records the old status, new status, timestamp, and responsible user:

```sql
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

CREATE TRIGGER trg_audit_claim_status
AFTER UPDATE OF status ON Claims
FOR EACH ROW
EXECUTE FUNCTION fn_audit_claim_status();
```

---

### 3.3 Defensive Claim Intake Stored Procedure (`sp_FileClaim`)

This stored procedure encapsulates all business logic for claim registration:
1. Validates that the policy ID exists.
2. Asserts policy is active and not expired (`CURRENT_DATE <= end_date`).
3. Asserts incident date is not in the future (`incident_date <= CURRENT_DATE`).
4. Asserts claimed amount does not exceed remaining coverage.
5. Generates a unique, formatted claim identifier (`CLM-YYYYMMDDHH24MISS-POLICYID`).
6. Inserts the row into `Claims` and returns `p_claim_id` via an `INOUT` parameter.

```sql
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
```

---

### 3.4 Analytical SQL Queries

#### Query 1: Aggregation Grouped by Insurance Policy Type
```sql
SELECT 
    p.policy_type,
    COUNT(c.claim_id) AS total_claims_count,
    COALESCE(SUM(c.claimed_amount), 0.00) AS total_claimed_amount,
    COALESCE(ROUND(AVG(c.claimed_amount), 2), 0.00) AS avg_claimed_amount,
    COALESCE(SUM(c.approved_amount), 0.00) AS total_approved_payout
FROM Policies p
LEFT JOIN Claims c ON p.policy_id = c.policy_id
GROUP BY p.policy_type
ORDER BY total_claimed_amount DESC;
```
*Output Summary:*
```
     policy_type      | total_claims_count | total_claimed_amount | avg_claimed_amount | total_approved_payout 
----------------------+--------------------+----------------------+--------------------+-----------------------
 Homeowners           |                  4 |            332000.00 |           83000.00 |              50000.00
 Auto Physical Damage |                  1 |             85000.00 |           85000.00 |                  0.00
 Commercial Property  |                  0 |                 0.00 |               0.00 |                  0.00
```

#### Query 2: Nested Subquery Identifying Multiple Open Claims (Fraud/Risk Detection)
```sql
SELECT 
    u.user_id,
    u.full_name AS policyholder_name,
    u.email,
    u.phone,
    open_claims.active_claim_count,
    open_claims.total_pending_exposure
FROM Users u
JOIN (
    SELECT 
        p.user_id, 
        COUNT(c.claim_id) AS active_claim_count,
        SUM(c.claimed_amount) AS total_pending_exposure
    FROM Policies p
    JOIN Claims c ON p.policy_id = c.policy_id
    WHERE c.status IN ('SUBMITTED', 'UNDER_REVIEW')
    GROUP BY p.user_id
    HAVING COUNT(c.claim_id) > 1
) open_claims ON u.user_id = open_claims.user_id;
```
*Output Summary:*
```
 user_id | policyholder_name |        email         |   phone    | active_claim_count | total_pending_exposure 
---------+-------------------+----------------------+------------+--------------------+------------------------
       1 | Ramesh Kumar      | ramesh.k@example.com | 9876543210 |                  3 |              282000.00
```

#### Query 3: Correlated Subquery for Outlier Claims Exceeding Peer Average
```sql
SELECT 
    c.claim_id,
    c.claim_number,
    p.policy_type,
    c.claimed_amount,
    c.incident_date,
    c.status
FROM Claims c
JOIN Policies p ON c.policy_id = p.policy_id
WHERE c.claimed_amount > (
    SELECT AVG(c2.claimed_amount)
    FROM Claims c2
    JOIN Policies p2 ON c2.policy_id = p2.policy_id
    WHERE p2.policy_type = p.policy_type
);
```

---

## CHAPTER 4: APPLICATION ARCHITECTURE & CLAIMANT INTERFACE

### 4.1 Connection Pooling (`src/lib/db.ts`)
The application implements persistent PostgreSQL connection pooling through Node-Postgres (`pg`):
- Connection configuration maps to environment variables: `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`.
- Global singleton instance prevents pool exhaustion during Next.js Hot Module Replacement (HMR).

### 4.2 API Route Handlers

1. **`POST /api/claims` (Claim Submission):**
   - Accepts payload: `{ policy_id, incident_date, claimed_amount, damage_description, photo_urls }`.
   - Executes `CALL sp_FileClaim($1, $2::DATE, $3::NUMERIC, NULL)`.
   - Catches PostgreSQL error codes (e.g. `P0001` for validation exceptions) and responds with HTTP 422.
   - Synchronously inserts narrative and photo URLs into MongoDB collection `claim_incident_reports` and `IncidentReports`.
   - Returns HTTP 201 with newly generated claim details.

2. **`GET /api/claims` (Filing History):**
   - Retrieves all claims filed by the policyholder (`?user_id=1`).
   - Performs relational `JOIN` with `Policies` and `Users` to render remaining coverage limits, deductible, and assigned adjuster name.

3. **`GET /api/policies` (Active Policies):**
   - Queries `Policies` WHERE `is_active = TRUE` to populate the FNOL policy selector dropdown.

### 4.3 Claimant Frontend Pages

1. **Policyholder Dashboard (`/claimant`):**
   - Summary cards displaying **Active Policies**, **Total Coverage**, **Remaining Limit**, and **Open Claims**.
   - Visual coverage exhaustion progress bars for each policy.
   - Filing history table with status badges and timestamps.
   - Quick-switch selector allowing testing between multiple policyholders (Ramesh Kumar, Priya Sharma).

2. **Claim Submission Form (`/claimant/new`):**
   - Live policy selector showing remaining coverage and deductible in real-time.
   - Client-side and server-side limit validation warning users before submission if amount exceeds policy limit.
   - Calendar date picker restricted to current and past dates.
   - First Notice of Loss narrative textarea and photo URL attachments.
   - Success modal showing the official `CLM-YYYYMMDD...` reference number.

---

## CHAPTER 5: VERIFICATION & TEST RESULTS

| Test Scenario | Action / Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| **Valid Claim Filing** | `CALL sp_FileClaim(1, '2026-11-14', 75000.00)` | Claim created, returns claim_id, status `SUBMITTED` | Created `claim_id: 5`, claim number generated | **PASS** |
| **Over-Limit Rejection** | Claim 99,999,999 on 5,000,000 limit | RAISE EXCEPTION 'Claimed amount exceeds remaining coverage' | HTTP 422: `Claimed amount exceeds remaining coverage` | **PASS** |
| **Future Date Rejection** | Incident date: `2099-01-01` | RAISE EXCEPTION 'Incident date cannot be in the future' | HTTP 422: `Incident date cannot be in the future.` | **PASS** |
| **Status Audit Trigger** | Update claim status from `SUBMITTED` to `SETTLED` | Automated row inserted into `Claim_Status_History` | `history_id: 1` logged with `previous_status: SUBMITTED`, `new_status: SETTLED` | **PASS** |
| **Claimant Dashboard UI** | Load `http://localhost:3000/claimant` | Display active policies, remaining coverage, claim list | Displays Ramesh Kumar's policies & 4 filed claims | **PASS** |
| **FNOL Form Submission** | Submit form at `http://localhost:3000/claimant/new` | Invokes API, runs procedure, stores MongoDB doc | Returned success banner with claim number | **PASS** |
| **Atomic Settlement Integration**| Call `sp_SettleClaim` from Adjuster portal | Coverage deducted, payout row written in ledger | Policy remaining reduced by approved amount, payout logged | **PASS** |

---

## CONCLUSION
All database components, triggers, stored procedures, Next.js route handlers, and claimant interfaces assigned to **Member 1** are fully operational, thoroughly tested, and integrated with the Member 2 subsystem.
