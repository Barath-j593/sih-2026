"""Deterministic rule-based fallback recommendation templates for SETU Decision Support.

Ensures the pipeline and user experience never break if Gemini API is unreachable,
times out, rate limits, or is disabled via DECISION_SUPPORT_ENABLED=false.

MoSPI SETU MPLADS Platform.
"""

from typing import Any, Dict, List

FALLBACK_DOMAIN_TEMPLATES: Dict[str, Dict[str, Dict[str, List[str]]]] = {
    "financial": {
        "CRITICAL": {
            "mp": [
                "Request immediate technical estimate sheets and comparative SOR rate analysis from the District Authority.",
                "Conduct an in-person public inspection with constituency stakeholders to verify physical work matching reported disbursements.",
            ],
            "district": [
                "Issue an immediate freeze on further financial disbursements pending joint re-measurement by the Executive Engineer.",
                "Direct the implementing agency to submit market quotation sheets and tender sanction approvals within 7 days.",
            ],
            "state": [
                "Instruct the State Technical Vigilance Wing to initiate an expedited financial compliance audit.",
                "Review district-wide unit rate variations across identical civil works to detect systematic over-estimation.",
            ],
            "ministry": [
                "Flag work for national central sample audit in the next quarterly MPLADS performance review.",
                "Issue an advisory to the District Nodal Officer regarding compliance with central financial ceiling norms.",
            ],
        },
        "HIGH": {
            "mp": [
                "Request an updated expenditure justification statement from the District Planning Officer.",
                "Inspect completed project components to confirm quality of civil execution before final installment release.",
            ],
            "district": [
                "Withhold next installment release until technical verification of expenditure vouchers is certified.",
                "Review contractor measurement sheets against prevailing Schedule of Rates (SOR) benchmarks.",
            ],
            "state": [
                "Issue guidance note to the district collectorate regarding unit cost standardization in the sector.",
                "Monitor cumulative district expenditure velocity against approved annual allocation ceilings.",
            ],
            "ministry": [
                "Log financial variance trigger in the national monitoring database for thematic evaluation.",
                "Request quarterly expenditure certificate confirmation from the State Nodal Authority.",
            ],
        },
        "MEDIUM": {
            "mp": [
                "Review quarterly progress summary and expenditure vouchers during next district advisory meeting.",
                "Seek confirmation that work cost estimate adheres to standard local government engineering rates.",
            ],
            "district": [
                "Request clarification from the Assistant Engineer regarding minor unit cost variance.",
                "Ensure updated milestone expenditure vouchers are uploaded to the public portal.",
            ],
            "state": [
                "Track work status in routine monthly state progress reconciliation.",
                "Verify timely submission of utilization certificates by the district authority.",
            ],
            "ministry": [
                "Maintain project in standard administrative monitoring pool.",
                "Ensure periodic data validation sync between state portal and national dashboard.",
            ],
        },
    },
    "payment": {
        "CRITICAL": {
            "mp": [
                "Seek written briefing from District Collector on justification for rapid multi-tranche disbursements.",
                "Verify on-site whether physical milestones correspond to the released installment percentages.",
            ],
            "district": [
                "Halt pending payment releases and freeze bank account tranches pending complete voucher re-verification.",
                "Order an immediate verification of Measurement Book (MB) entries against payment pass orders.",
            ],
            "state": [
                "Examine implementing agency disbursement velocity across all constituency works in the district.",
                "Issue procedural directive regarding strict adherence to multi-installment release milestones.",
            ],
            "ministry": [
                "Review fund utilization velocity patterns for potential statutory threshold structuring.",
                "Request comprehensive bank disbursement log from the State Nodal Authority.",
            ],
        },
        "HIGH": {
            "mp": [
                "Request confirmation from district office that milestone verification preceded recent disbursements.",
                "Inquire about payment schedules and unreleased balances during district committee meetings.",
            ],
            "district": [
                "Require junior engineer to furnish verified MB certificate before clearing the final installment.",
                "Audit same-day and round-number disbursements to verify individual itemized billing sheets.",
            ],
            "state": [
                "Flag district payment frequency for review in monthly nodal coordination conference.",
                "Verify that advance payments adhere to central MPLADS treasury draw-down ceilings.",
            ],
            "ministry": [
                "Note payment clustering indicators in quarterly institutional analytics reports.",
                "Cross-check state disbursement reports against central treasury release milestones.",
            ],
        },
        "MEDIUM": {
            "mp": [
                "Track remaining payment disbursements against physical completion milestones.",
                "Request regular payment status updates from the nodal officer.",
            ],
            "district": [
                "Ensure proper physical verification certificates accompany the next scheduled disbursement.",
                "Validate that round-amount vouchers reflect exact contractor billing milestones.",
            ],
            "state": [
                "Include payment velocity metrics in routine regional reporting.",
                "Ensure district maintains proper electronic billing register entries.",
            ],
            "ministry": [
                "Record payment sequence characteristics in system telemetry.",
                "Monitor for future payment acceleration anomalies.",
            ],
        },
    },
    "progress": {
        "CRITICAL": {
            "mp": [
                "Demand an urgent tripartite review with District Magistrate and contractor on execution stalls.",
                "Conduct an on-site physical inspection to document actual ground execution vs reported milestones.",
            ],
            "district": [
                "Issue a formal show-cause notice to the contractor for unexcused duration overrun exceeding 180 days.",
                "Deploy an independent technical audit team to assess whether work is stalled or abandoned.",
            ],
            "state": [
                "Mandate district submission of a time-bound revival plan or formal termination dossier.",
                "Review state-wide project completion rates for the implementing agency to identify systemic delay.",
            ],
            "ministry": [
                "Register work on the national delayed projects watch list for active tracking.",
                "Require State Nodal Officer to submit status report during national quarterly review.",
            ],
        },
        "HIGH": {
            "mp": [
                "Inquire with district authorities regarding contractor bottlenecks and revised completion targets.",
                "Seek confirmation of updated milestone inspection dates from the executive engineer.",
            ],
            "district": [
                "Summon contractor and implementing agency to submit an updated PERT/CPM recovery schedule.",
                "Withhold payment releases until physical progress reaches certified contractual milestone parity.",
            ],
            "state": [
                "Direct district administration to impose contractual liquidated damages if delay is unexcused.",
                "Monitor monthly physical progress reports to ensure revised milestones are respected.",
            ],
            "ministry": [
                "Track project in central delayed works monitoring portal.",
                "Evaluate district-level execution bottlenecks in annual performance scoring.",
            ],
        },
        "MEDIUM": {
            "mp": [
                "Request periodic status updates regarding scheduled completion deadlines.",
                "Encourage local community oversight of ongoing civil construction.",
            ],
            "district": [
                "Instruct the field engineer to conduct a routine milestone verification inspection within 14 days.",
                "Ensure updated physical progress percentages and geotagged site photos are uploaded.",
            ],
            "state": [
                "Review routine project progress in standard bi-monthly state reconciliation.",
                "Ensure implementing agency reports milestone updates without documentation lag.",
            ],
            "ministry": [
                "Maintain project in standard monitoring queue.",
                "Log progress trajectory in statistical baseline database.",
            ],
        },
    },
    "procurement": {
        "CRITICAL": {
            "mp": [
                "Call for an administrative inquiry into tender competition and single-bidder award patterns.",
                "Review tender notification reach to ensure local contractors had fair bidding opportunity.",
            ],
            "district": [
                "Initiate an administrative review of tender publication timeline and disqualification logs.",
                "Halt contract execution if procurement rules regarding mandatory re-tendering were bypassed.",
            ],
            "state": [
                "Direct the state procurement oversight cell to inspect bidding patterns in the executing agency.",
                "Audit winning bid margin variances across the district's recent public works tenders.",
            ],
            "ministry": [
                "Flag procurement anomaly in central e-tendering oversight database.",
                "Review implementing agency compliance with public procurement transparency mandates.",
            ],
        },
        "HIGH": {
            "mp": [
                "Request clarification regarding tender publicity and bidder participation numbers.",
                "Advise district administration to enforce broad public notice for future constituency tenders.",
            ],
            "district": [
                "Review tender evaluation committee minutes and single-bidder rate justification sheets.",
                "Verify whether bidder disqualifications adhered strictly to certified technical tender terms.",
            ],
            "state": [
                "Examine agency tender re-call policies to ensure competitive bidding thresholds.",
                "Monitor tender participation density across similar infrastructure works in neighboring districts.",
            ],
            "ministry": [
                "Record procurement competition indicators in national transparency benchmarks.",
                "Recommend e-procurement portal audit for the executing jurisdiction.",
            ],
        },
        "MEDIUM": {
            "mp": [
                "Seek confirmation that public tendering adhered to standard municipal procurement guidelines.",
                "Encourage wide local advertisement of future constituency development works.",
            ],
            "district": [
                "Ensure complete procurement documentation and comparative bid statements are preserved in case file.",
                "Verify that contract award value aligns with sanctioned technical estimates.",
            ],
            "state": [
                "Track district procurement timelines in routine quarterly reporting.",
                "Verify compliance with state e-procurement guidelines.",
            ],
            "ministry": [
                "Maintain procurement metrics in annual regional compliance audit sample.",
                "Log bidding statistics in national procurement database.",
            ],
        },
    },
    "contractor": {
        "CRITICAL": {
            "mp": [
                "Request District Collector to examine potential vendor monopolization across constituency allocations.",
                "Inquire whether contractor has capacity strain impacting simultaneous local works.",
            ],
            "district": [
                "Conduct full technical and financial capacity verification of the contractor's active commitments.",
                "Investigate potential shared corporate directors or collusion ties with competing tenderers.",
            ],
            "state": [
                "Audit contractor market concentration and cumulative contract awards across all state districts.",
                "Evaluate implementing agency procurement practices for signs of vendor capture or favoritism.",
            ],
            "ministry": [
                "Cross-reference contractor registration details in central vendor compliance repository.",
                "Issue advisory on implementing agency monopolization and vendor capacity caps.",
            ],
        },
        "HIGH": {
            "mp": [
                "Request summary of active works awarded to the contractor across the constituency.",
                "Urge district authority to promote healthy vendor competition for local development.",
            ],
            "district": [
                "Inspect contractor workforce and machinery deployment to ensure adequate site staffing.",
                "Check contractor past-performance records for unexcused delays on other district assignments.",
            ],
            "state": [
                "Monitor vendor allocation ratios in the district to prevent single-agency concentration.",
                "Require district nodal officers to report multi-project contractor commitments.",
            ],
            "ministry": [
                "Record contractor concentration index in national governance analytics.",
                "Track vendor performance trends across central sector allocations.",
            ],
        },
        "MEDIUM": {
            "mp": [
                "Inquire about contractor completion timelines during periodic advisory reviews.",
                "Promote equitable vendor participation in constituency development initiatives.",
            ],
            "district": [
                "Verify contractor's current technical staff presence during routine milestone visits.",
                "Ensure contractor registration certificates and insurance bonds are valid.",
            ],
            "state": [
                "Review contractor allocation diversity in routine annual performance evaluations.",
                "Maintain updated state vendor capability registry.",
            ],
            "ministry": [
                "Include project in regular contractor risk sampling.",
                "Maintain national vendor profile registry updates.",
            ],
        },
    },
    "geospatial": {
        "CRITICAL": {
            "mp": [
                "Verify physical existence and operational utility of the asset in the designated village.",
                "Confirm whether duplicate or overlapping recommendations exist in the same village cluster.",
            ],
            "district": [
                "Dispatch revenue officer and technical surveyor to verify asset GPS coordinates on site.",
                "Investigate geographic clustering of high-cost works in low-infrastructure-need pockets.",
            ],
            "state": [
                "Cross-reference project GPS coordinates against state GIS asset database to prevent duplication.",
                "Analyze spatial funding equity across rural blocks in the district.",
            ],
            "ministry": [
                "Review satellite imagery verification logs for the reported coordinate boundary.",
                "Flag geographic cluster for central geographic information system (GIS) audit.",
            ],
        },
        "HIGH": {
            "mp": [
                "Seek confirmation from panchayat representatives regarding project location and local benefit.",
                "Request updated geotagged photographs of the project site from the district planning cell.",
            ],
            "district": [
                "Require field engineer to capture and upload high-resolution geotagged photos with timestamp metadata.",
                "Compare spatial unit cost against identical civil works in neighboring revenue villages.",
            ],
            "state": [
                "Incorporate project GPS coordinates into state public works portal mapping.",
                "Verify district geographic asset distribution against census infrastructure gap indices.",
            ],
            "ministry": [
                "Include project in spatial random sampling for satellite verification.",
                "Monitor district-level geographic disparity metrics in national review.",
            ],
        },
        "MEDIUM": {
            "mp": [
                "Confirm project site accessibility and public utility during constituency tour.",
                "Ensure local community is informed of the designated asset location.",
            ],
            "district": [
                "Verify that standard geotagged photographic evidence is archived in the project dossier.",
                "Ensure project signboard with scheme details is installed at the verified coordinates.",
            ],
            "state": [
                "Maintain regular GIS asset catalog updates for the district.",
                "Track geographic distribution of developmental works in routine reporting.",
            ],
            "ministry": [
                "Record coordinates in central asset registry.",
                "Maintain standard geospatial tracking.",
            ],
        },
    },
    "graph": {
        "CRITICAL": {
            "mp": [
                "Request formal review of repetitive tripartite allocations involving the same executing agency and contractor.",
                "Ensure open tender competition for all upcoming constituency development proposals.",
            ],
            "district": [
                "Investigate potential collusive relationships or shared beneficial ownership between contractor and agency officials.",
                "Reassign upcoming project supervision to an independent departmental engineering division.",
            ],
            "state": [
                "Deploy the State Administrative Vigilance Directorate to audit the district's closed-loop contracting network.",
                "Examine agency-contractor exclusivity patterns across all state departments.",
            ],
            "ministry": [
                "Log multi-entity network anomaly in national integrity analytics framework.",
                "Recommend third-party social audit for works executed under the identified entity cluster.",
            ],
        },
        "HIGH": {
            "mp": [
                "Urge district administration to broaden implementing agency selection across development sectors.",
                "Request transparency reports on agency-contractor contract distribution.",
            ],
            "district": [
                "Review procurement logs to confirm other registered contractors were not systematically excluded.",
                "Rotate technical supervision officers overseeing repeated contractor-agency assignments.",
            ],
            "state": [
                "Monitor agency procurement diversity and enforce open contractor empannelment guidelines.",
                "Audit network centrality metrics for high-volume executing agencies in the district.",
            ],
            "ministry": [
                "Track entity co-occurrence indices in quarterly governance reviews.",
                "Issue advisory on diversifying implementing agency assignments.",
            ],
        },
        "MEDIUM": {
            "mp": [
                "Encourage diversification of executing agencies for constituency infrastructure works.",
                "Review agency performance summaries in district committee meetings.",
            ],
            "district": [
                "Ensure fair rotation of work assignments among qualified regional implementing agencies.",
                "Verify proper documentation of agency selection rationale in administrative approvals.",
            ],
            "state": [
                "Track agency workload distribution in regular state progress reviews.",
                "Maintain balanced allocation across eligible engineering departments.",
            ],
            "ministry": [
                "Include network metrics in annual institutional monitoring.",
                "Record relationship patterns in system database.",
            ],
        },
    },
}

