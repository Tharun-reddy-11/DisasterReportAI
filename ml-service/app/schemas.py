from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ExistingReportRef(BaseModel):
    report_id: str
    title: str
    description: str
    location: str
    category: Optional[str] = None
    created_at: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AnalysisRequest(BaseModel):
    report_id: str
    title: str = Field(min_length=2, max_length=160)
    description: str = Field(min_length=8)
    reported_category: Optional[str] = None
    location: str
    landmark: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    incident_at: Optional[str] = None
    affected_people: Optional[int] = Field(default=None, ge=0)
    injured_people: Optional[int] = Field(default=None, ge=0)
    trapped_people: Optional[int] = Field(default=None, ge=0)
    resources: Optional[str] = None
    has_image: bool = False
    has_audio: bool = False
    existing_reports: Optional[List[Dict[str, Any]]] = None


class DuplicateCheckRequest(BaseModel):
    reports: List[Dict[str, Any]]


class Prediction(BaseModel):
    category: str
    confidence: float
    priority: str
    severity_level: str
    severity_score: int
    evidence_score: int
    summary: str
    extracted: Dict[str, Any]
    evidence: List[str]
    caveats: List[str]
    duplicate_analysis: Optional[Dict[str, Any]] = None
    recommendation: Optional[Dict[str, Any]] = None
    model: Dict[str, Any]
