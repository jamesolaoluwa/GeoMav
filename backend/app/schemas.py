from pydantic import BaseModel
from typing import Optional
from enum import Enum


class ClaimStatus(str, Enum):
    pending = "pending"
    correction_deployed = "correction_deployed"
    resolved = "resolved"


class OpportunityStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"


class PromptCreate(BaseModel):
    text: str
    category: str


class ClaimUpdate(BaseModel):
    status: ClaimStatus


class OpportunityUpdate(BaseModel):
    status: OpportunityStatus


class ContentUpdate(BaseModel):
    content: str


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    category: Optional[str] = None


class DeployCorrection(BaseModel):
    claim_id: str
    correction_type: str
    content: str


class DeleteAccountRequest(BaseModel):
    user_id: str


class NotificationPreferencesUpdate(BaseModel):
    user_id: str
    hallucination_alerts: Optional[bool] = None
    weekly_report: Optional[bool] = None
    opportunity_alerts: Optional[bool] = None
    email: Optional[str] = None
