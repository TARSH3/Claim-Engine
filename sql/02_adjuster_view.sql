-- Adjuster work queue: claim + policyholder + policy + aggregates.
-- Contains every status so the portal can filter; the "pending" queue = status IN (Pending, Under Review).
CREATE OR REPLACE VIEW vw_AdjusterPendingClaims AS
SELECT
  c.claim_id,
  c.claim_type,
  c.status,
  c.amount_claimed,
  c.incident_date,
  c.filed_at,
  c.settled_amount,
  c.adjuster_note,
  ph.policyholder_id,
  ph.full_name,
  ph.email,
  ph.phone,
  p.policy_id,
  p.policy_number,
  p.coverage_limit,
  p.remaining_coverage,
  COUNT(*) OVER (PARTITION BY ph.policyholder_id)                     AS total_claims_filed,
  COALESCE(SUM(c.settled_amount) FILTER (WHERE c.status = 'Approved')
           OVER (PARTITION BY p.policy_id), 0)                         AS total_paid_on_policy
FROM claims c
JOIN policies       p  ON p.policy_id = c.policy_id
JOIN policyholders  ph ON ph.policyholder_id = p.policyholder_id;
