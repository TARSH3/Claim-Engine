-- Atomic settlement. One call = claim update + ledger row + coverage deduction.
-- Row locks (FOR UPDATE) stop two adjusters settling the same claim / overdrawing a policy.
CREATE OR REPLACE FUNCTION sp_settle_claim(
  p_claim_id INT,
  p_decision TEXT,          -- 'Approved' | 'Rejected' | 'Under Review'
  p_amount   NUMERIC,
  p_note     TEXT
) RETURNS TABLE (r_claim_id INT, r_status TEXT, r_settled NUMERIC,
                 r_remaining NUMERIC, r_transaction_id INT)
LANGUAGE plpgsql AS $$
DECLARE
  v_claim  claims%ROWTYPE;
  v_policy policies%ROWTYPE;
  v_txn    INT;
BEGIN
  IF p_decision NOT IN ('Approved','Rejected','Under Review') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;

  SELECT * INTO v_claim FROM claims WHERE claim_id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Claim % not found', p_claim_id; END IF;
  IF v_claim.status IN ('Approved','Rejected') THEN
    RAISE EXCEPTION 'Claim % is already %', p_claim_id, v_claim.status;
  END IF;

  SELECT * INTO v_policy FROM policies WHERE policy_id = v_claim.policy_id FOR UPDATE;

  IF p_decision = 'Approved' THEN
    IF p_amount IS NULL OR p_amount <= 0 THEN
      RAISE EXCEPTION 'Settlement amount must be greater than zero';
    END IF;
    IF p_amount > v_claim.amount_claimed THEN
      RAISE EXCEPTION 'Settlement (%) exceeds amount claimed (%)', p_amount, v_claim.amount_claimed;
    END IF;
    IF p_amount > v_policy.remaining_coverage THEN
      RAISE EXCEPTION 'Settlement (%) exceeds remaining coverage (%)', p_amount, v_policy.remaining_coverage;
    END IF;

    UPDATE policies SET remaining_coverage = remaining_coverage - p_amount
      WHERE policy_id = v_policy.policy_id
      RETURNING * INTO v_policy;

    UPDATE claims SET status = 'Approved', settled_amount = p_amount,
           adjuster_note = p_note, resolved_at = now()
      WHERE claim_id = p_claim_id;

    INSERT INTO claim_transactions(claim_id, policy_id, txn_type, amount, balance_after)
      VALUES (p_claim_id, v_policy.policy_id, 'PAYOUT', p_amount, v_policy.remaining_coverage)
      RETURNING transaction_id INTO v_txn;

  ELSIF p_decision = 'Rejected' THEN
    UPDATE claims SET status = 'Rejected', settled_amount = 0,
           adjuster_note = p_note, resolved_at = now()
      WHERE claim_id = p_claim_id;

    INSERT INTO claim_transactions(claim_id, policy_id, txn_type, amount, balance_after)
      VALUES (p_claim_id, v_policy.policy_id, 'REJECTION', 0, v_policy.remaining_coverage)
      RETURNING transaction_id INTO v_txn;

  ELSE -- Under Review
    UPDATE claims SET status = 'Under Review', adjuster_note = COALESCE(p_note, adjuster_note)
      WHERE claim_id = p_claim_id;
  END IF;

  RETURN QUERY
    SELECT c.claim_id, c.status, COALESCE(c.settled_amount, 0), v_policy.remaining_coverage, v_txn
    FROM claims c WHERE c.claim_id = p_claim_id;
END;
$$;
