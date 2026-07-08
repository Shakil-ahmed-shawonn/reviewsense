"""
services/sentiment.py
======================
Sentiment model loader and inference service.

Two models supported:
    baseline    — TF-IDF + Logistic Regression (pipeline.pkl)
                  Fast (~5ms/review), lightweight, runs on CPU
    transformer — distilbert-base-uncased-finetuned-sst-2-english
                  More accurate, ~200ms/review, loads from HF Hub at startup

Model loading strategy:
    - Both models loaded once at app startup via lifespan context manager
    - Stored in module-level state dict (simple, no class needed)
    - Transformer loaded lazily — only if available, never crashes startup
"""

import json
import logging
import joblib
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)

# ── Model state — loaded once at startup ──────────────────────────────────────

_state: dict = {
    "baseline":    None,   # sklearn Pipeline
    "label_map":   None,   # dict[str, str] — index → label name
    "transformer": None,   # HF pipeline or None if unavailable
}

# Paths — relative to this file's location
_BASE_DIR   = Path(__file__).parent.parent
_MODEL_DIR  = _BASE_DIR / "models"
_PIPELINE   = _MODEL_DIR / "pipeline.pkl"
_LABEL_MAP  = _MODEL_DIR / "label_map.json"

# Transformer model ID on Hugging Face Hub
# Binary (pos/neg) — we map neg→negative, pos→positive, no neutral
_HF_MODEL_ID = _HF_MODEL_ID = _HF_MODEL_ID = "nlptown/bert-base-multilingual-uncased-sentiment"


# ── Loaders ───────────────────────────────────────────────────────────────────

def load_baseline() -> bool:
    """
    Loads the TF-IDF + Logistic Regression pipeline from disk.

    Returns:
        True if loaded successfully, False otherwise
    """
    if not _PIPELINE.exists():
        logger.error(f"pipeline.pkl not found at {_PIPELINE}")
        return False
    if not _LABEL_MAP.exists():
        logger.error(f"label_map.json not found at {_LABEL_MAP}")
        return False

    try:
        _state["baseline"]  = joblib.load(_PIPELINE)
        with open(_LABEL_MAP) as f:
            raw = json.load(f)
            # Keys from JSON are strings — convert to int
            _state["label_map"] = {int(k): v for k, v in raw.items()}
        logger.info("✓ Baseline model loaded")
        return True
    except Exception as e:
        logger.error(f"Failed to load baseline model: {e}")
        return False


def load_transformer() -> bool:
    """
    Loads the DistilBERT sentiment pipeline from Hugging Face Hub.
    Fails silently — transformer is optional, baseline always required.

    Returns:
        True if loaded successfully, False otherwise
    """
    try:
        from transformers import pipeline as hf_pipeline
        _state["transformer"] = hf_pipeline(
            "sentiment-analysis",
            model=_HF_MODEL_ID,
            truncation=True,
            max_length=512,
        )
        logger.info("✓ Transformer model loaded")
        return True
    except Exception as e:
        logger.warning(f"Transformer model unavailable (non-fatal): {e}")
        return False


# ── Status ────────────────────────────────────────────────────────────────────

def is_baseline_loaded() -> bool:
    """Returns True if the baseline model is ready for inference."""
    return _state["baseline"] is not None


def is_transformer_loaded() -> bool:
    """Returns True if the transformer model is ready for inference."""
    return _state["transformer"] is not None


# ── Inference ─────────────────────────────────────────────────────────────────

def predict(
    reviews: list[str],
    model: Literal["baseline", "transformer"] = "baseline",
) -> list[dict]:
    """
    Runs sentiment classification on a list of review strings.

    Args:
        reviews: list of review text strings
        model:   "baseline" or "transformer"

    Returns:
        List of dicts with keys: text, sentiment, confidence

    Raises:
        RuntimeError if requested model is not loaded
        ValueError   if reviews list is empty
    """
    if not reviews:
        raise ValueError("reviews list cannot be empty")

    if model == "transformer":
        if not is_transformer_loaded():
            logger.warning("Transformer not loaded — falling back to baseline")
            model = "baseline"

    if model == "baseline":
        return _predict_baseline(reviews)
    else:
        return _predict_transformer(reviews)


def _predict_baseline(reviews: list[str]) -> list[dict]:
    """
    Runs TF-IDF + Logistic Regression inference.

    Args:
        reviews: list of review text strings

    Returns:
        List of dicts: {text, sentiment, confidence}
    """
    if not is_baseline_loaded():
        raise RuntimeError("Baseline model is not loaded")

    pipeline   = _state["baseline"]
    label_map  = _state["label_map"]

    # predict_proba returns shape (n_samples, n_classes)
    proba_matrix = pipeline.predict_proba(reviews)

    results = []
    for text, proba in zip(reviews, proba_matrix):
        label_idx   = int(proba.argmax())
        sentiment   = label_map[label_idx]
        confidence  = float(proba[label_idx])

        results.append({
            "text":       text[:300],   # truncate for display
            "sentiment":  sentiment,
            "confidence": round(confidence, 4),
        })

    return results


def _predict_transformer(reviews: list[str]) -> list[dict]:
    hf_pipe = _state["transformer"]
    raw     = hf_pipe(reviews, batch_size=16, truncation=True)

    results = []
    for text, pred in zip(reviews, raw):
        # nlptown outputs "1 star" to "5 stars"
        stars = int(pred["label"][0])   # extracts the number
        confidence = float(pred["score"])

        if stars <= 2:
            sentiment = "negative"
        elif stars == 3:
            sentiment = "neutral"
        else:
            sentiment = "positive"

        results.append({
            "text":       text[:300],
            "sentiment":  sentiment,
            "confidence": round(confidence, 4),
        })
    return results
