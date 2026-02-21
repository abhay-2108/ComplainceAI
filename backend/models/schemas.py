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

class PaymentFormatItem(BaseModel):
    name: str
    value: int

class DashboardMetrics(BaseModel):
    total_violations: int
    critical_risks: int
    health_score: str
    total_records: str
    records_scanned: str
    total_volume: str
    laundering_volume: str
    trend: List[RiskTrendItem]
    format_distribution: List[PaymentFormatItem]

class RiskInput(BaseModel):
    # Core transaction amounts
    amount_paid: float = 0.0          # Amount Paid (sent)
    amount_received: float = 0.0     # Amount Received
    from_bank: float = 0.0           # From Bank (numeric ID)
    to_bank: float = 0.0             # To Bank (numeric ID)

    # Temporal features (derived from timestamp)
    hour: int = 12                   # Hour of day (0-23)
    day_of_week: int = 0             # Day of week (0=Mon, 6=Sun)

    # Payment format (one-hot) — exactly ONE should be True
    payment_format: str = "Wire"     # Wire | Cash | Cheque | Credit Card | Reinvestment

    # Currency pair
    payment_currency: str = "US Dollar"    # US Dollar | Euro | Saudi Riyal | Yuan | Rupee
    receiving_currency: str = "US Dollar"  # US Dollar | Euro | Saudi Riyal | Yuan | Rupee

    # Legacy backward-compat fields (ignored by RF model, used for display)
    transaction_type: str = "UNKNOWN"
    amount: float = 0.0

class RiskOutput(BaseModel):
    risk_score: float
    risk_level: str  # LOW | MEDIUM | HIGH
    is_violation: bool
