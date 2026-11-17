export type ClaimStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SETTLED"
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected";

export interface Policy {
  policy_id: number;
  policy_number: string;
  user_id: number;
  policy_type: "Homeowners" | "Commercial Property" | "Auto Physical Damage" | string;
  total_coverage: string;
  remaining_coverage: string;
  deductible: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  policyholder_name?: string;
  policyholder_email?: string;
}

export interface Claim {
  claim_id: number;
  claim_number: string;
  policy_id: number;
  filing_date: string;
  incident_date: string;
  claimed_amount: string;
  approved_amount: string;
  status: ClaimStatus;
  assigned_adjuster_id: number | null;
  policy_number: string;
  policy_type: string;
  total_coverage: string;
  remaining_coverage: string;
  deductible: string;
  policyholder_name?: string;
  policyholder_email?: string;
  adjuster_name?: string;
}

export interface ClaimStatusHistory {
  history_id: number;
  claim_id: number;
  previous_status: string | null;
  new_status: string;
  changed_by: number | null;
  changed_at: string;
}

export interface AdjusterClaim {
  claim_id: number;
  claim_number?: string;
  claim_type?: string;
  status: ClaimStatus;
  amount_claimed?: string;
  claimed_amount?: string;
  incident_date: string;
  filed_at?: string;
  filing_date?: string;
  settled_amount?: string | null;
  approved_amount?: string | null;
  adjuster_note?: string | null;
  policyholder_id?: number;
  claimant_name?: string;
  full_name?: string;
  claimant_email?: string;
  email?: string;
  phone?: string | null;
  policy_id: number;
  policy_number: string;
  coverage_limit?: string;
  total_coverage?: string;
  remaining_coverage: string;
  deductible?: string;
  total_claims_filed?: string;
  total_paid_on_policy?: string;
}

export interface IncidentReport {
  claimId: number;
  policyId: number;
  incidentType: string;
  description: string;
  adjusterNotes: { author: string; note: string; createdAt: string }[];
  photos: string[];
  location: string;
  incidentDate: string;
  severityScore: number;
}

export interface SimilarMatch {
  claimId: number;
  policyId: number;
  incidentType: string;
  description: string;
  location: string;
  incidentDate: string;
  severityScore: number;
  cosineSimilarity: number;
  sameLocation: boolean;
  dayGap: number;
  severityDiff: number;
  riskScore: number;
}

export interface SimilarityResult {
  claimId: number | null;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  matches: SimilarMatch[];
  severity: { score: number; peerAverage: number | null; peerCount: number; delta: number | null } | null;
}
