from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Transaction(BaseModel):
    id: str
    amount: float
    source: str
    currency: str = "USD"
    timestamp: datetime = Field(default_factory=datetime.now)
    type: str

class Violation(BaseModel):
    id: str
    type: str
    source: str
    date: str
    status: str
    riskScore: float
    explanation: str

class Policy(BaseModel):
    id: Optional[int] = None
    name: str
    date: str
    status: str
    size: str
    chunks_count: Optional[int] = 0

class AgentStatus(BaseModel):
    id: str
    status: str
    last_active: Optional[datetime] = None

class RiskTrendItem(BaseModel):
    name: str
    active: int
    risk: int

class DashboardMetrics(BaseModel):
    total_violations: int
    critical_risks: int
    health_score: str
    total_records: str
    records_scanned: str
    trend: List[RiskTrendItem]

class RiskInput(BaseModel):
    amount: float
    transaction_type: str
    account_age: int
    frequency: float

class RiskOutput(BaseModel):
    risk_score: float
    risk_level: str  # LOW | MEDIUM | HIGH
    is_violation: bool
