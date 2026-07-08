"""
schemas.py
==========
Pydantic v2 models for ReviewSense API request and response validation.
All API input/output is typed here — never use raw dicts in routes.
"""

from pydantic import BaseModel, Field
from typing import Literal


# ── Per-review result ─────────────────────────────────────────────────────────

class ReviewResult(BaseModel):
    """Single review classification result."""
    text: str = Field(..., description="Original review text (truncated to 300 chars for display)")
    sentiment: Literal["positive", "neutral", "negative"]
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence 0–1")


# ── Summary counts ────────────────────────────────────────────────────────────

class SentimentSummary(BaseModel):
    """Aggregate sentiment counts across all reviews."""
    positive: int
    neutral: int
    negative: int


# ── Theme extraction result ───────────────────────────────────────────────────

class Themes(BaseModel):
    """Top recurring phrases per sentiment class."""
    positive: list[str] = Field(default_factory=list)
    neutral:  list[str] = Field(default_factory=list)
    negative: list[str] = Field(default_factory=list)


# ── Main API response ─────────────────────────────────────────────────────────

class AnalyzeResponse(BaseModel):
    """
    Full response from POST /analyze.
    Returned after processing a CSV upload.
    """
    model_used:     Literal["baseline", "transformer"]
    total_reviews:  int
    summary:        SentimentSummary
    themes:         Themes
    reviews:        list[ReviewResult]


# ── Health check response ─────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    """Response from GET /health — used by frontend status badge."""
    status:          Literal["ok", "degraded"]
    baseline_loaded: bool
    transformer_loaded: bool
    message:         str
