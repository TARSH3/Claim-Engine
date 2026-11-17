# Mini Project Report on
# ENTERPRISE POLYGLOT INSURANCE CLAIM ENGINE & ADJUDICATION PLATFORM

**Submitted in partial fulfilment of the requirements for the award of degree of**  
**Bachelor of Technology**  
**in**  
**Computer Science & Engineering**  

### UE23CS351A – DBMS Project

---

### Submitted by:
| Name | SRN |
|---|---|
| **Tarsh Choudhary** (Member 1 Lead) | **PES2UG24CS556** |
| **Sneha** (Member 2 Lead) | **PES2UG24CS608** |

### Under the guidance of:
**Dr. Shilpa S**  
Assistant Professor  
Department of Computer Science and Engineering  
PES University  

**AUG - DEC 2026**

---

**DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING**  
**FACULTY OF ENGINEERING**  
**PES UNIVERSITY**  
*(Established under Karnataka Act No. 16 of 2013)*  
Electronic City, Hosur Road, Bengaluru – 560 100, Karnataka, India  

---

## CERTIFICATE

This is to certify that the mini project entitled **"Enterprise Polyglot Insurance Claim Engine & Adjudication Platform"** is a bonafide work carried out by:

| Student Name | SRN |
|---|---|
| **Tarsh Choudhary** | **PES2UG24CS556** |
| **Sneha** | **PES2UG24CS608** |

In partial fulfilment for the completion of fifth semester DBMS Project (**UE23CS351A**) in the Program of Study - Bachelor of Technology in Computer Science and Engineering under rules and regulations of PES University, Bengaluru during the period **AUG. 2026 – DEC. 2026**. It is certified that all corrections / suggestions indicated for internal assessment have been incorporated in the report. The project has been approved as it satisfies the 5th semester academic requirements in respect of project work.

<br><br><br>

_____________________________  
**Dr. Shilpa S**  
Assistant Professor  
Department of Computer Science and Engineering  
PES University, Electronic City Campus  

---

## DECLARATION

We hereby declare that the DBMS Project entitled **"Enterprise Polyglot Insurance Claim Engine & Adjudication Platform"** has been carried out by us under the guidance of **Dr. Shilpa S**, Assistant Professor and submitted in partial fulfilment of the course requirements for the award of degree of Bachelor of Technology in Computer Science and Engineering of PES University, Bengaluru during the academic semester **AUG – DEC 2026**.

| Student Name | SRN | Signature |
|---|---|---|
| **Tarsh Choudhary** | PES2UG24CS556 | __________________ |
| **Sneha** | PES2UG24CS608 | __________________ |

---

## ACKNOWLEDGEMENT

I would like to express my gratitude to **Dr. Shilpa S**, Department of Computer Science and Engineering, PES University, for her continuous guidance, assistance, and encouragement throughout the development of this UE23CS351A - DBMS Project.

I take this opportunity to thank **Dr. Sandesh B J**, Professor and Chairperson, Department of Computer Science and Engineering, PES University, for all the knowledge and support I have received from the department.

I am deeply grateful to **Prof. Jawahar Doreswamy**, Chancellor – PES University, and **Dr. Suryaprasad J**, Vice-Chancellor, PES University for providing various opportunities and enlightenment every step of the way. Finally, this DBMS Project could not have been completed without the continual support and encouragement received from my family and friends.

---

## ABSTRACT

In enterprise property and casualty insurance domains, managing the lifecycle of an insurance claim demands mathematical validation, legal auditability, and transaction atomicity, balanced against the need to process rich, semi-structured incident evidence. Traditional relational databases alone struggle with flexible, unstructured multimodal data such as dynamic loss narratives and photo links, while pure document stores lack strict ACID transaction guarantees, row-level locks, and complex relational constraints required for financial disbursements.

