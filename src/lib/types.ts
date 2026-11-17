export type ClaimStatus = "Pending" | "Under Review" | "Approved" | "Rejected";

export interface AdjusterClaim {
  claim_id: number;
  claim_type: string;
  status: ClaimStatus;
  amount_claimed: string;
  incident_date: string;
  filed_at: string;
  settled_amount: string | null;
  adjuster_note: string | null;
  policyholder_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  policy_id: number;
  policy_number: string;
  coverage_limit: string;
  remaining_coverage: string;
  total_claims_filed: string;
  total_paid_on_policy: string;
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
