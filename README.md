# Enterprise Insurance Claim Engine & Adjudication Platform
> A production-grade **Polyglot DBMS Architecture** pairing an ACID-compliant relational core (**PostgreSQL**) with an unstructured document & vector similarity store (**MongoDB**), built on **Next.js (App Router)** and **Tailwind CSS**.

---

## 👥 Team Workload Distribution

To satisfy rigorous software engineering and database design criteria, domain boundaries are divided cleanly:

| Domain | Member 1 (Lead: Tarsh Choudhary) | Member 2 (Lead: Sneha) |
|---|---|---|
| **Core Responsibilities** | **Intake & Policyholder Engine** | **Adjudication, Audit & Settlement Engine** |
| **Relational Database (PostgreSQL)** | • 3NF Schemas: `Users`, `Policies`, `Claims`, `Claim_Status_History`<br>• Defensive Validation Procedure: `sp_FileClaim`<br>• Automated Status Audit Trigger: `trg_audit_claim_status`<br>• Analytical DML Aggregations & Subqueries | • Window Analytical View: `vw_AdjusterPendingClaims`<br>• Multi-Table Atomic Settlement Procedure: `sp_SettleClaim`<br>• Ledger Table: `Claim_Payouts`<br>• Performance Indexing (`idx_claims_policy_status`) |
| **Document Store (MongoDB)** | • Synchronous First Notice of Loss (FNOL) document ingestion (`claim_incident_reports`) | • Schema & Index Design for `IncidentReports`<br>• Feature-hashed 256-d vector embeddings & cosine similarity pipeline |
| **Full-Stack Application (Next.js)** | • DB Connection Pool (`lib/db.ts`)<br>• `POST /api/claims` & `GET /api/claims`<br>• Policyholder Dashboard (`/claimant`)<br>• FNOL Claim Submission Form (`/claimant/new`) | • `GET /api/adjuster/claims` & `POST /api/adjuster/settle`<br>• `POST /api/claims/similarity`<br>• Adjuster Workbench (`/adjuster`)<br>• Claim Adjudication Review Modal (`/adjuster/claims/[id]`) |
| **Documentation** | • Master Report: Prelims, ER Diagram, Relational Mapping (ER to 3NF), DDL/DML | • Report: Unstructured design, Vector queries, Settlement transactions, Rubrics |

---

## 🏛️ System Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │          Next.js App Router (Port 3000)      │
                  │  • /claimant (Policyholder Dashboard)        │
                  │  • /claimant/new (FNOL Intake Form)          │
                  │  • /adjuster (Adjuster Workbench & Review)   │
                  └───────────────┬──────────────────────────────┘
                                  │
                  ┌───────────────┴──────────────────────────────┐
                  │             Next.js Route Handlers           │
                  │  POST /api/claims       GET /api/policies    │
                  │  GET /api/adjuster/claims  POST /settle      │
                  └───────────────┬──────────────────────────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
   ┌───────────────────────────┐     ┌───────────────────────────┐
   │     PostgreSQL 17         │     │         MongoDB           │
   │  • Users, Policies        │     │  • claim_incident_reports │
   │  • Claims, Status_History │     │  • IncidentReports        │
   │  • Claim_Payouts (Ledger) │     │  • 256-d Vector Cosine    │
   │  • sp_FileClaim           │     │    Similarity Pipeline    │
   │  • sp_SettleClaim         │     │  • Multimodal Photo Links │
   │  • trg_audit_claim_status │     └───────────────────────────┘
   └───────────────────────────┘
```

---

## 📊 Relational Database Design (PostgreSQL)

### Conceptual ER Model
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
    }

    POLICIES {
        int policy_id PK
        string policy_number UK
        int user_id FK
        string policy_type
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
        string status
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
        string disbursement_status
        timestamp payout_date
    }
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js**: v20+ or v22+
- **PostgreSQL**: v15+ (Running locally or via Docker/Cloud)
- **MongoDB**: (Optional for local testing; Atlas or local instance on 27017)

### 2. Configure Environment (`.env.local`)
Create `.env.local` in the project root:
```env
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=claims_engine
PG_USER=postgres
PG_PASSWORD=your_postgres_password

MONGODB_URI=mongodb://localhost:27017
```

### 3. Initialize the PostgreSQL Database
Execute the master schema and seed data with one command:
```bash
node --env-file=.env.local scripts/setup-db.mjs
```

### 4. Run Automated Member 1 Verification Suite
Verify stored procedures, validations, trigger logging, and views:
```bash
node --env-file=.env.local scripts/test-intake.mjs
```

### 5. Launch the Next.js Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**:
- **Policyholder Portal**: [http://localhost:3000/claimant](http://localhost:3000/claimant)
- **Submit New Claim**: [http://localhost:3000/claimant/new](http://localhost:3000/claimant/new)
- **Adjuster Workbench**: [http://localhost:3000/adjuster](http://localhost:3000/adjuster)

---

## 🧪 Verification & Test Scenarios

| Test Case | Procedure / Query | Expected Behavior |
|---|---|---|
| **Intake Validation** | `CALL sp_FileClaim(1, CURRENT_DATE, 35000.00, NULL)` | Successfully creates claim row and returns new `claim_id`. |
| **Limit Defense** | `CALL sp_FileClaim(1, CURRENT_DATE, 99999999.00, NULL)` | Raises SQL exception: *Claimed amount exceeds remaining coverage*. |
| **Future Date Defense**| `CALL sp_FileClaim(1, '2099-01-01', 1000.00, NULL)` | Raises SQL exception: *Incident date cannot be in the future*. |
| **Audit Trigger** | `UPDATE Claims SET status = 'UNDER_REVIEW'` | Automatically creates log entry in `Claim_Status_History`. |
| **Atomic Settlement** | `CALL sp_SettleClaim(1, 3, 50000.00)` | Deducts coverage from policy, writes ledger to `Claim_Payouts`, marks status as `SETTLED`. |

---

## 📄 Documentation Links
- **[Member 1 Report (Prelims, ER Model, 3NF Mapping, DDL/DML)](docs/MEMBER1_REPORT.md)**
- **[Member 2 Report (NoSQL, Vector Engine, Settlement Transaction)](docs/MEMBER2_REPORT.md)**