This project implements a **Polyglot Database Architecture** bridging **PostgreSQL 17** and **MongoDB 8**. The relational core (PostgreSQL) is modeled in **Third Normal Form (3NF)** across five entities: `Users`, `Policies`, `Claims`, `Claim_Status_History`, and `Claim_Payouts`. Defensive business rules are enforced directly within the database engine:
1. **Intake Validation Procedure (`sp_FileClaim`)**: Restricts claim registration to active, unexpired policies, enforces chronological consistency (`incident_date <= CURRENT_DATE`), and programmatically rejects claims exceeding remaining coverage limits.
2. **Status Audit Trigger (`trg_audit_claim_status`)**: Intercepts every claim status transition and autonomously logs old status, new status, responsible adjuster, and timestamp into an immutable audit table.
3. **Multi-Table Atomic Settlement Procedure (`sp_SettleClaim`)**: Executes row-level locking (`FOR UPDATE`), deducts policy coverage, records financial disbursement ledgers, and resolves claim status in a single atomic transaction.
4. **Polyglot Evidence Store**: Persists First Notice of Loss (FNOL) narratives and photo evidence arrays into MongoDB, enabling 256-dimensional vector cosine similarity queries for duplicate and fraud detection.

The system is deployed with a **Next.js 15 (App Router)** full-stack web application featuring a **Policyholder Portal** (`/claimant`) and an **Adjuster Workbench** (`/adjuster`).

---

## TABLE OF CONTENTS

| Chapter No. | Title | Page No. |
|---|---|---|
| | **CERTIFICATE** | ii |
| | **DECLARATION** | iii |
| | **ACKNOWLEDGEMENT** | iv |
| | **ABSTRACT** | v |
| **1** | **INTRODUCTION** | 1 |
| **2** | **PROBLEM DEFINITION** | 3 |
| **3** | **ER MODEL** | 5 |
| **4** | **ER TO RELATIONAL MAPPING** | 7 |
| | 4.1 Steps of Algorithm for Chosen Problem | 7 |
| | 4.2 Complete Diagram of Relational Mapping | 9 |
| **5** | **DDL STATEMENTS** | 10 |
| **6** | **DML STATEMENTS** | 15 |
| **7** | **QUERIES** | 18 |
| | 7.1 Simple Query with GROUP BY and Aggregate Functions | 18 |
| | 7.2 UPDATE Operation | 19 |
| | 7.3 DELETE Operation | 20 |
| | 7.4 Correlated Query | 21 |
| | 7.5 Nested Query | 22 |
| **8** | **STORED PROCEDURES, FUNCTIONS AND TRIGGERS** | 24 |
| | 8.1 Stored Procedures or Functions (`sp_FileClaim`, `sp_SettleClaim`) | 24 |
| | 8.2 Triggers (`trg_audit_claim_status`) | 28 |
| **9** | **FRONT END DEVELOPMENT** | 30 |
| | 9.1 Next.js Application Architecture | 30 |
| | 9.2 Policyholder Portal (`/claimant` & `/claimant/new`) | 31 |
| | 9.3 Adjuster Workbench & Settlement Modal (`/adjuster`) | 33 |
| | **REFERENCES / BIBLIOGRAPHY** | 36 |
| | **APPENDIX A: DEFINITIONS, ACRONYMS AND ABBREVIATIONS** | 37 |

---

## LIST OF TABLES

| Table No. | Title | Page No. |
|---|---|---|
| **3.1** | Role-Based User Privileges | 6 |
| **5.1** | Relational Tables & Primary/Foreign Keys Summary | 14 |
| **6.1** | Seed Data: Policyholders and Adjusters | 15 |
| **6.2** | Seed Data: Active Insurance Policies | 16 |
| **6.3** | Seed Data: Initial Claims Records | 17 |
| **7.1** | Aggregated Capital by Policy Type Output | 19 |
| **7.2** | Fraud Screening (Nested Query) Output | 23 |
| **8.1** | Test Matrix for Stored Procedures & Triggers | 29 |

---

## LIST OF FIGURES

