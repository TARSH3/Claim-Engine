# Member 2 — Unstructured/Vector Engine & Adjuster Audit Workflow

## 1. Tech Stack Justification
| Layer | Choice | Why |
|---|---|---|
| Frontend + API | **Next.js (App Router), React 19, Tailwind 4** | One codebase for portal and Route Handlers; server-side DB access keeps credentials off the browser. |
| Relational DB | **PostgreSQL** | Claims, policies and payouts need ACID transactions, row locks (`FOR UPDATE`), CHECK constraints and views. |
| NoSQL / Vector DB | **MongoDB** (`IncidentReports`) | Incident reports are semi-structured (free text, photo lists, growing note arrays, optional fields). Documents suit this better than normalised tables, and aggregation pipelines can compute vector cosine similarity in-database. |
| Embeddings | **Feature-hashed text vectors (256-d, unit length)** | No paid API or model needed, deterministic, and dot product equals cosine similarity. Can be swapped for a real embedding model without changing the schema. |
| Drivers | `pg`, `mongodb` | Already in `package.json`. |

Polyglot persistence: SQL is the source of truth for money and status; Mongo holds evidence and analytics data, linked by `claimId`.

## 2. MongoDB Schema — `IncidentReports`
```json
{
  "claimId": 1,                      // links to claims.claim_id (unique)
  "policyId": 1,
  "incidentType": "Auto Collision",
  "description": "free text …",
  "location": "MG Road, Bengaluru",
  "incidentDate": ISODate("2026-10-02"),
  "severityScore": 7,                // 1–10
  "photos": ["https://…"],
  "adjusterNotes": [{ "author": "Adjuster", "note": "…", "createdAt": ISODate() }],
  "embedding": [0.04, -0.11, … 256 numbers],
  "createdAt": ISODate()
}
```
Indexes: `{claimId:1}` unique · `{policyId:1, location:1}` (duplicate clusters) · `{incidentType:1, severityScore:1}` (severity benchmark) · text index on `description`.

## 3. Query Documentation (`src/lib/similarity.ts`)
1. **Cosine similarity + duplicate score** (`similarityPipeline`): `$match` other reports → `$addFields` computes `cosineSimilarity` with `$reduce` over `$zip(embedding, probeVector)`, `sameLocation`, `dayGap` (`$dateDiff`), `severityDiff` → `riskScore = 0.6·cosine + 0.2·sameLocation + 0.2·(dayGap ≤ 7)` → filter ≥ 0.4 → `$sort` → `$limit 5`.
   Risk level: ≥ 0.75 **HIGH**, ≥ 0.5 **MEDIUM**, otherwise **LOW**.
2. **Severity matching** (`severityBenchmarkPipeline`): `$group` by `incidentType` to get peer average; the portal warns when a claim differs from peers by 2+ points.
3. **Duplicate clusters** (`duplicateClusterPipeline`): `$group` by `{policyId, location}`, `$match count > 1`.

*pgvector alternative:* `CREATE EXTENSION vector; CREATE TABLE ClaimEmbeddings(claim_id INT PRIMARY KEY, embedding vector(256)); SELECT claim_id, 1-(embedding <=> $1) AS sim FROM ClaimEmbeddings WHERE claim_id<>$2 ORDER BY embedding <=> $1 LIMIT 5;`

## 4. Advanced SQL
- **View `vw_AdjusterPendingClaims`** (`sql/02_adjuster_view.sql`): joins claims, policies, policyholders; adds `total_claims_filed` (`COUNT() OVER PARTITION BY policyholder`), `total_paid_on_policy` (windowed `SUM … FILTER`), and coverage limit/remaining.
- **Transaction `sp_settle_claim`** (`sql/03_settle_claim.sql`), called by the API inside `BEGIN … COMMIT`: lock claim and policy rows (`FOR UPDATE`) → validate (not already settled, amount ≤ claimed, amount ≤ remaining coverage) → update claim → insert ledger row in `claim_transactions` → deduct `remaining_coverage`. Any failure rolls everything back.

## 5. API Routes
| Route | Purpose |
|---|---|
| `GET /api/adjuster/claims?status=&q=` | Queue from the view; filters by status and holder/policy search |
| `GET /api/adjuster/claims/:id` | Claim row + Mongo report (detail page) |
| `POST /api/adjuster/settle` | Atomic approve / reject / mark under review (400 bad input, 422 rule violation) |
| `POST /api/claims/similarity` | `{claimId}`, `{description,…}` or `{mode:"clusters"}` |

## 6. Folder Tree
```
claim-engine/
├─ sql/                    01_schema · 02_adjuster_view · 03_settle_claim · 04_seed
├─ scripts/                setup-db.mjs · seed-mongo.mjs
├─ docs/MEMBER2_REPORT.md
└─ src/
   ├─ app/
   │  ├─ adjuster/page.tsx                 claims table + filters
   │  ├─ adjuster/claims/[id]/page.tsx     review page wrapper (Suspense)
   │  └─ api/
   │     ├─ adjuster/claims/route.ts · claims/[id]/route.ts
   │     ├─ adjuster/settle/route.ts
   │     └─ claims/similarity/route.ts
   ├─ components/adjuster/   ClaimReview · SettleModal · SimilarityAlert · StatusBadge
   └─ lib/                   pg · mongo · embedding · similarity · types · format
```
Integration note: `01_schema.sql` assumes table names `policyholders`, `policies`, `claims`. If Member 1's names differ, edit the view and function accordingly.

## 7. Evaluation Rubric / Completion Table
| Requirement | Status | Evidence |
|---|---|---|
| Mongo `IncidentReports` collection + indexes | Done | `scripts/seed-mongo.mjs` |
| Duplicate / severity / vector queries | Done | `src/lib/similarity.ts` |
| View `vw_AdjusterPendingClaims` | Done, tested on PostgreSQL 16 | `sql/02` |
| Atomic payout transaction | Done, tested (success, double-settle, overdraw rollback) | `sql/03`, settle route |
| Claims table with status filters | Done | `/adjuster` |
| Review page: photos, notes, fraud warnings | Done | `/adjuster/claims/[id]` |
| Approve/Reject modal with amount | Done | `SettleModal` |
| `GET /api/adjuster/claims`, `POST /api/adjuster/settle`, `POST /api/claims/similarity` | Done | `src/app/api` |
| Report sections | Done | this file |

Not implemented: authentication/roles for the adjuster portal.
