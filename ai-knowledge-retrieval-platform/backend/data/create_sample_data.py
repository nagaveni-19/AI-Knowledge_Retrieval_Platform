import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import docx
from fpdf import FPDF
from app.config import settings
from app.services.ingestion import ingestion_service
from app.services.vector_store import vector_store

def create_pdf(filepath: Path, title: str, sections: list):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(5)

    for heading, text in sections:
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, heading, new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5, text)
        pdf.ln(3)

    pdf.output(str(filepath))

def create_samples():
    sample_dir = settings.SAMPLE_DOCS_DIR
    sample_dir.mkdir(parents=True, exist_ok=True)

    # -------------------------------------------------------------
    # DOMAIN 1: HEALTHCARE & TELEMEDICINE
    # -------------------------------------------------------------
    
    # 1.1 TXT: telehealth_clinical_protocol.txt
    hc_txt_path = sample_dir / "telehealth_clinical_protocol.txt"
    with open(hc_txt_path, "w", encoding="utf-8") as f:
        f.write("""TELEHEALTH CLINICAL ESCALATION AND PATIENT INTAKE PROTOCOL

1. Overview and Purpose
This document establishes clinical guidelines for remote telemedicine evaluations and vital sign monitoring. Clinicians must adhere strictly to these criteria to determine when patient condition necessitates immediate emergency escalation.

2. Vital Sign Criteria for Emergency Escalation
Telehealth practitioners must trigger immediate emergency ambulance escalation (Code Red) if any of the following parameters are observed:
- Resting Heart Rate exceeding 135 bpm or sustained below 45 bpm with dizziness.
- Systolic Blood Pressure greater than 180 mmHg or Diastolic Blood Pressure greater than 110 mmHg.
- Pulse Oximetry (SpO2) falling below 91% on room air.
- Acute onset neurological deficits including facial drooping, unilateral arm weakness, or slurred speech.
- Severe dyspnea preventing completion of full sentences during the video consultation.

3. Step-by-Step Remote Patient Triage Procedure
Step 1: Patient Identity and Location Verification: Confirm patient legal name, date of birth, and exact physical street address where the patient is currently located.
Step 2: Chief Complaint and Severity Scoring: Record the primary symptom duration, pain scale (1 to 10), and onset trajectory.
Step 3: Visual Clinical Assessment: Evaluate respiratory rate, work of breathing, skin pallor, and cognitive alertness over video feed.
Step 4: Objective Metric Collection: Request patient to report home biometric readings (blood pressure cuff, pulse oximeter, thermometer).
Step 5: Disposition Decision: Assign triage priority (Level 1: Immediate ER, Level 2: Urgent Care within 4 hours, Level 3: Scheduled Clinic Visit).
Step 6: Prescription and Documentation: Document clinical rationale in EHR and transmit e-prescription to certified pharmacy.
""")

    # 1.2 DOCX: patient_intake_triage_sop.docx
    hc_docx_path = sample_dir / "patient_intake_triage_sop.docx"
    doc1 = docx.Document()
    doc1.add_heading("Standard Operating Procedure: Telehealth Patient Intake", level=1)
    doc1.add_heading("Section: Patient Verification and Consent", level=2)
    doc1.add_paragraph("Prior to initiating telehealth evaluation, all patients must provide written or verified verbal informed consent. The clinician must verify photographic identification and state medical licensing jurisdiction.")
    doc1.add_heading("Section: Pediatric Telemedicine Safeguards", level=2)
    doc1.add_paragraph("For patients aged under 18 years, a parent or designated legal guardian must be present on screen throughout the session. Weight-based dosing for oral antibiotics must be verified against growth charts before electronic signature.")
    doc1.add_heading("Section: Technical Redundancy Protocol", level=2)
    doc1.add_paragraph("In the event of audiovisual connection failure lasting longer than 90 seconds, the clinician must immediately transition to telephonic audio call. If the patient fails to respond within 5 minutes, wellness check escalation is authorized.")
    doc1.save(str(hc_docx_path))

    # 1.3 CSV: medical_triage_matrix.csv
    hc_csv_path = sample_dir / "medical_triage_matrix.csv"
    with open(hc_csv_path, "w", encoding="utf-8") as f:
        f.write("""TriageLevel,Category,MaxWaitMinutes,EscalationPath,RequiredPhysicianSpecialty
Level 1,Immediate Resuscitation,0,Emergency 911 Dispatch,Emergency Medicine
Level 2,Urgent Telehealth,30,On-Call Hospital Triage Attending,Internal Medicine / Pediatrics
Level 3,Semi-Urgent Consultation,120,Tele-Clinic Provider,Family Medicine
Level 4,Routine Follow-Up,1440,Scheduled Primary Care,General Practitioner
Level 5,Administrative / Refill,2880,Clinical Pharmacist Review,Pharmacy Specialist
""")

    # 1.4 PDF: telehealth_regulatory_handbook.pdf
    hc_pdf_path = sample_dir / "telehealth_regulatory_handbook.pdf"
    create_pdf(
        hc_pdf_path,
        "Telehealth Regulatory and HIPAA Security Handbook",
        [
            ("1. HIPAA Compliance & Encryption Standards",
             "All video consultations and telephonic digital transmissions must enforce AES-256 end-to-end encryption. Patient electronic protected health information (ePHI) stored at rest must comply with federal HIPAA audit logging requirements."),
            ("2. Multi-State Medical Licensure Requirements",
             "Clinicians providing telemedicine consultations across state boundaries must hold an active, unrestricted medical license in the jurisdiction where the patient physically resides at the time of consultation.")
        ]
    )

    # -------------------------------------------------------------
    # DOMAIN 2: FINANCIAL COMPLIANCE & BANKING
    # -------------------------------------------------------------

    # 2.1 TXT: kyc_aml_compliance_manual.txt
    fin_txt_path = sample_dir / "kyc_aml_compliance_manual.txt"
    with open(fin_txt_path, "w", encoding="utf-8") as f:
        f.write("""ANTI-MONEY LAUNDERING (AML) AND KNOW YOUR CUSTOMER (KYC) COMPLIANCE POLICY

1. Regulatory Mandate and Currency Transaction Reporting
Under Bank Secrecy Act and FinCEN directives, all covered institutions must file a Currency Transaction Report (CTR) for each cash transaction (deposits, withdrawals, currency exchanges) exceeding $10,000 conducted by or on behalf of a single entity during any rolling 24-hour business window.

2. Enhanced Due Diligence (EDD) Steps for High-Risk Entities
Step 1: Beneficial Ownership Identification: Identify and verify all natural persons owning 25% or greater equity interest in corporate entities.
Step 2: PEP Screening: Screen all principals and beneficial owners against global Politically Exposed Persons (PEP) and OFAC sanctions databases.
Step 3: Source of Wealth and Source of Funds Verification: Collect audited financial statements, tax returns, and corporate bank statements for the preceding 24 months.
Step 4: Adverse Media Verification: Conduct automated open-source and law-enforcement media queries for fraud, bribery, or financial crime links.
Step 5: Ongoing Monitoring Frequency: Assign high-risk classification and schedule automated biometric and transactional re-reviews every 6 months.

3. Suspicious Activity Report (SAR) Filing Thresholds
Financial institutions are required to file a SAR for known or suspected criminal violations or insider abuse involving any dollar amount, and for suspicious transactions totaling $5,000 or more where a suspect can be identified, or $25,000 regardless of whether a potential suspect has been identified.
""")

    # 2.2 CSV: loan_approval_matrix.csv
    fin_csv_path = sample_dir / "loan_approval_matrix.csv"
    with open(fin_csv_path, "w", encoding="utf-8") as f:
        f.write("""Tier,RiskRating,MinCreditScore,MaxDebtToIncomeRatio,MaxLoanToValueRatio,ApprovalAuthority
Tier 1,Low Risk,740,36%,80%,Automated Underwriting Engine
Tier 2,Moderate Risk,680,43%,85%,Senior Underwriter Approval
Tier 3,Elevated Risk,620,48%,90%,Credit Committee Review
Tier 4,High Risk / Subprime,580,50%,95%,Chief Risk Officer Exception Required
Tier 5,Unacceptable Risk,Below 580,Exceeds 50%,Exceeds 95%,Mandatory Automatic Decline
""")

    # 2.3 DOCX: fraud_prevention_guide.docx
    fin_docx_path = sample_dir / "fraud_prevention_guide.docx"
    doc2 = docx.Document()
    doc2.add_heading("Fraud Prevention and Account Takeover Mitigation Guide", level=1)
    doc2.add_heading("Section: Wire Transfer Authentication Safeguards", level=2)
    doc2.add_paragraph("All outbound domestic wire transfers exceeding $250,000 and international wire transfers exceeding $50,000 require out-of-band biometric or dual-custody verbal authorization. Callback numbers must match pre-registered corporate profiles.")
    doc2.add_heading("Section: Identity Verification Matrix", level=2)
    doc2.add_paragraph("New account onboarding mandates multi-factor identity verification including government-issued photo ID barcode validation, facial liveness detection matching, and synthetic identity risk scoring.")
    doc2.save(str(fin_docx_path))

    # 2.4 PDF: aml_sanctions_protocol.pdf
    fin_pdf_path = sample_dir / "aml_sanctions_protocol.pdf"
    create_pdf(
        fin_pdf_path,
        "OFAC and International Sanctions Compliance Protocol",
        [
            ("1. Real-Time Sanctions Screening Procedures",
             "Every cross-border wire instruction and swift message must pass through automated real-time OFAC SDN fuzzy matching engines before settlement. Matches with confidence over 85% mandate immediate transaction block."),
            ("2. Asset Freeze Execution Mandate",
             "Upon confirmation of an SDN list match, compliance officers must freeze the target assets within 10 business days and submit formal blocked property reports to FinCEN and the Office of Foreign Assets Control.")
        ]
    )

    # -------------------------------------------------------------
    # DOMAIN 3: CLOUD INFRASTRUCTURE & DEVOPS RELIABILITY
    # -------------------------------------------------------------

    # 3.1 DOCX: sre_incident_management.docx
    ops_docx_path = sample_dir / "sre_incident_management.docx"
    doc3 = docx.Document()
    doc3.add_heading("Site Reliability Engineering: Incident Response Framework", level=1)
    doc3.add_heading("Section: Incident Severity Definitions", level=2)
    doc3.add_paragraph("Severity 1 (Critical): Total loss of core customer-facing service availability or data corruption. SLA Response acknowledgment time is 5 minutes. Incident Commander required immediately.\nSeverity 2 (Major): Partial service impairment with redundancy fallback. SLA Response acknowledgment time is 15 minutes.\nSeverity 3 (Minor): Non-critical degradation with zero direct end-user impact. Acknowledgment within 60 minutes.")
    doc3.add_heading("Section: Kubernetes Pod Crash Recovery Sequence", level=2)
    doc3.add_paragraph("Step 1: Check pod status and events using kubectl describe pod.\nStep 2: Inspect container termination logs with kubectl logs --previous to capture stack traces before restart.\nStep 3: Cordon and drain the degraded worker node if memory pressure or kernel panics are detected.\nStep 4: Scale replica deployment or trigger rolling rollback if image regression caused CrashLoopBackOff.\nStep 5: Validate health checks (liveness and readiness probes) across the deployment.")
    doc3.save(str(ops_docx_path))

    # 3.2 CSV: sla_slo_thresholds.csv
    ops_csv_path = sample_dir / "sla_slo_thresholds.csv"
    with open(ops_csv_path, "w", encoding="utf-8") as f:
        f.write("""ServiceTier,TargetSLOAvailability,MaxAllowedDowntimeMonthly,TargetP99LatencyMs,MTTRTargetMinutes
Tier-1 Core API,99.99%,4.38 minutes,120ms,15 minutes
Tier-2 Background Jobs,99.9%,43.8 minutes,500ms,45 minutes
Tier-3 Reporting & Analytics,99.5%,219.1 minutes,2500ms,120 minutes
Tier-4 Internal Tooling,99.0%,438.0 minutes,5000ms,240 minutes
""")

    # 3.3 TXT: disaster_recovery_runbook.txt
    ops_txt_path = sample_dir / "disaster_recovery_runbook.txt"
    with open(ops_txt_path, "w", encoding="utf-8") as f:
        f.write("""CLOUD DISASTER RECOVERY RUNBOOK AND FAILOVER PROTOCOL

1. Multi-Region Failover Activation Criteria
Automated or manual multi-region database and ingress failover must be initiated if the primary cloud region experiences complete control plane outage or database replication lag exceeding 180 seconds for more than 5 consecutive minutes.

2. Step-by-Step Data Tier Failover Sequence
Step 1: Declare Severity 1 Emergency Disaster Recovery event in the central war room.
Step 2: Terminate active write traffic to the primary region database cluster to prevent split-brain synchronization errors.
Step 3: Promote the secondary regional read replica to primary standalone write master.
Step 4: Update global Route53 DNS traffic routing policies and CDN origin endpoints to point exclusively to the secondary region.
Step 5: Spin up autoscaling application worker fleets in the standby availability zones.
Step 6: Execute synthetic smoke tests covering user authentication, payment processing, and core API endpoints.
Step 7: Issue public status page notification of successful disaster recovery execution.
""")

    # 3.4 PDF: kubernetes_deployment_sop.pdf
    ops_pdf_path = sample_dir / "kubernetes_deployment_sop.pdf"
    create_pdf(
        ops_pdf_path,
        "Kubernetes Production Deployment Standard Operating Procedure",
        [
            ("1. Canary Deployment Verification Strategy",
             "All production releases must follow a canary progressive delivery strategy using Argo Rollouts. Initial canary traffic weight must be set to 5% for 15 minutes while monitoring P99 latency and HTTP 5xx error rates."),
            ("2. Resource Limits & Horizontal Pod Autoscaling",
             "Every production pod must declare CPU and Memory requests and limits. Horizontal Pod Autoscaler (HPA) must target 70% average CPU utilization with minimum 3 replicas and maximum 25 replicas across multi-AZ clusters.")
        ]
    )

    print("Created sample document files successfully across 3 domains (PDF, DOCX, TXT, CSV).")

    # Ingest all sample documents into the Vector Store
    sample_files = [
        (hc_txt_path, "Healthcare"),
        (hc_docx_path, "Healthcare"),
        (hc_csv_path, "Healthcare"),
        (hc_pdf_path, "Healthcare"),
        (fin_txt_path, "Finance"),
        (fin_docx_path, "Finance"),
        (fin_csv_path, "Finance"),
        (fin_pdf_path, "Finance"),
        (ops_docx_path, "CloudDevOps"),
        (ops_csv_path, "CloudDevOps"),
        (ops_txt_path, "CloudDevOps"),
        (ops_pdf_path, "CloudDevOps"),
    ]

    for file_path, domain in sample_files:
        with open(file_path, "rb") as f:
            b = f.read()
        metadata, chunks = ingestion_service.process_file(
            filename=file_path.name,
            file_bytes=b,
            domain=domain
        )
        vector_store.add_document(metadata, chunks)
        print(f"Ingested {file_path.name} ({len(chunks)} chunks, domain: {domain}, type: {metadata.file_type})")

if __name__ == "__main__":
    create_samples()