# Fallback generic when domain is not in template
DEFAULT_TEMPLATE = {
    "mp": [
        "Review project documentation and milestone progress with the District Planning Officer.",
        "Conduct periodic site visits to ensure execution quality and public benefit.",
    ],
    "district": [
        "Conduct comprehensive technical and financial audit of milestone completion vouchers.",
        "Ensure verified Measurement Book entries and geotagged photographs are updated.",
    ],
    "state": [
        "Monitor district execution compliance and verify timely submission of utilization certificates.",
        "Review project risk score in monthly state nodal monitoring conference.",
    ],
    "ministry": [
        "Maintain project under active monitoring in the national MPLADS oversight portal.",
        "Review risk metrics during annual state performance evaluation.",
    ],
}


def get_fallback_recommendations(
    triggered_domains: List[str],
    risk_level: str,
) -> Dict[str, Any]:
    """Generate deterministic, grounded administrative recommendations based on top triggered domain and risk level."""
    normalized_level = str(risk_level).upper()
    if normalized_level not in ("CRITICAL", "HIGH", "MEDIUM"):
        normalized_level = "MEDIUM"

    # Select primary domain from triggered domains
    primary_domain = "financial"
    for d in triggered_domains:
        d_clean = d.lower().replace("_anomaly_score", "").replace("_anomaly", "")
        if d_clean in FALLBACK_DOMAIN_TEMPLATES:
            primary_domain = d_clean
            break

    domain_tier_recs = FALLBACK_DOMAIN_TEMPLATES.get(primary_domain, {}).get(normalized_level, DEFAULT_TEMPLATE)

    return {
        "triggered_domains": triggered_domains if triggered_domains else [primary_domain],
        "recommendations": {
            "mp": domain_tier_recs.get("mp", DEFAULT_TEMPLATE["mp"]),
            "district": domain_tier_recs.get("district", DEFAULT_TEMPLATE["district"]),
            "state": domain_tier_recs.get("state", DEFAULT_TEMPLATE["state"]),
            "ministry": domain_tier_recs.get("ministry", DEFAULT_TEMPLATE["ministry"]),
        },
        "confidence_note": f"Grounded administrative action policy generated from verified {primary_domain.capitalize()} domain anomaly triggers at {normalized_level} risk level.",
    }
