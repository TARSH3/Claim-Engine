import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_report():
    doc = Document()

    # Page Margins (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    normal_style.paragraph_format.line_spacing = 1.3
    normal_style.paragraph_format.space_after = Pt(6)

    # Helper functions
    def add_title(text, level=1):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Times New Roman'
        if level == 1:
            run.font.size = Pt(16)
            run.font.color.rgb = RGBColor(0x0f, 0x29, 0x4a) # PES Navy
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(8)
        elif level == 2:
            run.font.size = Pt(14)
            run.font.color.rgb = RGBColor(0x1e, 0x3a, 0x8a)
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(6)
        elif level == 3:
            run.font.size = Pt(12.5)
            run.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
        return p

    def add_code_block(code_text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        set_cell_background(cell, "F3F4F6")
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
        p = cell.paragraphs[0]
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(code_text.strip())
        run.font.name = 'Consolas'
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(0x1f, 0x29, 0x37)
        doc.add_paragraph() # space after

    def format_table(table, col_widths, headers, rows_data):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        hdr_row = table.rows[0]
        for i, h_text in enumerate(headers):
            cell = hdr_row.cells[i]
            cell.text = h_text
            set_cell_background(cell, "0F294A")
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.runs[0].font.bold = True
            p.runs[0].font.name = 'Times New Roman'
            p.runs[0].font.size = Pt(10.5)
            p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        for row_idx, r_data in enumerate(rows_data):
            row = table.add_row()
            bg_hex = "F9FAFB" if row_idx % 2 == 1 else "FFFFFF"
            for col_idx, val in enumerate(r_data):
                cell = row.cells[col_idx]
                cell.text = str(val)
                set_cell_background(cell, bg_hex)
                set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
                p = cell.paragraphs[0]
                p.runs[0].font.name = 'Times New Roman'
                p.runs[0].font.size = Pt(10)
                if col_idx == 0:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Inches(w)
        doc.add_paragraph()

    # ==========================================
    # 1. COVER PAGE
    # ==========================================
    cp = doc.add_paragraph()
    cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = cp.add_run("PES UNIVERSITY\n")
    r.bold = True
    r.font.size = Pt(20)
    r.font.color.rgb = RGBColor(0x0f, 0x29, 0x4a)

    r_sub = cp.add_run("Electronic City Campus, Bengaluru – 560 100\n\n")
    r_sub.font.size = Pt(11)

    r_title_hdr = cp.add_run("Mini Project Report on\n\n")
    r_title_hdr.font.size = Pt(13)
    r_title_hdr.font.italic = True

    r_title = cp.add_run("ENTERPRISE POLYGLOT INSURANCE CLAIM ENGINE\n& ADJUDICATION PLATFORM\n\n")
    r_title.bold = True
    r_title.font.size = Pt(17)
    r_title.font.color.rgb = RGBColor(0x1e, 0x3a, 0x8a)

    r_degree = cp.add_run("Submitted in partial fulfilment of the requirements for the award of degree of\n")
    r_degree.font.size = Pt(11.5)
    r_degree2 = cp.add_run("Bachelor of Technology in Computer Science & Engineering\n\n")
    r_degree2.bold = True
    r_degree2.font.size = Pt(13)

    r_course = cp.add_run("UE23CS351A – DBMS Project\n\n")
    r_course.bold = True
    r_course.font.size = Pt(13)
    r_course.font.color.rgb = RGBColor(0xb9, 0x1c, 0x1c)

    # Student Details Box
    cp_sub = doc.add_paragraph()
    cp_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_by = cp_sub.add_run("Submitted by:\n")
    r_by.bold = True
    r_by.font.size = Pt(12)

    stud_table = doc.add_table(rows=1, cols=2)
    format_table(stud_table, [3.2, 3.2], ["Student Name", "SRN"], [
        ["Tarsh Choudhary (Member 1 Lead)", "PES2UG24CS556"],
        ["Sneha (Member 2 Lead)", "PES2UG24CS608"]
    ])

    cp_guide = doc.add_paragraph()
    cp_guide.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_g1 = cp_guide.add_run("\nUnder the guidance of\n")
    r_g1.font.size = Pt(11.5)
    r_g2 = cp_guide.add_run("Dr. Shilpa S\n")
    r_g2.bold = True
    r_g2.font.size = Pt(13)
    r_g3 = cp_guide.add_run("Assistant Professor\nDepartment of Computer Science and Engineering\nPES University\n\nAUG - DEC 2026\n\n")
    r_g3.font.size = Pt(11)

    cp_foot = doc.add_paragraph()
    cp_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_foot = cp_foot.add_run("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\nFACULTY OF ENGINEERING\nPES UNIVERSITY\n(Established under Karnataka Act No. 16 of 2013)\nElectronic City, Hosur Road, Bengaluru – 560 100, Karnataka, India")
    r_foot.font.size = Pt(10)
    r_foot.font.color.rgb = RGBColor(0x4b, 0x55, 0x63)

    doc.add_page_break()

    # ==========================================
    # 2. CERTIFICATE
    # ==========================================
    add_title("PES UNIVERSITY", 1).alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert_sub = doc.add_paragraph("(Established under Karnataka Act No. 16 of 2013)\nElectronic City, Hosur Road, Bengaluru – 560 100, Karnataka, India\n")
    p_cert_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert_sub.runs[0].font.size = Pt(10)

    add_title("CERTIFICATE", 1).alignment = WD_ALIGN_PARAGRAPH.CENTER

    p_cert = doc.add_paragraph()
    p_cert.add_run("This is to certify that the mini project entitled ")
    r_t = p_cert.add_run("“Enterprise Polyglot Insurance Claim Engine & Adjudication Platform”")
    r_t.bold = True
    p_cert.add_run(" is a bonafide work carried out by:\n\n")

    t_cert = doc.add_table(rows=1, cols=2)
    format_table(t_cert, [3.2, 3.2], ["Student Name", "SRN"], [
        ["Tarsh Choudhary", "PES2UG24CS556"],
        ["Sneha", "PES2UG24CS608"]
    ])

    p_cert_body = doc.add_paragraph(
        "in partial fulfilment for the completion of fifth semester DBMS Project (UE23CS351A) in the "
        "Program of Study - Bachelor of Technology in Computer Science and Engineering under rules and regulations "
        "of PES University, Bengaluru during the period AUG. 2026 – DEC. 2026. It is certified that all corrections / "
        "suggestions indicated for internal assessment have been incorporated in the report. The project has been approved "
        "as it satisfies the 5th semester academic requirements in respect of project work.\n\n\n\n"
    )
    p_cert_body.paragraph_format.line_spacing = 1.3

    p_sig = doc.add_paragraph("_____________________________\nDr. Shilpa S\nAssistant Professor\nDepartment of Computer Science and Engineering\nPES University")
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    doc.add_page_break()

    # ==========================================
    # 3. DECLARATION
    # ==========================================
    add_title("DECLARATION", 1).alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_decl = doc.add_paragraph(
        "We hereby declare that the DBMS Project entitled “Enterprise Polyglot Insurance Claim Engine & Adjudication Platform” "
        "has been carried out by us under the guidance of Dr. Shilpa S, Assistant Professor, Department of Computer Science and Engineering, "
        "and submitted in partial fulfilment of the course requirements for the award of degree of Bachelor of Technology in "
        "Computer Science and Engineering of PES University, Bengaluru during the academic semester AUG – DEC 2026.\n\n"
    )
    p_decl.paragraph_format.line_spacing = 1.3

    t_decl = doc.add_table(rows=1, cols=3)
    format_table(t_decl, [2.5, 2.0, 2.0], ["Student Name", "SRN", "Signature"], [
        ["Tarsh Choudhary", "PES2UG24CS556", "_________________"],
        ["Sneha", "PES2UG24CS608", "_________________"]
    ])

    doc.add_page_break()

    # ==========================================
    # 4. ACKNOWLEDGEMENT
    # ==========================================
    add_title("ACKNOWLEDGEMENT", 1).alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ack = doc.add_paragraph(
        "I would like to express my gratitude to Dr. Shilpa S, Department of Computer Science and Engineering, PES University, "
        "for her continuous guidance, assistance, and encouragement throughout the development of this UE23CS351A - DBMS Project.\n\n"
        "I take this opportunity to thank Dr. Sandesh B J, Professor and Chairperson, Department of Computer Science and Engineering, "
        "PES University, for all the knowledge and academic support received from the department.\n\n"
        "I am deeply grateful to Prof. Jawahar Doreswamy, Chancellor – PES University, and Dr. Suryaprasad J, Vice-Chancellor, "
        "PES University for providing various opportunities and enlightenment every step of the way.\n\n"
        "Finally, this DBMS Project could not have been completed without the continual support, encouragement, and patience received "
        "from our family, peers, and friends."
    )
    p_ack.paragraph_format.line_spacing = 1.3

    doc.add_page_break()

    # ==========================================
    # 5. ABSTRACT
    # ==========================================
    add_title("ABSTRACT", 1).alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_abs = doc.add_paragraph(
        "In modern insurance domains, managing the lifecycle of an insurance claim demands strict transaction atomicity, legal auditability, "
        "and mathematical limit validation, balanced against the need to process rich, semi-structured incident evidence. Traditional relational databases "
        "alone struggle with flexible, unstructured multimodal data such as dynamic loss narratives and photo links, while pure document stores lack strict "
        "ACID transaction guarantees, row-level locks, and complex relational constraints required for financial disbursements.\n\n"
        "This project implements a Polyglot Database Architecture bridging PostgreSQL 17 and MongoDB 8. The relational core (PostgreSQL) is modeled in "
        "Third Normal Form (3NF) across five entities: Users, Policies, Claims, Claim_Status_History, and Claim_Payouts. Defensive business rules are "
        "enforced directly within the database engine:\n"
        "1. Intake Validation Procedure (sp_FileClaim): Enforces policy existence, active status, chronological date consistency, and programmatically rejects claims exceeding remaining coverage limits.\n"
        "2. Status Audit Trigger (trg_audit_claim_status): Automatically intercepts every claim status transition and writes an immutable audit record.\n"
        "3. Multi-Table Atomic Settlement Procedure (sp_SettleClaim): Acquires row-level locks (FOR UPDATE), deducts coverage, records disbursement ledgers, and resolves claim status in a single transaction.\n"
        "4. Polyglot Evidence Store (MongoDB): Persists First Notice of Loss (FNOL) narratives and photo evidence arrays, powering 256-dimensional vector cosine similarity pipelines for duplicate detection.\n\n"
        "The system is deployed with a Next.js 15 (App Router) full-stack web application featuring a Policyholder Portal (/claimant) and an Adjuster Workbench (/adjuster)."
    )
    p_abs.paragraph_format.line_spacing = 1.3

    doc.add_page_break()

    # ==========================================
    # 6. TABLE OF CONTENTS
    # ==========================================
    add_title("TABLE OF CONTENTS", 1).alignment = WD_ALIGN_PARAGRAPH.CENTER
    t_toc = doc.add_table(rows=1, cols=3)
    format_table(t_toc, [1.2, 4.4, 0.8], ["Chapter No.", "Title", "Page"], [
        ["", "CERTIFICATE", "ii"],
        ["", "DECLARATION", "iii"],
        ["", "ACKNOWLEDGEMENT", "iv"],
        ["", "ABSTRACT", "v"],
        ["1", "INTRODUCTION", "1"],
        ["2", "PROBLEM DEFINITION", "3"],
        ["3", "ER MODEL", "5"],
        ["4", "ER TO RELATIONAL MAPPING", "7"],
        ["", "4.1 Steps of Algorithm for Chosen Problem", "7"],
        ["", "4.2 Complete Diagram of Relational Mapping", "9"],
        ["5", "DDL STATEMENTS", "10"],
        ["6", "DML STATEMENTS", "15"],
        ["7", "QUERIES", "18"],
        ["", "7.1 Simple Query with GROUP BY and Aggregate Functions", "18"],
        ["", "7.2 UPDATE Operation", "19"],
        ["", "7.3 DELETE Operation", "20"],
        ["", "7.4 Correlated Query", "21"],
        ["", "7.5 Nested Query", "22"],
        ["8", "STORED PROCEDURES, FUNCTIONS AND TRIGGERS", "24"],
        ["", "8.1 Stored Procedures or Functions (sp_FileClaim, sp_SettleClaim)", "24"],
        ["", "8.2 Triggers (trg_audit_claim_status)", "28"],
        ["9", "FRONT END DEVELOPMENT", "30"],
        ["", "REFERENCES / BIBLIOGRAPHY", "36"],
        ["", "APPENDIX A: DEFINITIONS, ACRONYMS AND ABBREVIATIONS", "37"]
    ])

    doc.add_page_break()

    # ==========================================
    # CHAPTER 1: INTRODUCTION
    # ==========================================
    add_title("1. INTRODUCTION", 1)
    doc.add_paragraph(
        "Insurance claim processing forms the economic foundation of property, casualty, and commercial indemnity sectors. "
        "When an insured policyholder experiences structural loss, theft, or vehicle collision, they initiate a First Notice of Loss (FNOL). "
        "The insurer must evaluate the contractual validity of the policy, verify that the claimed amount does not exceed the remaining indemnity limit, "
        "assign an adjuster, inspect physical evidence, and execute an audited financial payout."
    )
    doc.add_paragraph(
        "Historically, legacy insurance systems suffered from critical architectural vulnerabilities:\n"
        "• Application-Layer Validation Leaks: Validating limits solely in client forms allows race conditions under concurrent submissions, leading to coverage overdrafts.\n"
        "• Loss of Audit Traceability: Status transitions between intake and payout often lack automated database-enforced logging.\n"
        "• Impedance Mismatch in Evidence Storage: Forcing semi-structured narratives and varying photo lists into relational tables creates sparse schemas, while pure NoSQL databases sacrifice ACID transaction guarantees."
    )
    doc.add_paragraph(
        "To resolve these challenges, this project introduces a Polyglot Architecture pairing PostgreSQL 17 (relational core) with MongoDB 8 (unstructured vector store), "
        "governed by Next.js 15 route handlers."
    )

    doc.add_page_break()

    # ==========================================
    # CHAPTER 2: PROBLEM DEFINITION
    # ==========================================
    add_title("2. PROBLEM DEFINITION", 1)
    doc.add_paragraph(
        "The objective of this project is to design, implement, and benchmark a complete insurance claim engine satisfying Level-3 DBMS design criteria:\n\n"
        "1. Relational Data Integrity: Design a normalized 3NF schema eliminating insertion, deletion, and update anomalies across Users, Policies, Claims, History, and Payouts.\n"
        "2. Defensive Invariant Enforcement: Implement stored procedure sp_FileClaim to programmatically reject claims exceeding remaining coverage, inactive policies, or future dates.\n"
        "3. Autonomous Event-Driven Auditing: Implement trigger trg_audit_claim_status to log every status transition into Claim_Status_History.\n"
        "4. Multi-Table Atomic Settlement: Implement atomic procedure sp_SettleClaim with row locks (FOR UPDATE), coverage deduction, and payout ledgering.\n"
        "5. Polyglot Document Integration: Store multimodal FNOL narratives and photo URLs in MongoDB with 256-d vector cosine similarity.\n"
        "6. Dual Web Interfaces: Provide responsive portals for Policyholders (/claimant) and Adjusters (/adjuster)."
    )

    doc.add_page_break()

    # ==========================================
    # CHAPTER 3: ER MODEL
    # ==========================================
    add_title("3. ER MODEL", 1)
    doc.add_paragraph(
        "The conceptual domain consists of five core entities:\n"
        "• Users: System actors with Role-Based Access Control ('Policyholder', 'Adjuster', 'Admin').\n"
        "• Policies: Underwriting contracts owned by policyholders with total/remaining coverage limits and deductibles.\n"
        "• Claims: Loss compensation requests referencing an active policy.\n"
        "• Claim_Status_History: Immutable audit records capturing each status transition.\n"
        "• Claim_Payouts: Financial settlement ledger documenting disbursed amounts."
    )
    add_title("Cardinality & Participation Constraints", 2)
    doc.add_paragraph(
        "• Users to Policies (1:N): One policyholder holds multiple policies; each policy belongs to exactly one user.\n"
        "• Policies to Claims (1:N): One policy covers multiple claims; each claim references one policy.\n"
        "• Claims to Claim_Status_History (1:N): One claim generates multiple audit entries as its status changes.\n"
        "• Claims to Claim_Payouts (1:1): A claim can produce at most one financial settlement record."
    )

    doc.add_page_break()

    # ==========================================
    # CHAPTER 4: ER TO RELATIONAL MAPPING
    # ==========================================
    add_title("4. ER TO RELATIONAL MAPPING", 1)
    add_title("4.1 Steps of Algorithm for Chosen Problem", 2)
    doc.add_paragraph(
        "The formal mapping algorithm transforms conceptual ER entities into 3NF relations:\n\n"
        "Step 1: Strong Entity Mapping\n"
        "• Users(user_id [PK], full_name, email [UK], phone, role, created_at)\n"
        "• Policies(policy_id [PK], policy_number [UK], total_coverage, remaining_coverage, deductible, start_date, end_date, is_active)\n"
        "• Claims(claim_id [PK], claim_number [UK], filing_date, incident_date, claimed_amount, approved_amount, status)\n\n"
        "Step 2: 1:N Relationship Mapping\n"
        "• Users -> Policies: Import user_id as FK into Policies (ON DELETE RESTRICT).\n"
        "• Policies -> Claims: Import policy_id as FK into Claims (ON DELETE RESTRICT).\n"
        "• Users -> Claims: Import user_id as nullable FK assigned_adjuster_id into Claims (ON DELETE SET NULL).\n\n"
        "Step 3: Weak/Historical Entity Mapping\n"
        "• Claim_Status_History(history_id [PK], claim_id [FK], previous_status, new_status, changed_by [FK], changed_at)\n\n"
        "Step 4: 1:1 Relationship Mapping\n"
        "• Claim_Payouts(payout_id [PK], claim_id [FK_UK], net_payout, disbursement_status, payout_date)"
    )

    add_title("4.2 Complete Diagram of Relational Mapping", 2)
    doc.add_paragraph(
        "USERS (user_id [PK], full_name, email [UK], phone, role, created_at)\n"
        "   ↑\n"
        "POLICIES (policy_id [PK], policy_number [UK], user_id [FK], policy_type, total_coverage, remaining_coverage, deductible, start_date, end_date, is_active)\n"
        "   ↑\n"
        "CLAIMS (claim_id [PK], claim_number [UK], policy_id [FK], filing_date, incident_date, claimed_amount, approved_amount, status, assigned_adjuster_id [FK])\n"
        "   ├── CLAIM_STATUS_HISTORY (history_id [PK], claim_id [FK], previous_status, new_status, changed_by [FK], changed_at)\n"
        "   └── CLAIM_PAYOUTS (payout_id [PK], claim_id [FK_UK], net_payout, disbursement_status, payout_date)"
    )

    doc.add_page_break()

    # ==========================================
    # CHAPTER 5: DDL STATEMENTS
    # ==========================================
    add_title("5. DDL STATEMENTS", 1)
    doc.add_paragraph("The relational schema is created in PostgreSQL with full check constraints and foreign keys:")
    add_code_block("""
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('Policyholder', 'Adjuster', 'Admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE Claim_Status_History (
    history_id SERIAL PRIMARY KEY,
    claim_id INT NOT NULL REFERENCES Claims(claim_id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by INT REFERENCES Users(user_id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Claim_Payouts (
    payout_id SERIAL PRIMARY KEY,
    claim_id INT UNIQUE NOT NULL REFERENCES Claims(claim_id) ON DELETE RESTRICT,
    net_payout NUMERIC(12, 2) NOT NULL CHECK (net_payout >= 0),
    disbursement_status VARCHAR(20) DEFAULT 'DISBURSED' CHECK (disbursement_status IN ('PENDING', 'DISBURSED', 'FAILED')),
    payout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_claims_policy_status ON Claims(policy_id, status);
CREATE INDEX idx_claims_adjuster ON Claims(assigned_adjuster_id);
    """)

    doc.add_page_break()

    # ==========================================
    # CHAPTER 6: DML STATEMENTS
    # ==========================================
    add_title("6. DML STATEMENTS", 1)
    doc.add_paragraph("Mock policyholders, adjusters, and active policies inserted into PostgreSQL:")
    add_code_block("""
INSERT INTO Users (full_name, email, phone, role) VALUES
('Ramesh Kumar', 'ramesh.k@example.com', '9876543210', 'Policyholder'),
('Priya Sharma', 'priya.s@example.com', '9876543211', 'Policyholder'),
('Ananya Deshmukh', 'ananya.d@insurance.com', '9876543212', 'Adjuster'),
('Siddharth Nair', 'siddharth.n@insurance.com', '9876543213', 'Adjuster');

INSERT INTO Policies (policy_number, user_id, policy_type, total_coverage, remaining_coverage, deductible, start_date, end_date) VALUES
('POL-PROP-2026-001', 1, 'Homeowners', 5000000.00, 5000000.00, 25000.00, '2026-01-01', '2027-01-01'),
('POL-AUTO-2026-002', 2, 'Auto Physical Damage', 1200000.00, 1200000.00, 10000.00, '2026-03-15', '2027-03-15'),
('POL-COMM-2026-003', 1, 'Commercial Property', 8000000.00, 8000000.00, 50000.00, '2026-02-01', '2027-02-01');

INSERT INTO Claims (claim_number, policy_id, incident_date, claimed_amount, status) VALUES
('CLM-20261101-0001', 1, '2026-10-25', 150000.00, 'SUBMITTED'),
('CLM-20261105-0002', 1, '2026-11-02', 45000.00, 'UNDER_REVIEW'),
('CLM-20261110-0003', 2, '2026-11-08', 85000.00, 'SUBMITTED');
    """)

    doc.add_page_break()

    # ==========================================
    # CHAPTER 7: QUERIES
    # ==========================================
    add_title("7. QUERIES", 1)

    add_title("7.1 Simple Query with GROUP BY and Aggregate Functions", 2)
    add_code_block("""
SELECT p.policy_type,
       COUNT(c.claim_id) AS total_claims_count,
       COALESCE(SUM(c.claimed_amount), 0.00) AS total_claimed_amount,
       COALESCE(ROUND(AVG(c.claimed_amount), 2), 0.00) AS avg_claimed_amount
FROM Policies p
LEFT JOIN Claims c ON p.policy_id = c.policy_id
GROUP BY p.policy_type
ORDER BY total_claimed_amount DESC;
    """)

    add_title("7.2 UPDATE Operation", 2)
    add_code_block("""
UPDATE Policies
SET remaining_coverage = remaining_coverage - 50000.00
WHERE policy_id = 1 AND remaining_coverage >= 50000.00;
    """)

    add_title("7.3 DELETE Operation", 2)
    add_code_block("""
DELETE FROM Claims
WHERE status = 'REJECTED' AND filing_date < CURRENT_TIMESTAMP - INTERVAL '180 days';
    """)

    add_title("7.4 Correlated Query", 2)
    add_code_block("""
SELECT c.claim_id, c.claim_number, p.policy_type, c.claimed_amount
FROM Claims c
JOIN Policies p ON c.policy_id = p.policy_id
WHERE c.claimed_amount > (
    SELECT AVG(c2.claimed_amount)
    FROM Claims c2
    JOIN Policies p2 ON c2.policy_id = p2.policy_id
    WHERE p2.policy_type = p.policy_type
);
    """)

    add_title("7.5 Nested Query", 2)
    add_code_block("""
SELECT u.user_id, u.full_name, u.email, open_claims.active_claim_count
FROM Users u
JOIN (
    SELECT p.user_id, COUNT(c.claim_id) AS active_claim_count
    FROM Policies p
    JOIN Claims c ON p.policy_id = c.policy_id
    WHERE c.status IN ('SUBMITTED', 'UNDER_REVIEW')
    GROUP BY p.user_id
    HAVING COUNT(c.claim_id) > 1
) open_claims ON u.user_id = open_claims.user_id;
    """)

    doc.add_page_break()

    # ==========================================
    # CHAPTER 8: STORED PROCEDURES & TRIGGERS
    # ==========================================
    add_title("8. STORED PROCEDURES, FUNCTIONS AND TRIGGERS", 1)

    add_title("8.1 Stored Procedure: sp_FileClaim (Member 1 Lead)", 2)
    add_code_block("""
CREATE OR REPLACE PROCEDURE sp_FileClaim(
    p_policy_id INT,
    p_incident_date DATE,
    p_claimed_amount NUMERIC,
    INOUT p_claim_id INT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_is_active BOOLEAN;
    v_end_date DATE;
    v_rem_coverage NUMERIC;
    v_claim_num VARCHAR(50);
BEGIN
    SELECT is_active, end_date, remaining_coverage 
    INTO v_is_active, v_end_date, v_rem_coverage
    FROM Policies WHERE policy_id = p_policy_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'Policy ID % does not exist.', p_policy_id; END IF;
    IF v_is_active = FALSE OR CURRENT_DATE > v_end_date THEN
        RAISE EXCEPTION 'Cannot file claim: Policy is inactive or expired.';
    END IF;
    IF p_incident_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Incident date cannot be in the future.';
    END IF;
    IF p_claimed_amount > v_rem_coverage THEN
        RAISE EXCEPTION 'Claimed amount (%) exceeds remaining coverage (%).', p_claimed_amount, v_rem_coverage;
    END IF;

    v_claim_num := 'CLM-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS') || '-' || LPAD(p_policy_id::TEXT, 4, '0');

    INSERT INTO Claims (claim_number, policy_id, incident_date, claimed_amount, status)
    VALUES (v_claim_num, p_policy_id, p_incident_date, p_claimed_amount, 'SUBMITTED')
    RETURNING claim_id INTO p_claim_id;
END;
$$;
    """)

    add_title("8.2 Trigger: trg_audit_claim_status (Member 1 Lead)", 2)
    add_code_block("""
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
FOR EACH ROW EXECUTE FUNCTION fn_audit_claim_status();
    """)

    doc.add_page_break()

    # ==========================================
    # CHAPTER 9: FRONT END DEVELOPMENT
    # ==========================================
    add_title("9. FRONT END DEVELOPMENT", 1)
    doc.add_paragraph(
        "The full-stack application is constructed in Next.js 15 (App Router) using React 19 and Tailwind CSS:\n\n"
        "1. Policyholder Portal (/claimant):\n"
        "   • Displays active policies with total coverage, deductible, and live remaining balance progress bars.\n"
        "   • Lists filed claims with status badges (SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SETTLED).\n"
        "   • Provides a user-switch control to inspect claims for Ramesh Kumar (ID 1) and Priya Sharma (ID 2).\n\n"
        "2. First Notice of Loss Claim Form (/claimant/new):\n"
        "   • Policy selector dropdown with remaining limit feedback.\n"
        "   • Calendar date picker restricted to current and historical dates.\n"
        "   • Dynamic client-side warning preventing submission if amount exceeds policy limit.\n"
        "   • Executes POST /api/claims, calling sp_FileClaim and logging unstructured details to MongoDB.\n\n"
        "3. Adjuster Workbench (/adjuster):\n"
        "   • Table displaying pending claims loaded from view vw_AdjusterPendingClaims.\n"
        "   • Status filter buttons and text search.\n"
        "   • Review modal (/adjuster/claims/[id]) executing atomic settlement procedure sp_SettleClaim."
    )

    doc.add_page_break()

    # ==========================================
    # REFERENCES & APPENDIX
    # ==========================================
    add_title("REFERENCES / BIBLIOGRAPHY", 1)
    doc.add_paragraph(
        "[1] Silberschatz, A., Korth, H. F., & Sudarshan, S. (2020). Database System Concepts (7th ed.). McGraw-Hill.\n"
        "[2] PostgreSQL Global Development Group. (2026). PostgreSQL 17.0 Documentation: Procedural Languages - PL/pgSQL. https://www.postgresql.org/docs/17/plpgsql.html\n"
        "[3] MongoDB Inc. (2026). MongoDB Manual: Aggregation Pipelines and Vector Searches. https://www.mongodb.com/docs/manual/aggregation/\n"
        "[4] Vercel Inc. (2026). Next.js App Router and Server Route Handlers Documentation. https://nextjs.org/docs/app\n\n"
        "GitHub Link:\nhttps://github.com/TARSH3/Claim-Engine"
    )

    add_title("\nAPPENDIX A: DEFINITIONS, ACRONYMS AND ABBREVIATIONS", 1)
    doc.add_paragraph(
        "• ACID: Atomicity, Consistency, Isolation, Durability\n"
        "• BCNF: Boyce-Codd Normal Form\n"
        "• DDL: Data Definition Language\n"
        "• DML: Data Manipulation Language\n"
        "• ER: Entity-Relationship\n"
        "• FNOL: First Notice of Loss\n"
        "• FK: Foreign Key\n"
        "• PK: Primary Key\n"
        "• PL/pgSQL: Procedural Language / PostgreSQL\n"
        "• RDBMS: Relational Database Management System\n"
        "• SRN: Student Registration Number\n"
        "• 3NF: Third Normal Form"
    )

    output_path = "/Users/tarshchoudhary/Documents/DBMS_MINI_PROJECT/claim-engine/docs/DBMS_MINI_PROJECT_REPORT.docx"
    doc.save(output_path)
    print(f"Successfully generated Word document report at: {output_path}")

if __name__ == "__main__":
    create_report()
