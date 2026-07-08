"""
train_baseline.py
=================
Trains a TF-IDF + Logistic Regression sentiment classifier on the
Amazon Fine Food Reviews dataset (50k sample).

Label mapping (from star ratings):
    1-2 stars  → negative (0)
    3 stars    → neutral  (1)
    4-5 stars  → positive (2)

Outputs (saved to ../backend/models/):
    pipeline.pkl  — complete sklearn Pipeline (vectorizer + classifier)
    label_map.json — label index → string mapping

Usage:
    python train_baseline.py

Requirements:
    pip install pandas scikit-learn joblib
"""

import os
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix


# ── Config ────────────────────────────────────────────────────────────────────

DATA_PATH    = "./data/Reviews.csv"       # raw Kaggle CSV
MODEL_DIR    = "../backend/models"        # where .pkl files are saved
SAMPLE_SIZE  = 50_000                     # rows to sample (stratified)
RANDOM_STATE = 42
TEST_SIZE    = 0.2

# Label map: index → human-readable string
LABEL_MAP = {0: "negative", 1: "neutral", 2: "positive"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_and_sample(path: str, n: int, random_state: int) -> pd.DataFrame:
    """
    Loads the Reviews CSV and returns a stratified sample of n rows.
    Drops rows with missing review text or score.

    Args:
        path:         path to Reviews.csv
        n:            number of rows to sample
        random_state: for reproducibility

    Returns:
        Cleaned, sampled DataFrame with columns [Text, label]
    """
    print(f"[1/5] Loading dataset from {path} ...")
    df = pd.read_csv(path, usecols=["Score", "Text"])

    # Drop nulls
    df = df.dropna(subset=["Score", "Text"])

    # Map star ratings → 3-class labels
    def map_score(score: int) -> int:
        if score <= 2:
            return 0
        elif score == 3:
            return 1
        else:
            return 2

    df["label"] = df["Score"].apply(map_score)

    print(f"    Full dataset size: {len(df):,} rows")
    print(f"    Label distribution:\n{df['label'].value_counts().sort_index()}\n")

    # Stratified sample — pandas 2.x compatible
    samples = []
    for label_val in df["label"].unique():
        group = df[df["label"] == label_val]
        samples.append(group.sample(
            min(len(group), n // 3),
            random_state=random_state
        ))
    df_sample = pd.concat(samples).reset_index(drop=True)

    print(f"    Sampled {len(df_sample):,} rows (stratified by label)")
    return df_sample


def build_pipeline() -> Pipeline:
    """
    Builds a scikit-learn Pipeline:
        TfidfVectorizer → LogisticRegression

    Pipeline prevents data leakage — vectorizer is fit only on training data.
    class_weight='balanced' handles class imbalance automatically.

    Returns:
        Unfitted sklearn Pipeline
    """
    return Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=50_000,   # vocabulary size cap
            ngram_range=(1, 2),    # unigrams + bigrams
            sublinear_tf=True,     # log normalization — standard for text
            min_df=2,              # ignore terms appearing in < 2 docs
            strip_accents="unicode",
            analyzer="word",
            token_pattern=r"\w{2,}",  # ignore single chars
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            class_weight="balanced",  # handles class imbalance
            random_state=RANDOM_STATE,
            n_jobs=-1,                # use all CPU cores
            C=1.0,                    # regularisation strength
        )),
    ])


def evaluate(pipeline: Pipeline, X_test: pd.Series, y_test: pd.Series) -> None:
    """
    Prints classification report and confusion matrix.

    Args:
        pipeline: fitted sklearn Pipeline
        X_test:   test review texts
        y_test:   test labels
    """
    print("\n[4/5] Evaluating on test set ...")
    y_pred = pipeline.predict(X_test)

    print("\n── Classification Report ─────────────────────────────────────")
    print(classification_report(
        y_test,
        y_pred,
        target_names=["negative", "neutral", "positive"]
    ))

    print("── Confusion Matrix ──────────────────────────────────────────")
    cm = confusion_matrix(y_test, y_pred)
    print(f"                 Predicted")
    print(f"                 neg  neu  pos")
    labels = ["neg", "neu", "pos"]
    for i, row in enumerate(cm):
        print(f"  Actual {labels[i]}  {row}")
    print()


def save_artifacts(pipeline: Pipeline, model_dir: str) -> None:
    """
    Saves the fitted pipeline and label map to disk.

    Args:
        pipeline:  fitted sklearn Pipeline
        model_dir: directory to save artifacts into
    """
    os.makedirs(model_dir, exist_ok=True)

    pipeline_path  = os.path.join(model_dir, "pipeline.pkl")
    label_map_path = os.path.join(model_dir, "label_map.json")

    joblib.dump(pipeline, pipeline_path)
    print(f"    Saved pipeline  → {pipeline_path}")

    with open(label_map_path, "w") as f:
        json.dump(LABEL_MAP, f, indent=2)
    print(f"    Saved label map → {label_map_path}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    """Full training pipeline: load → split → train → evaluate → save."""

    # 1. Load and sample
    df = load_and_sample(DATA_PATH, SAMPLE_SIZE, RANDOM_STATE)

    # 2. Split — stratified to keep class distribution in both sets
    print("\n[2/5] Splitting into train / test sets ...")
    X_train, X_test, y_train, y_test = train_test_split(
        df["Text"],
        df["label"],
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=df["label"],   # critical for imbalanced classes
    )
    print(f"    Train: {len(X_train):,} | Test: {len(X_test):,}")

    # 3. Train
    print("\n[3/5] Training TF-IDF + Logistic Regression pipeline ...")
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)
    print("    Training complete.")

    # 4. Evaluate
    evaluate(pipeline, X_test, y_test)

    # 5. Save
    print("[5/5] Saving model artifacts ...")
    save_artifacts(pipeline, MODEL_DIR)

    print("\n✓ Done. Model ready for backend.")


if __name__ == "__main__":
    main()