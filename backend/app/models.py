from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

EventType = Literal["earthquake", "flood", "storm", "fire", "rain"]


class Event(BaseModel):
    """Common event model. Every connector normalizes into this."""

    id: str
    type: EventType
    title: str
    severity: int = Field(ge=1, le=5)
    confidence: float = Field(ge=0, le=1)
    lat: float
    lon: float
    start_time: datetime
    updated_time: datetime
    sources: list[str]
    explanation: str = ""
    properties: dict = Field(default_factory=dict)
