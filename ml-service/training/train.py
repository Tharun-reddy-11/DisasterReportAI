"""Train the category classifier from local HumAID TSV training splits.

Run: python training/train.py
"""
from pathlib import Path
import sys, csv, joblib
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

ROOT = Path(__file__).resolve().parents[2]
DATASETS = ROOT / "datasets"
PROCESSED = DATASETS / "processed" / "disaster_text_training.csv"
OUT = ROOT / "ml-service" / "artifacts" / "disaster_text_classifier.joblib"

EVENT_MAP = {
    "flood": "flood", "wildfire": "fire", "earthquake": "earthquake",
    "hurricane": "cyclone_storm", "cyclone": "cyclone_storm", "storm": "cyclone_storm",
}

def category(path):
    name = str(path).lower()
    for needle, label in EVENT_MAP.items():
        if needle in name: return label
    return None

def rows_from_raw():
    for file in DATASETS.rglob("*_train.tsv"):
        label = category(file)
        if not label: continue
        with file.open(encoding="utf-8", errors="replace") as handle:
            next(handle, None)
            for line in handle:
                parts = line.rstrip("\n").split("\t")
                if len(parts) >= 2 and len(parts[1].strip()) > 12:
                    yield parts[1], label

def rows():
    if PROCESSED.exists():
        with PROCESSED.open(encoding="utf-8", newline="") as source:
            for row in csv.DictReader(source):
                if row["text"].strip():
                    yield row["text"], row["disaster_category"]
        return
    yield from rows_from_raw()

if __name__ == "__main__":
    examples = list(rows())
    if not examples:
        sys.exit("No usable HumAID training files found beneath datasets/.")
    texts, labels = zip(*examples)
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1,2), min_df=2, max_features=30000, stop_words="english")),
        ("classifier", LogisticRegression(max_iter=700, class_weight="balanced", n_jobs=None)),
    ])
    pipeline.fit(texts, labels)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, OUT)
    print(f"Trained {len(texts)} HumAID samples across {len(set(labels))} classes -> {OUT}")
