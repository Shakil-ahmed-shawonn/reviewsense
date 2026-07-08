"""
services/theme_extractor.py
============================
Extracts top recurring phrases (n-grams) per sentiment class.

How it works:
    - Groups reviews by predicted sentiment
    - Runs TF-IDF independently on each group
    - Returns the top N bigrams/trigrams by TF-IDF score
    - No extra model needed — reuses sklearn TF-IDF infrastructure

This gives the "what positive reviewers praise vs what negative
reviewers complain about" insight that makes ReviewSense useful.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

from schemas import Themes


# Number of top phrases to extract per sentiment class
TOP_N = 6

# n-gram range — bigrams + trigrams give meaningful phrases
NGRAM_RANGE = (2, 3)

# Common stop words to skip in theme extraction
EXTRA_STOP_WORDS = [
    "the product", "this product", "the item", "very good",
    "really good", "very bad", "not good", "so good",
]


def extract_themes(reviews: list[str], sentiments: list[str]) -> Themes:
    """
    Extracts top recurring phrases per sentiment class using TF-IDF.

    Args:
        reviews:    list of review text strings
        sentiments: list of predicted sentiment labels (same length as reviews)

    Returns:
        Themes object with top phrases for positive, neutral, negative
    """
    groups: dict[str, list[str]] = {
        "positive": [],
        "neutral":  [],
        "negative": [],
    }

    # Group reviews by their predicted sentiment
    for text, sentiment in zip(reviews, sentiments):
        if sentiment in groups:
            groups[sentiment].append(text)

    result: dict[str, list[str]] = {}

    for label, texts in groups.items():
        result[label] = _top_phrases(texts, TOP_N)

    return Themes(
        positive=result.get("positive", []),
        neutral=result.get("neutral", []),
        negative=result.get("negative", []),
    )


def _top_phrases(texts: list[str], top_n: int) -> list[str]:
    """
    Returns the top N TF-IDF bigrams/trigrams from a list of texts.

    Returns empty list if fewer than 3 texts (not enough for meaningful TF-IDF).

    Args:
        texts:  list of review strings for one sentiment class
        top_n:  number of top phrases to return

    Returns:
        List of top phrase strings, sorted by TF-IDF score descending
    """
    if len(texts) < 3:
        return []

    try:
        vectorizer = TfidfVectorizer(
            ngram_range=NGRAM_RANGE,
            max_features=500,
            stop_words="english",
            min_df=2,                    # phrase must appear in at least 2 reviews
            token_pattern=r"\b[a-zA-Z]{3,}\b",  # skip short tokens + numbers
        )
        tfidf_matrix = vectorizer.fit_transform(texts)

        # Mean TF-IDF score across all documents for each phrase
        mean_scores = np.asarray(tfidf_matrix.mean(axis=0)).flatten()
        feature_names = vectorizer.get_feature_names_out()

        # Sort by score descending, take top_n
        top_indices = mean_scores.argsort()[::-1][:top_n]
        phrases = [feature_names[i] for i in top_indices]

        return phrases

    except Exception:
        # If TF-IDF fails for any reason, return empty rather than crash
        return []
