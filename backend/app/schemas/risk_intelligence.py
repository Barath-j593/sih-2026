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
