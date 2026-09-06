"""Pydantic Schemas for SETU Risk Intelligence API.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LiveFusionRequest(BaseModel):
    project_id: str = Field(default="PROPOSAL-NEW-01", description="Project or proposal identifier")
    financial_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    geospatial_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    procurement_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    contractor_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    payment_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    progress_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    graph_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    fraud_probability: float = Field(default=0.0, ge=0.0, le=1.0)
    predicted_typology: str = Field(default="NORMAL")
    domain_reasons: Optional[Dict[str, List[str]]] = None


class LiveFusionResponse(BaseModel):
    project_id: str
    overall_risk_score: float
    risk_level: str
    investigation_priority: str
    primary_typology: str
    fraud_probability: float
    synthesized_reasons: List[str]
    primary_reason: str
    secondary_reason: Optional[str] = None
    tertiary_reason: Optional[str] = None


class RawProposalScoringRequest(BaseModel):
    project_id: Optional[str] = Field(default=None, description="Optional proposal identifier")
    work_name: str = Field(default="Construction of Community Center", description="Proposed work title")
    category: str = Field(default="Public Infrastructure", description="MPLADS project sector category")
    state: str = Field(default="Bihar", description="State name")
    constituency: str = Field(default="Darbhanga", description="Constituency name")
    district: Optional[str] = Field(default="DARBHANGA", description="District name")
    ida: Optional[str] = Field(default="District Planning Authority", description="Implementing Agency")
    contractor_name: Optional[str] = Field(default="Apex Infrastructure Ltd", description="Proposed contractor")
    sanctioned_amount: float = Field(default=2500000.0, ge=0.0, description="Requested fund amount in INR")
    estimated_cost: Optional[float] = Field(default=None, ge=0.0, description="Technical cost estimate in INR")
    tender_amount: Optional[float] = Field(default=None, ge=0.0, description="Tender contract value in INR")
    planned_duration_days: int = Field(default=180, ge=1, le=3650, description="Planned timeline duration in days")
    work_type: Optional[str] = Field(default="Civil Infrastructure", description="Specific work typology")
    num_bidders: Optional[int] = Field(default=3, ge=1, description="Number of tender participants")
    is_single_bid: Optional[bool] = Field(default=False, description="Whether single-bid tender occurred")
    contractor_past_delays: Optional[int] = Field(default=0, ge=0, description="Prior delayed projects by contractor")
    latitude: Optional[float] = Field(default=26.1542, description="Project location latitude")
    longitude: Optional[float] = Field(default=85.8918, description="Project location longitude")


class RawProposalScoringResponse(BaseModel):
    proposal_id: str
    overall_risk_score: float
    risk_level: str
    investigation_priority: str
    primary_typology: str
    fraud_probability: float
    approval_recommendation: str
    sub_scores: Dict[str, float]
    synthesized_reasons: List[str]
    primary_reason: str
    secondary_reason: Optional[str] = None
    inference_time_ms: float
    evaluated_at: str


class ProjectRiskDetailResponse(BaseModel):
    project_id: str
    overall_risk_score: float
    risk_level: str
    investigation_priority: str
    primary_typology: str
    fraud_probability: float
    synthesized_reasons: List[str]
    primary_reason: str
    secondary_reason: Optional[str] = None
    tertiary_reason: Optional[str] = None
    domain_scores: Dict[str, float]
    feature_importance_contributions: Optional[Dict[str, float]] = None
    scored_at: str


class RiskIntelligenceSummaryResponse(BaseModel):
    total_projects_evaluated: int
    risk_tier_distribution: Dict[str, int]
    investigation_priority_distribution: Dict[str, int]
    typology_distribution: Dict[str, int]
    risk_score_statistics: Dict[str, float]
    generated_at: str