| Figure No. | Title | Page No. |
|---|---|---|
| **3.1** | Conceptual Entity-Relationship (ER) Diagram | 5 |
| **4.1** | Relational Schema & Foreign Key Mapping Diagram | 9 |
| **5.1** | PostgreSQL Table Verification Output (`\dt`) | 14 |
| **6.1** | Seed Data Verification Output in pgAdmin | 17 |
| **8.1** | Status Transition Audit Log Generated by Trigger | 28 |
| **9.1** | Polyglot System Architecture Block Diagram | 30 |
| **9.2** | Policyholder Dashboard UI (`/claimant`) | 32 |
| **9.3** | First Notice of Loss (FNOL) Intake Form (`/claimant/new`) | 33 |
| **9.4** | Adjuster Workbench Queue UI (`/adjuster`) | 34 |
| **9.5** | Claim Review & Adjudication Modal (`/adjuster/claims/[id]`) | 35 |

---

# 1. INTRODUCTION

Insurance claim processing forms the economic backbone of property, casualty, and commercial indemnity sectors. When an insured policyholder experiences property loss or vehicle collision, they initiate a First Notice of Loss (FNOL). The insurance provider must evaluate the validity of the contractual coverage, verify that the claimed amount does not exceed the remaining indemnity limit, assign an adjuster, inspect physical and photographic evidence, and execute an audited financial payout.

Historically, legacy insurance systems suffered from critical architectural limitations:
1. **Application-Layer Validation Vulnerabilities:** Relying on web forms or application controllers to validate coverage limits introduces race conditions and phantom reads under concurrent access, leading to catastrophic coverage overdrafts.
2. **Loss of Audit Traceability:** Status transitions between claim intake, adjuster review, and payout often lack automated database-enforced logging, compromising legal and regulatory compliance.
3. **Impedance Mismatch in Evidence Storage:** Incident descriptions, police reports, and damage photos are inherently semi-structured. Forcing unstructured narrative text and varying photo arrays into rigid relational tables produces sparse, poorly normalized schemas, while using pure NoSQL databases sacrifices ACID transaction guarantees required for financial ledgers.

To solve these challenges, this project introduces a **Polyglot DBMS Architecture**:
- **PostgreSQL 17** serves as the **ACID Source of Truth**, governing users, active policies, coverage balances, claim statuses, and payout ledgers through primary/foreign keys, check constraints, stored procedures, and triggers.
- **MongoDB 8** serves as the **Unstructured Evidence Store**, ingesting incident narratives and image URLs linked to relational claims via foreign keys, and computing vector cosine similarity over 256-dimensional feature hashes for duplicate detection.
- **Next.js 15 (App Router)** provides a unified TypeScript application layer communicating through pooled database connections.

---

# 2. PROBLEM DEFINITION

The primary objective of this project is to architect, implement, and benchmark a complete, production-grade insurance claim intake and adjudication platform that satisfies Level-3 DBMS design criteria:

1. **Relational Data Integrity:** Design a normalized 3NF relational schema that eliminates update, deletion, and insertion anomalies for policies and claims.
2. **Defensive Invariant Enforcement:** Implement a PostgreSQL Stored Procedure (`sp_FileClaim`) that programmatically guarantees:
   - Target policy exists and is currently active (`is_active = TRUE`).
   - Policy end date has not passed (`CURRENT_DATE <= end_date`).
   - Incident date is not in the future (`incident_date <= CURRENT_DATE`).
   - Claimed amount does not exceed available coverage limit (`claimed_amount <= remaining_coverage`).
3. **Autonomous Event-Driven Auditing:** Implement a PL/pgSQL Trigger (`trg_audit_claim_status`) that monitors `Claims.status` modifications and automatically writes historical snapshot rows into `Claim_Status_History`.
4. **Multi-Table Atomic Settlement:** Implement an atomic stored procedure (`sp_SettleClaim`) that acquires row-level locks (`FOR UPDATE`), deducts policy coverage, marks claim status as `SETTLED`, and writes a payout ledger entry to `Claim_Payouts` within a single ACID transaction boundary.
5. **Polyglot Document Integration:** Connect PostgreSQL claims with MongoDB First Notice of Loss documents and vector embeddings for fraud identification.
6. **Dual Role-Based Interfaces:** Build dedicated, responsive user interfaces for both Policyholders (`/claimant`) and Adjusters (`/adjuster`).

