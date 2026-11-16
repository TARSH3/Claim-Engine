-- Demo data (safe to skip if Member 1 provides his own).
INSERT INTO policyholders(full_name,email,phone) VALUES
 ('Aarav Mehta','aarav@example.com','9000000001'),
 ('Diya Nair','diya@example.com','9000000002'),
 ('Rohan Iyer','rohan@example.com','9000000003')
ON CONFLICT DO NOTHING;

INSERT INTO policies(policyholder_id,policy_number,coverage_limit,remaining_coverage) VALUES
 (1,'POL-1001',50000,50000),(2,'POL-1002',30000,30000),(3,'POL-1003',20000,20000)
ON CONFLICT DO NOTHING;

INSERT INTO claims(policy_id,claim_type,amount_claimed,status,incident_date) VALUES
 (1,'Auto Collision',12000,'Pending','2026-10-02'),
 (1,'Auto Collision',11800,'Pending','2026-10-04'),
 (2,'Water Damage',8500,'Under Review','2026-09-20'),
 (3,'Theft',4000,'Pending','2026-11-01'),
 (2,'Fire',25000,'Pending','2026-11-05');
