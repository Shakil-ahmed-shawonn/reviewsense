"""
services/csv_processor.py
==========================
Handles CSV upload validation and parsing.

Accepted CSV formats:
    - Single column: review_text or text or Review or Text
    - Multi-column: any CSV that has at least one of the above columns

Returns a clean list of non-empty strings ready for model inference.
"""

import io
import pandas as pd
from fastapi import HTTPException


# Column names we accept (case-insensitive check applied in parse function)
VALID_COLUMNS = {"review_text", "text", "review", "reviews"}

# Limits
MAX_ROWS    = 5_000    # prevent abuse on free-tier hosting
MIN_ROWS    = 1
MAX_FILE_MB = 5


def parse_csv(file_bytes: bytes, filename: str) -> list[str]:
    """
    Validates and parses an uploaded CSV file into a list of review strings.

    Validation rules:
        - Must be a .csv file
        - Must be under MAX_FILE_MB
        - Must contain a recognised text column
        - Must have at least MIN_ROWS non-empty rows
        - Capped at MAX_ROWS rows (returns first MAX_ROWS if exceeded)

    Args:
        file_bytes: raw bytes from the uploaded file
        filename:   original filename (used for extension check)

    Returns:
        List of cleaned review strings

    Raises:
        HTTPException 400 for all validation failures
    """
    # Extension check
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a .csv file."
        )

    # Size check
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f} MB). Maximum allowed size is {MAX_FILE_MB} MB."
        )

    # Parse CSV
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse CSV file. Make sure it is a valid CSV. Error: {str(e)}"
        )

    # Find the review text column (case-insensitive)
    col_map = {c.lower().strip(): c for c in df.columns}
    matched_col = None
    for valid in VALID_COLUMNS:
        if valid in col_map:
            matched_col = col_map[valid]
            break

    if matched_col is None:
        raise HTTPException(
            status_code=400,
            detail=(
                f"No recognised text column found. "
                f"Your CSV has columns: {list(df.columns)}. "
                f"Please rename your review column to one of: {sorted(VALID_COLUMNS)}"
            )
        )

    # Extract + clean
    reviews = (
        df[matched_col]
        .dropna()
        .astype(str)
        .str.strip()
        .loc[lambda s: s.str.len() > 0]
        .tolist()
    )

    if len(reviews) < MIN_ROWS:
        raise HTTPException(
            status_code=400,
            detail="CSV file contains no valid review text after cleaning."
        )

    # Cap rows — return first MAX_ROWS with a warning flag embedded in list
    if len(reviews) > MAX_ROWS:
        reviews = reviews[:MAX_ROWS]

    return reviews