---

# 3. ER MODEL

The conceptual domain consists of five core entities with clearly defined cardinalities and participation constraints:
- **`Users`**: Represents human actors with Role-Based Access Control (`Policyholder`, `Adjuster`, `Admin`).
- **`Policies`**: Represents legal underwriting contracts owned by policyholders.
- **`Claims`**: Represents loss compensation requests filed against an active policy.
- **`Claim_Status_History`**: Represents an audit history log recording every status transition of a claim.
- **`Claim_Payouts`**: Represents the immutable financial settlement ledger.

### 3.1 Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ POLICIES : "holds / owns (1:N)"
    USERS ||--o{ CLAIMS : "assigned adjuster (1:N)"
    POLICIES ||--o{ CLAIMS : "covers (1:N)"
    CLAIMS ||--o{ CLAIM_STATUS_HISTORY : "triggers audit log (1:N)"
    CLAIMS ||--o| CLAIM_PAYOUTS : "settled via ledger (1:1)"

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

### 3.2 Cardinality & Participation Constraints
- **Users to Policies (1 : N):** One policyholder can hold multiple insurance policies; each policy belongs to exactly one user (total participation on Policies).
- **Policies to Claims (1 : N):** One policy can cover multiple claims over time; each claim references exactly one policy.
- **Claims to Claim_Status_History (1 : N):** One claim produces multiple audit entries as it progresses through its lifecycle.
- **Claims to Claim_Payouts (1 : 1):** A claim can produce at most one financial settlement disbursement row (`claim_id` has a `UNIQUE` foreign key constraint in `Claim_Payouts`).

---

# 4. ER TO RELATIONAL MAPPING

### 4.1 Steps of Algorithm for Chosen Problem

The 7-step formal mapping algorithm converts the conceptual ER schema into Third Normal Form (3NF) relations:

* **Step 1: Mapping Strong Entity Types**
  - Create relation `Users(user_id, full_name, email, phone, role, created_at)`. Primary Key: `user_id`.
  - Create relation `Policies(policy_id, policy_number, total_coverage, remaining_coverage, deductible, start_date, end_date, is_active)`. Primary Key: `policy_id`.
  - Create relation `Claims(claim_id, claim_number, filing_date, incident_date, claimed_amount, approved_amount, status)`. Primary Key: `claim_id`.

* **Step 2: Mapping 1:N Relationship Types**
  - **`Users` to `Policies` (`holds`):** Import `user_id` as foreign key into `Policies`. Foreign key: `Policies.user_id` $\rightarrow$ `Users.user_id` (`ON DELETE RESTRICT`).
  - **`Policies` to `Claims` (`covers`):** Import `policy_id` as foreign key into `Claims`. Foreign key: `Claims.policy_id` $\rightarrow$ `Policies.policy_id` (`ON DELETE RESTRICT`).
  - **`Users` to `Claims` (`assigned adjuster`):** Import `user_id` as nullable foreign key `assigned_adjuster_id` into `Claims`. Foreign key: `Claims.assigned_adjuster_id` $\rightarrow$ `Users.user_id` (`ON DELETE SET NULL`).

* **Step 3: Mapping Weak / Historical Entity Types**
  - Relation `Claim_Status_History(history_id, claim_id, previous_status, new_status, changed_by, changed_at)`.
  - Primary Key: `history_id`. Foreign key: `claim_id` $\rightarrow$ `Claims.claim_id` (`ON DELETE CASCADE`).

* **Step 4: Mapping 1:1 Transactional Ledger Relationships**
  - Relation `Claim_Payouts(payout_id, claim_id, net_payout, disbursement_status, payout_date)`.
  - Primary Key: `payout_id`. Foreign key `claim_id` has a `UNIQUE` constraint, enforcing strict 1:1 cardinality.

* **Step 5: Normalization Verification (3NF Justification)**
  - **1NF:** Atomic attribute types throughout.
  - **2NF:** All non-key attributes are fully dependent on their relation's primary key; no composite primary key partial dependencies exist.
  - **3NF / BCNF:** In all functional dependencies $X \rightarrow Y$, $X$ is a superkey:
    - $\text{Users: } \text{user\_id} \rightarrow \{\text{full\_name}, \text{email}, \text{phone}, \text{role}\}$
    - $\text{Policies: } \text{policy\_id} \rightarrow \{\text{policy\_number}, \text{user\_id}, \text{total\_coverage}, \dots\}$
    - $\text{Claims: } \text{claim\_id} \rightarrow \{\text{claim\_number}, \text{policy\_id}, \text{claimed\_amount}, \dots\}$

### 4.2 Complete Diagram of Relational Mapping

```text
USERS (
    user_id [PK], full_name, email [UK], phone, role, created_at
)

POLICIES (
    policy_id [PK], policy_number [UK], user_id [FK -> USERS.user_id],
    policy_type, total_coverage, remaining_coverage, deductible,
    start_date, end_date, is_active
)

CLAIMS (
    claim_id [PK], claim_number [UK], policy_id [FK -> POLICIES.policy_id],
    filing_date, incident_date, claimed_amount, approved_amount, status,
    assigned_adjuster_id [FK -> USERS.user_id]
)

CLAIM_STATUS_HISTORY (
    history_id [PK], claim_id [FK -> CLAIMS.claim_id],
    previous_status, new_status, changed_by [FK -> USERS.user_id], changed_at
)

CLAIM_PAYOUTS (
    payout_id [PK], claim_id [FK_UK -> CLAIMS.claim_id],
    net_payout, disbursement_status, payout_date
)
```

---

# 5. DDL STATEMENTS

The Data Definition Language (DDL) statements establish tables, check constraints, foreign keys, and indexes in PostgreSQL:

```sql
-- 1. Users Table with Role Constraints
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('Policyholder', 'Adjuster', 'Admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Policies Table with Balance & Date Invariants
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

-- 3. Claims Table with Lifecycle Status Domain
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

-- 4. Audit History Table
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

-- 6. High-Frequency B-Tree Indexes
CREATE INDEX idx_claims_policy_status ON Claims(policy_id, status);
CREATE INDEX idx_claims_adjuster ON Claims(assigned_adjuster_id);
```

### Table Verification in PostgreSQL (`\dt`)
```text
                      List of relations
 Schema |         Name         | Type  |     Owner      
--------+----------------------+-------+----------------
 public | claim_payouts        | table | tarshchoudhary
 public | claim_status_history | table | tarshchoudhary
 public | claims               | table | tarshchoudhary
 public | policies             | table | tarshchoudhary
 public | users                | table | tarshchoudhary
(5 rows)
```

---

# 6. DML STATEMENTS

Data Manipulation Language (DML) statements populate initial seed records representing policyholders, corporate adjusters, and active property and auto policies:

```sql
-- 1. Insert Role-Based Users
INSERT INTO Users (full_name, email, phone, role) VALUES
('Ramesh Kumar', 'ramesh.k@example.com', '9876543210', 'Policyholder'),
('Priya Sharma', 'priya.s@example.com', '9876543211', 'Policyholder'),
('Ananya Deshmukh', 'ananya.d@insurance.com', '9876543212', 'Adjuster'),
('Siddharth Nair', 'siddharth.n@insurance.com', '9876543213', 'Adjuster')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Policies
INSERT INTO Policies (policy_number, user_id, policy_type, total_coverage, remaining_coverage, deductible, start_date, end_date) VALUES
('POL-PROP-2026-001', 1, 'Homeowners', 5000000.00, 5000000.00, 25000.00, '2026-01-01', '2027-01-01'),
('POL-AUTO-2026-002', 2, 'Auto Physical Damage', 1200000.00, 1200000.00, 10000.00, '2026-03-15', '2027-03-15'),
('POL-COMM-2026-003', 1, 'Commercial Property', 8000000.00, 8000000.00, 50000.00, '2026-02-01', '2027-02-01')
ON CONFLICT (policy_number) DO NOTHING;

-- 3. Insert Initial Claims
INSERT INTO Claims (claim_number, policy_id, incident_date, claimed_amount, status) VALUES
('CLM-20261101-0001', 1, '2026-10-25', 150000.00, 'SUBMITTED'),
('CLM-20261105-0002', 1, '2026-11-02', 45000.00, 'UNDER_REVIEW'),
('CLM-20261110-0003', 2, '2026-11-08', 85000.00, 'SUBMITTED')
ON CONFLICT (claim_number) DO NOTHING;
```

### Table Output Verification (`SELECT * FROM Policies;`)
```text
 policy_id |   policy_number   | user_id |     policy_type      | total_coverage | remaining_coverage | deductible | start_date |  end_date  | is_active 
-----------+-------------------+---------+----------------------+----------------+--------------------+------------+------------+------------+-----------
         1 | POL-PROP-2026-001 |       1 | Homeowners           |     5000000.00 |         5000000.00 |   25000.00 | 2026-01-01 | 2027-01-01 | t
         2 | POL-AUTO-2026-002 |       2 | Auto Physical Damage |     1200000.00 |         1200000.00 |   10000.00 | 2026-03-15 | 2027-03-15 | t
         3 | POL-COMM-2026-003 |       1 | Commercial Property  |     8000000.00 |         8000000.00 |   50000.00 | 2026-02-01 | 2027-02-01 | t
(3 rows)
```

---

# 7. QUERIES

### 7.1 Simple Query with GROUP BY and Aggregate Functions
Evaluates the aggregate volume, total capital at risk, average claim size, and approved payouts per insurance line:

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
**Output:**
```text
     policy_type      | total_claims_count | total_claimed_amount | avg_claimed_amount | total_approved_payout 
----------------------+--------------------+----------------------+--------------------+-----------------------
 Homeowners           |                  2 |            195000.00 |           97500.00 |                  0.00
 Auto Physical Damage |                  1 |             85000.00 |           85000.00 |                  0.00
 Commercial Property  |                  0 |                 0.00 |               0.00 |                  0.00
(3 rows)
```

---

### 7.2 UPDATE Operation
Modifies policy limits when policy endorsements are purchased or deductibles are revised:

```sql
-- Apply a 10% coverage limit bonus to active Homeowners policies
UPDATE Policies
SET total_coverage = total_coverage * 1.10,
    remaining_coverage = remaining_coverage * 1.10
WHERE policy_type = 'Homeowners' AND is_active = TRUE;
```
**Output:** `UPDATE 1`

---

### 7.3 DELETE Operation
Deletes unassigned claims that were rejected without dispute within a 90-day grace period:

```sql
-- Safe deletion of stale rejected claims (cascades to Claim_Status_History)
DELETE FROM Claims
WHERE status = 'REJECTED' 
  AND assigned_adjuster_id IS NULL 
  AND filing_date < CURRENT_TIMESTAMP - INTERVAL '90 days';
```
**Output:** `DELETE 0` *(Safely executed without foreign key violations)*

---

### 7.4 Correlated Query
Identifies claims whose requested amount is higher than the average claim size for that specific policy type:

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
**Output:**
```text
 claim_id |   claim_number    | policy_type | claimed_amount | incident_date |  status   
----------+-------------------+-------------+----------------+---------------+-----------
        1 | CLM-20261101-0001 | Homeowners  |      150000.00 | 2026-10-25    | SUBMITTED
(1 row)
```

---

### 7.5 Nested Query
Identifies policyholders with multiple open or pending claims to flag potential duplicate filing fraud:

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
**Output:**
```text
 user_id | policyholder_name |        email         |   phone    | active_claim_count | total_pending_exposure 
---------+-------------------+----------------------+------------+--------------------+------------------------
       1 | Ramesh Kumar      | ramesh.k@example.com | 9876543210 |                  2 |              195000.00
(1 row)
```

---

# 8. STORED PROCEDURES, FUNCTIONS AND TRIGGERS

### 8.1 Stored Procedures or Functions

#### Procedure 1: Defensive Intake Validation (`sp_FileClaim`) — Member 1 Lead
Encapsulates claim intake business rules directly within PostgreSQL:

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
    -- 1. Validate Policy Existence and State
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

    -- 2. Chronological Integrity Check
    IF p_incident_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Incident date cannot be in the future.';
    END IF;

    -- 3. Available Balance Check
    IF p_claimed_amount > v_rem_coverage THEN
        RAISE EXCEPTION 'Claimed amount (%) exceeds remaining coverage (%).', p_claimed_amount, v_rem_coverage;
    END IF;

    -- 4. Generate Unique Claim Identifier
    v_claim_num := 'CLM-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS') || '-' || LPAD(p_policy_id::TEXT, 4, '0');

    -- 5. Insert Validated Claim
    INSERT INTO Claims (claim_number, policy_id, incident_date, claimed_amount, status)
    VALUES (v_claim_num, p_policy_id, p_incident_date, p_claimed_amount, 'SUBMITTED')
    RETURNING claim_id INTO p_claim_id;
END;
$$;
```

#### Procedure 2: Multi-Table Atomic Settlement (`sp_SettleClaim`) — Member 2 Lead
Executes row-level locking, balance deduction, and financial payout ledger generation in a single transaction:

```sql
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
    -- 1. Verify Authorized Adjuster Role
    IF NOT EXISTS (SELECT 1 FROM Users WHERE user_id = p_adjuster_id AND role = 'Adjuster') THEN
        RAISE EXCEPTION 'User ID % is not an authorized Adjuster.', p_adjuster_id;
    END IF;

    -- 2. Lock Claim Row (Row-Level Concurrency Control)
    SELECT status, policy_id INTO v_status, v_policy_id 
    FROM Claims WHERE claim_id = p_claim_id FOR UPDATE;

    IF v_status = 'SETTLED' THEN
        RAISE EXCEPTION 'Claim % has already been settled.', p_claim_id;
    END IF;

    -- 3. Lock Policy Row and Verify Balance
    SELECT deductible, remaining_coverage INTO v_deductible, v_remaining_cov
    FROM Policies WHERE policy_id = v_policy_id FOR UPDATE;

    IF p_approved_amount > v_remaining_cov THEN
        RAISE EXCEPTION 'Approved amount exceeds remaining policy coverage.';
    END IF;

    -- 4. Compute Net Payout After Deductible
    v_net_payout := GREATEST(0.00, p_approved_amount - v_deductible);

    -- 5. Atomically Deduct Policy Balance
    UPDATE Policies SET remaining_coverage = remaining_coverage - p_approved_amount WHERE policy_id = v_policy_id;

    -- 6. Update Claim Status
    UPDATE Claims SET status = 'SETTLED', approved_amount = p_approved_amount, assigned_adjuster_id = p_adjuster_id WHERE claim_id = p_claim_id;

    -- 7. Insert Financial Disbursement Ledger
    INSERT INTO Claim_Payouts (claim_id, net_payout, disbursement_status) VALUES (p_claim_id, v_net_payout, 'DISBURSED');
END;
$$;
```

---

### 8.2 Triggers

#### Trigger: Automated Status Audit Logging (`trg_audit_claim_status`) — Member 1 Lead
Guarantees that no claim status can transition without generating an immutable audit record:

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

### Trigger Verification Output:
```text
 history_id | claim_id | previous_status |  new_status  | changed_by |         changed_at         
------------+----------+-----------------+--------------+------------+----------------------------
          1 |        1 | SUBMITTED       | UNDER_REVIEW |          3 | 2026-11-17 08:28:12.684091
          2 |        1 | UNDER_REVIEW    | SETTLED      |          3 | 2026-11-17 08:37:36.106285
(2 rows)
```

---

# 9. FRONT END DEVELOPMENT

### 9.1 Next.js Application Architecture

The frontend and API layer is constructed with **Next.js 15 (App Router)** in TypeScript:
- **`src/lib/db.ts`**: Implements a singleton PostgreSQL connection pool (`pg.Pool`) configured with environment variables (`PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`).
- **`src/lib/mongo.ts`**: Provides a MongoDB client connection for unstructured FNOL document operations and cosine vector similarity searches.
- **`src/app/api/claims/route.ts`**:
  - `POST /api/claims`: Invokes `sp_FileClaim`, catches PL/pgSQL validation exceptions (`P0001`), and writes narrative descriptions to MongoDB `claim_incident_reports`.
  - `GET /api/claims`: Retrieves complete claim histories with relational joins across `Policies` and `Users`.
- **`src/app/api/adjuster/settle/route.ts`**: Invokes `sp_SettleClaim` atomically to approve or reject pending claims.

---

### 9.2 Policyholder Portal (`/claimant` & `/claimant/new`)

* **Policyholder Dashboard (`/claimant`):**
  - Displays cards summarizing active policies, total contractual coverage, remaining coverage limits, and pending claims.
  - Interactive coverage exhaustion progress bars visualising remaining indemnity.
  - Claims history table displaying status badges and settlement amounts.
  - User switcher allowing seamless toggling between test claimants (**Ramesh Kumar** and **Priya Sharma**).

* **First Notice of Loss Intake Form (`/claimant/new`):**
  - Dropdown selecting from active, unexpired policies.
  - Dynamic client-side indicator warning the user in real-time if their requested amount exceeds remaining coverage.
  - Calendar date picker restricted to current and historical dates.
  - Narrative loss description textarea and photo URL array input saved to MongoDB.

---

### 9.3 Adjuster Workbench & Settlement Modal (`/adjuster`)

* **Adjuster Workbench (`/adjuster`):**
  - Data table powered by the SQL view `vw_AdjusterPendingClaims`.
  - Real-time status filter tabs (`All`, `Pending`, `Under Review`, `Approved`, `Rejected`).
  - Search bar filtering by claimant name, claim number, or policy number.
  - Review button linking to `/adjuster/claims/[id]`.

* **Claim Adjudication Modal (`SettleModal.tsx`):**
  - Side-by-side inspection of relational claim details with unstructured MongoDB incident photos and descriptions.
  - Radio toggle between `Approved`, `Rejected`, and `Under Review`.
  - Number input for approved payout amount capped at the minimum of claimed amount and remaining coverage.
  - Executes `sp_SettleClaim`, immediately deducting coverage and logging payout ledgers.

---

## REFERENCES / BIBLIOGRAPHY

1. Silberschatz, A., Korth, H. F., & Sudarshan, S. (2020). *Database System Concepts* (7th ed.). McGraw-Hill Education.
2. PostgreSQL Global Development Group. (2026). *PostgreSQL 17.0 Documentation: Procedural Languages - PL/pgSQL*. https://www.postgresql.org/docs/17/plpgsql.html
3. MongoDB Inc. (2026). *MongoDB Manual: Aggregation Pipelines and Vector Searches*. https://www.mongodb.com/docs/manual/aggregation/
4. Vercel Inc. (2026). *Next.js App Router and Server Route Handlers Documentation*. https://nextjs.org/docs/app

**GitHub Repository:**  
👉 [https://github.com/TARSH3/Claim-Engine](https://github.com/TARSH3/Claim-Engine)

---

## APPENDIX A: DEFINITIONS, ACRONYMS AND ABBREVIATIONS

* **ACID**: Atomicity, Consistency, Isolation, Durability
* **BCNF**: Boyce-Codd Normal Form
* **DDL**: Data Definition Language
* **DML**: Data Manipulation Language
* **ER**: Entity-Relationship
* **FNOL**: First Notice of Loss
* **FK**: Foreign Key
* **HMR**: Hot Module Replacement
* **JSON**: JavaScript Object Notation
* **NLP**: Natural Language Processing
* **NoSQL**: Not Only Structured Query Language
* **PK**: Primary Key
* **PL/pgSQL**: Procedural Language / PostgreSQL Structured Query Language
* **RDBMS**: Relational Database Management System
* **SRN**: Student Registration Number
* **3NF**: Third Normal Form
* **UI**: User Interface
