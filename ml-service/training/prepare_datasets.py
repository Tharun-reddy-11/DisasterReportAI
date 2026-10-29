"""Create project-owned CSV datasets from the supplied HumAID TSV corpus.

The generated training CSV is consumed by train.py. The compact priority and
resource CSVs document the explicit, explainable rules used by the live
decision-support scorer.
"""
from csv import DictReader, DictWriter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "datasets"
OUT = RAW / "processed"
OUT.mkdir(parents=True, exist_ok=True)

EVENT_MAP = {
    "flood": "flood", "wildfire": "fire", "earthquake": "earthquake",
    "hurricane": "cyclone_storm", "cyclone": "cyclone_storm", "storm": "cyclone_storm",
}

def category(path):
    value = str(path).lower()
    return next((label for term, label in EVENT_MAP.items() if term in value), None)

def build_text_training():
    destination = OUT / "disaster_text_training.csv"
    seen, count = set(), 0
    with destination.open("w", encoding="utf-8", newline="") as output:
        writer = DictWriter(output, fieldnames=["source_event", "text", "disaster_category", "humanitarian_label"])
        writer.writeheader()
        for file in RAW.rglob("*_train.tsv"):
            label = category(file)
            if not label:
                continue
            with file.open(encoding="utf-8", errors="replace", newline="") as source:
                for row in DictReader(source, delimiter="	"):
                    text = (row.get("tweet_text") or "").strip()
                    key = (text.lower(), label)
                    if len(text) < 12 or key in seen:
                        continue
                    seen.add(key)
                    writer.writerow({"source_event": file.parent.name, "text": text, "disaster_category": label, "humanitarian_label": row.get("class_label", "")})
                    count += 1
    return count

def build_rules():
    with (OUT / "priority_signal_rules.csv").open("w", encoding="utf-8", newline="") as output:
        writer = DictWriter(output, fieldnames=["signal", "signal_type", "weight", "purpose"])
        writer.writeheader()
        for signal in ["trapped", "collapsed", "urgent", "immediately", "rescue", "missing", "drowning", "evacuate", "critical"]:
            writer.writerow({"signal": signal, "signal_type": "urgency_term", "weight": 25, "purpose": "Explainable priority scoring"})
        writer.writerow({"signal": "reported_affected_people", "signal_type": "impact_count", "weight": 1, "purpose": "Explainable priority scoring"})
    with (OUT / "response_resource_reference.csv").open("w", encoding="utf-8", newline="") as output:
        writer = DictWriter(output, fieldnames=["disaster_category", "resource", "review_note"])
        writer.writeheader()
        rows = [
            ("flood", "rescue boats", "Confirm access routes and water depth with an authority."),
            ("fire", "fire service and medical support", "Do not infer fire spread from text alone."),
            ("earthquake", "search and rescue", "Confirm structural safety before response."),
            ("cyclone_storm", "shelter and evacuation support", "Confirm official weather alerts."),
            ("infrastructure_damage", "engineering assessment", "Confirm site hazards before entry."),
        ]
        for category_name, resource, note in rows:
            writer.writerow({"disaster_category": category_name, "resource": resource, "review_note": note})

if __name__ == "__main__":
    count = build_text_training()
    build_rules()
    print(f"Created {count} training rows in {OUT}")
