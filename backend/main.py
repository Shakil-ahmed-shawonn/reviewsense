"""
main.py
=======
ReviewSense FastAPI application.

Routes:
    GET  /health    — model load status (used by frontend status badge)
    POST /analyze   — accepts CSV upload, returns full sentiment analysis

Startup:
    Both models are loaded once via lifespan context manager.
    App never crashes on transformer load failure — baseline is always required.

CORS:
    Configured for local dev (localhost:5173) and production Netlify domain.
    Update ALLOWED_ORIGINS before deploying.
"""

import logging
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import AnalyzeResponse, HealthResponse, ReviewResult, SentimentSummary
from services import sentiment, csv_processor, theme_extractor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── CORS origins ──────────────────────────────────────────────────────────────
# Add your Netlify frontend URL here before deploying

ALLOWED_ORIGINS = [
    "http://localhost:5173",          # Vite dev server
    "http://localhost:3000",          # alternative dev port
    "https://reviewsense.netlify.app", # your Netlify URL — update this
    "*",                               # remove this line in production
]


# ── Lifespan — runs once on startup/shutdown ──────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Loads both models at startup.
    Transformer failure is non-fatal — logs a warning and continues.
    """
    logger.info("Loading models ...")

    baseline_ok    = sentiment.load_baseline()
    transformer_ok = sentiment.load_transformer()

    if not baseline_ok:
        logger.error("FATAL: Baseline model failed to load. Check backend/models/pipeline.pkl exists.")
    if not transformer_ok:
        logger.warning("Transformer model not available — transformer toggle will fall back to baseline.")

    logger.info("Startup complete.")
    yield
    logger.info("Shutting down ReviewSense API.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ReviewSense API",
    description="B2B sentiment analysis for customer reviews. Upload a CSV, get insights.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
def health_check() -> HealthResponse:
    """
    Returns current model load status.
    Used by the frontend to show the API online/offline badge.
    """
    baseline_ok    = sentiment.is_baseline_loaded()
    transformer_ok = sentiment.is_transformer_loaded()

    status  = "ok" if baseline_ok else "degraded"
    message = "All systems operational" if baseline_ok else "Baseline model not loaded"

    return HealthResponse(
        status=status,
        baseline_loaded=baseline_ok,
        transformer_loaded=transformer_ok,
        message=message,
    )


@app.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze_reviews(
    file:  Annotated[UploadFile, File(description="CSV file with a 'review_text' column")],
    model: Annotated[str, Form(description="Model to use: 'baseline' or 'transformer'")] = "baseline",
) -> AnalyzeResponse:
    """
    Analyzes customer reviews from an uploaded CSV file.

    Expected CSV format:
        review_text
        "Great product, fast shipping!"
        "Broke after one week, very disappointed."

    Returns sentiment breakdown, top themes per class, and per-review results.
    """
    # Validate model param early
    if model not in ("baseline", "transformer"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model '{model}'. Must be 'baseline' or 'transformer'."
        )

    if not sentiment.is_baseline_loaded():
        raise HTTPException(
            status_code=503,
            detail="Sentiment model is not loaded. Please try again shortly."
        )

    # Read file bytes
    file_bytes = await file.read()

    # Parse and validate CSV
    reviews = csv_processor.parse_csv(file_bytes, file.filename or "upload.csv")

    # Run inference
    try:
        predictions = sentiment.predict(reviews, model=model)  # type: ignore
    except Exception as e:
        logger.error(f"Inference failed: {e}")
        raise HTTPException(status_code=500, detail="Inference failed. Please try again.")

    # Build summary counts
    counts = {"positive": 0, "neutral": 0, "negative": 0}
    sentiments_list = []
    review_results  = []

    for pred in predictions:
        s = pred["sentiment"]
        counts[s] += 1
        sentiments_list.append(s)
        review_results.append(ReviewResult(
            text=pred["text"],
            sentiment=s,
            confidence=pred["confidence"],
        ))

    # Extract themes
    themes = theme_extractor.extract_themes(reviews, sentiments_list)

    return AnalyzeResponse(
        model_used=model,           # type: ignore
        total_reviews=len(reviews),
        summary=SentimentSummary(**counts),
        themes=themes,
        reviews=review_results,
    )
