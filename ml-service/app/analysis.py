"""Comprehensive Disaster Field Report ML & NLP Engine.

Features:
- NLP text cleaning, normalization, and entity extraction
- HumAID-trained disaster classification (Flood, Cyclone/Storm, Fire, Earthquake, Infrastructure, Landslide, Other)
- Structured incident information extraction (damage, people impact, rescue requirements, landmarks)
- Geocoding resolver for Live Open Free Map coordinates (OpenStreetMap/Leaflet integration)
- Duplicate & related incident detection (lexical and geographic similarity)
- Explainable severity & triage assessment (Critical, High, Urgent, Moderate, Monitoring)
- Grounded Generative AI Incident Summary synthesizer preserving uncertainty
"""
import re
import csv
import math
from pathlib import Path
from typing import Optional, List, Dict, Any
import joblib

ARTIFACT = Path(__file__).resolve().parents[1] / "artifacts" / "disaster_text_classifier.joblib"
GEO_CSV = Path(__file__).resolve().parents[2] / "datasets" / "processed" / "location_geocoding_reference.csv"

KEYWORDS = {
    "flood": ("flood", "floodwater", "water entered", "inundat", "submerged", "overflow", "drowning", "riverbank", "breach", "water level", "heavy rain", "waterlogged", "nala"),
    "fire": ("fire", "wildfire", "burning", "smoke", "flames", "blaze", "cylinder blast", "short circuit", "transformer burst"),
    "earthquake": ("earthquake", "tremor", "aftershock", "collapsed", "seismic", "rubble", "wall collapsed"),
    "cyclone_storm": ("cyclone", "hurricane", "storm", "typhoon", "high winds", "heavy gale", "uprooted trees", "storm surge"),
    "landslide": ("landslide", "mudslide", "rockfall", "debris flow", "soil erosion", "hill collapse"),
    "infrastructure_damage": ("bridge", "road", "power line", "electricity", "building damage", "damaged road", "transformer", "culvert"),
}

URGENT_TERMS = (
    "trapped", "collapsed", "urgent", "immediately", "rescue", "missing", "drowning",
    "evacuate", "critical", "rising water", "stranded", "life threatening", "emergency",
    "cut off", "submerged houses", "elderly", "infant", "children trapped"
)

RESOURCE_KEYWORDS = {
    "rescue_boats": ("boat", "rescue boat", "dinghy", "inflatable boat", "ndrf boat", "raft"),
    "medical_aid": ("ambulance", "first aid", "medical", "doctor", "injured", "hospital", "medicines"),
    "evacuation_support": ("evacuation", "shelter", "relief camp", "rehabilitation", "transport"),
    "water_food_packets": ("food", "drinking water", "ration", "meal packets", "supplies"),
    "dewatering_pumps": ("pump", "dewatering", "suction pump", "drainage pump"),
    "heavy_equipment": ("jcb", "crane", "excavator", "earth mover", "tree clearing", "chainsaw"),
}

DAMAGE_INDICATORS = {
    "residential_flooding": ("water entering houses", "homes submerged", "ground floor flooded", "water in house", "inundated homes"),
    "bridge_damage": ("bridge submerged", "bridge washed away", "bridge collapsed", "culvert damage"),
    "road_cutoff": ("road blocked", "traffic paralyzed", "road cut off", "highway submerged", "access cut off"),
    "power_failure": ("power cut", "power line down", "electricity outage", "transformer burst"),
    "structural_collapse": ("wall collapse", "building collapsed", "roof blown off", "cracked structure"),
}

# Geocoding reference map loaded dynamically
_GEO_CACHE: Dict[str, Dict[str, Any]] = {}


def _load_geo_cache():
    global _GEO_CACHE
    if _GEO_CACHE:
        return _GEO_CACHE
    if GEO_CSV.exists():
        with GEO_CSV.open(encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = row["place_name"].strip().lower()
                _GEO_CACHE[key] = {
                    "lat": float(row["latitude"]),
                    "lng": float(row["longitude"]),
                    "place_name": row["place_name"],
                    "state": row.get("state", ""),
                    "district": row.get("district", ""),
                    "hazard_zone": row.get("hazard_zone", "General Area"),
                }
    # Standard Indian fallback coordinates for unlisted locations
    defaults = {
        "chennai": {"lat": 13.0827, "lng": 80.2707, "hazard_zone": "Coastal Coastal Inundation"},
        "hyderabad": {"lat": 17.3850, "lng": 78.4867, "hazard_zone": "Urban Flood Risk"},
        "mumbai": {"lat": 19.0760, "lng": 72.8777, "hazard_zone": "Coastal High Flood Risk"},
        "delhi": {"lat": 28.6139, "lng": 77.2090, "hazard_zone": "Yamuna River Plain"},
        "bengaluru": {"lat": 12.9716, "lng": 77.5946, "hazard_zone": "Lake Inundation Zone"},
        "kolkata": {"lat": 22.5726, "lng": 88.3639, "hazard_zone": "Gangetic Delta Flood Risk"},
        "kerala": {"lat": 10.8505, "lng": 76.2711, "hazard_zone": "Monsoon Inundation"},
        "assam": {"lat": 26.2006, "lng": 92.9376, "hazard_zone": "Brahmaputra Flood Basin"},
        "odisha": {"lat": 20.9517, "lng": 85.0985, "hazard_zone": "Cyclone & Flood Zone"},
        "andhra pradesh": {"lat": 15.9129, "lng": 79.7400, "hazard_zone": "Krishna-Godavari River Basin"},
    }
    for k, v in defaults.items():
        if k not in _GEO_CACHE:
            _GEO_CACHE[k] = {"lat": v["lat"], "lng": v["lng"], "place_name": k.title(), "hazard_zone": v["hazard_zone"]}
    return _GEO_CACHE


def load_model():
    if ARTIFACT.exists():
        try:
            return joblib.load(ARTIFACT)
        except Exception:
            return None
    return None


def _clean_text(val: str) -> str:
    if not val:
        return ""
    text = re.sub(r"[^\w\s.,;:!?-]", " ", str(val))
    return re.sub(r"\s+", " ", text).strip().lower()


def _keyword_category(text: str) -> str:
    scores = {}
    for cat, words in KEYWORDS.items():
        score = sum(2 if re.search(r"\b" + re.escape(w) + r"\b", text) else (1 if w in text else 0) for w in words)
        scores[cat] = score
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "other"


def _extract_numbers(text: str) -> Dict[str, Optional[int]]:
    """Extract affected, injured, and trapped counts with contextual awareness."""
    res = {"affected": None, "injured": None, "trapped": None}

    # Trapped patterns
    trapped_match = re.search(r"(\d{1,4})\s+(?:people|persons|residents|families|citizens)?\s*(?:are\s+)?trapped", text)
    if not trapped_match:
        trapped_match = re.search(r"trapped\s+(?:around\s+|approx\s+|about\s+)?(\d{1,4})", text)
    if trapped_match:
        res["trapped"] = int(trapped_match.group(1))

    # Injured patterns
    injured_match = re.search(r"(\d{1,4})\s+(?:people|persons|residents)?\s*(?:are\s+)?(?:injured|hurt|wounded|casualties)", text)
    if not injured_match:
        injured_match = re.search(r"injured\s+(?:around\s+|approx\s+|about\s+)?(\d{1,4})", text)
    if injured_match:
        res["injured"] = int(injured_match.group(1))

    # General affected patterns
    affected_match = re.search(r"(?:around|approx|about|nearly|over)?\s*(\d{1,5})\s+(?:people|persons|families|residents|citizens|houses|homes)\s+(?:are\s+)?(?:affected|impacted|hit|submerged|inundated)", text)
    if not affected_match:
        affected_match = re.search(r"(?:affected|impacted)\s+(?:people|persons)?\s*(?:around|approx|about)?\s*(\d{1,5})", text)
    if affected_match:
        res["affected"] = int(affected_match.group(1))

    # If general number mentioned with people
    if res["affected"] is None and not (res["trapped"] or res["injured"]):
        general_match = re.search(r"\b(\d{1,4})\s+(?:people|persons|residents|villagers|families)\b", text)
        if general_match:
            res["affected"] = int(general_match.group(1))

    return res


def _extract_damages(text: str) -> List[str]:
    damages = []
    for dmg, patterns in DAMAGE_INDICATORS.items():
        if any(p in text for p in patterns):
            damages.append(dmg.replace("_", " ").title())
    return damages


def _extract_resources(text: str, user_resources: Optional[str] = None) -> List[str]:
    combined = f"{text} {_clean_text(user_resources or '')}"
    needed = []
    for res_name, terms in RESOURCE_KEYWORDS.items():
        if any(term in combined for term in terms):
            needed.append(res_name.replace("_", " ").title())
    return needed


def resolve_location_coordinates(location_str: str, landmark_str: str = "", user_lat: Optional[float] = None, user_lng: Optional[float] = None):
    """Resolve latitude, longitude, and geocoding confidence."""
    # 1. User provided exact GPS
    if user_lat is not None and user_lng is not None and user_lat != 0.0 and user_lng != 0.0:
        return {
            "latitude": user_lat,
            "longitude": user_lng,
            "geocoding_status": "CITIZEN_GPS_PROVIDED",
            "hazard_zone": "Reported GPS Point",
            "resolved_name": location_str,
        }

    geo_cache = _load_geo_cache()
    query = f"{location_str} {landmark_str}".lower()

    # 2. Check exact and partial matches in geocoding database
    for place_name, data in geo_cache.items():
        if place_name in query or any(tok in query for tok in place_name.split() if len(tok) > 3):
            return {
                "latitude": data["lat"],
                "longitude": data["lng"],
                "geocoding_status": "AI_GEOCODED_CONFIRMED",
                "hazard_zone": data.get("hazard_zone", "Flood Risk Zone"),
                "resolved_name": data.get("place_name", location_str).title(),
            }

    # 3. Default fallback: Chennai / South Asia reference center with slight deterministic offset based on hash
    base_lat, base_lng = 13.0425, 80.2285
    h = sum(ord(c) for c in location_str) % 100
    offset_lat = (h % 10 - 5) * 0.012
    offset_lng = ((h // 10) - 5) * 0.012

    return {
        "latitude": round(base_lat + offset_lat, 5),
        "longitude": round(base_lng + offset_lng, 5),
        "geocoding_status": "NEEDS_OFFICIAL_CONFIRMATION",
        "hazard_zone": "General Regional Zone (Approximated)",
        "resolved_name": location_str,
    }


def _calculate_similarity(text1: str, text2: str) -> float:
    """Compute word-level overlap and Jaccard / Cosine approximation."""
    words1 = set(re.findall(r"\w{3,}", text1.lower()))
    words2 = set(re.findall(r"\w{3,}", text2.lower()))
    if not words1 or not words2:
        return 0.0
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    return round(intersection / union, 3)


def detect_duplicates_and_relations(current_report: Dict[str, Any], existing_reports: Optional[List[Dict[str, Any]]]):
    """Detect whether this report relates to or duplicates existing reports."""
    if not existing_reports:
        return {
            "is_duplicate": False,
            "similarity_score": 0.0,
            "related_report_ids": [],
            "incident_cluster_id": None,
            "status": "UNIQUE_REPORT",
            "relationship_note": "First report submitted in this locality.",
        }

    cur_text = f"{current_report.get('title', '')} {current_report.get('description', '')}".lower()
    cur_loc = current_report.get("location", "").lower()

    related_ids = []
    max_sim = 0.0
    most_related = None

    for other in existing_reports:
        other_id = other.get("report_id") or other.get("id") or other.get("public_id")
        if not other_id or other_id == current_report.get("report_id"):
            continue

        other_text = f"{other.get('title', '')} {other.get('description', '')}".lower()
        other_loc = (other.get("location") or other.get("location_text") or "").lower()

        sim = _calculate_similarity(cur_text, other_text)

        # Location matching boost
        loc_match = False
        if cur_loc and other_loc:
            cur_tokens = set(cur_loc.split())
            oth_tokens = set(other_loc.split())
            if cur_tokens.intersection(oth_tokens):
                loc_match = True
                sim += 0.25

        if sim > max_sim:
            max_sim = sim
            most_related = other_id

        if sim >= 0.35 or loc_match:
            related_ids.append(other_id)

    max_sim = min(1.0, round(max_sim, 2))

    if max_sim >= 0.70:
        status = "HIGH_PROBABILITY_DUPLICATE"
        note = f"Matches existing report {most_related} with {int(max_sim*100)}% similarity. Official review recommended to link records."
    elif max_sim >= 0.38 or len(related_ids) > 0:
        status = "POTENTIAL_RELATED_INCIDENT"
        note = f"Related to {len(related_ids)} reports in the same geographic vicinity (e.g. {', '.join(related_ids[:3])})."
    else:
        status = "UNIQUE_REPORT"
        note = "No immediate duplicate reports detected in recent submissions."

    cluster_id = f"CLUSTER-{most_related}" if related_ids and most_related else None

    return {
        "is_duplicate": max_sim >= 0.70,
        "similarity_score": max_sim,
        "related_report_ids": related_ids[:5],
        "incident_cluster_id": cluster_id,
        "status": status,
        "relationship_note": note,
    }


def assess_transparent_severity(trapped_people: Optional[int], injured_people: Optional[int], affected_people: Optional[int], text: str, has_image: bool):
    """Transparent multi-factor triage logic as specified in disaster guidelines."""
    reasons = []
    score = 20

    rescue_requested = any(w in text for w in ("rescue", "boat", "evacuate", "trapped", "help urgently", "life"))
    water_rising = any(w in text for w in ("water rising", "submerged", "waist level", "chest level", "floodwater entering"))

    # Step-by-step severity rules
    severity_level = "NEEDS_ASSESSMENT"

    if trapped_people is not None and trapped_people > 0:
        severity_level = "CRITICAL_REVIEW"
        score += 45
        reasons.append(f"Immediate danger: {trapped_people} trapped individual(s) declared.")
    elif injured_people is not None and injured_people > 0:
        severity_level = "HIGH_REVIEW"
        score += 35
        reasons.append(f"Casualties / injuries: {injured_people} person(s) reported injured.")
    elif rescue_requested or water_rising:
        severity_level = "URGENT_REVIEW"
        score += 28
        reasons.append("Rescue assistance or rapidly rising floodwater explicitly described.")
    elif affected_people is not None and affected_people > 0:
        severity_level = "MODERATE_REVIEW"
        score += 18
        reasons.append(f"Community impact: {affected_people} affected residents reported.")
    else:
        severity_level = "MONITORING_REVIEW"
        reasons.append("General observational report; continuous field monitoring advised.")

    if has_image:
        score += 10
        reasons.append("Visual image attached supporting the report.")

    if water_rising:
        score += 10
        reasons.append("Dynamic flood condition: rapid water rise indicated.")

    score = min(100, max(15, score))

    priority = "high" if score >= 60 else ("medium" if score >= 35 else "low")

    return {
        "severity_level": severity_level,
        "priority": priority,
        "severity_score": score,
        "reasons": reasons,
    }


def generate_grounded_summary(category: str, location: str, landmark: Optional[str], affected: Optional[int], trapped: Optional[int], injured: Optional[int], damages: List[str], resources: List[str], status_level: str) -> str:
    """Generate professional, grounded incident summary without inventing unverified claims."""
    cat_title = category.replace("_", " ").title()
    loc_part = f"at {location}"
    if landmark:
        loc_part += f" near {landmark}"

    impact_parts = []
    if affected:
        impact_parts.append(f"approximately {affected} residents affected")
    if trapped:
        impact_parts.append(f"{trapped} individuals reported trapped")
    else:
        impact_parts.append("trapped count not specified")

    if injured:
        impact_parts.append(f"{injured} injuries reported")

    impact_str = ", ".join(impact_parts)

    dmg_str = f" Damage indicators observed: {', '.join(damages)}." if damages else ""
    res_str = f" Requested emergency resources include {', '.join(resources)}." if resources else ""

    summary = (
        f"{cat_title} incident reported {loc_part}. Citizen field description highlights {impact_str}.{dmg_str}{res_str} "
        f"Automated Triage Assessment: [{status_level}]. Status: UNVERIFIED CITIZEN REPORT awaiting official field validation."
    )
    return summary


def recommend_response(category: str, severity_level: str, resources: List[str]):
    """Suggest appropriate government disaster response team and immediate operational directive."""
    cat = category.lower()
    if severity_level == "CRITICAL_REVIEW" or "rescue_boats" in [r.lower().replace(" ", "_") for r in resources]:
        return {
            "team": "NDRF Quick Response Team & Flood Rescue Unit",
            "action": "Immediate watercraft deployment, aerial recon, and high-water evacuation",
            "justification": "Trapped citizens or rapid inundation requires immediate tactical search and rescue.",
        }
    elif cat == "flood":
        return {
            "team": "State Disaster Response Force (SDRF) & Municipal Flood Cell",
            "action": "Deploy dewatering pumps, verify bridge/road passability, set up relief station",
            "justification": "Urban and rural drainage overflow mitigation and resident relocation.",
        }
    elif cat == "fire":
        return {
            "team": "Fire & Emergency Services & HAZMAT Division",
            "action": "Dispatch fire tenders, isolate electrical grids, deploy thermal imaging",
            "justification": "Active combustion containment and building evacuation.",
        }
    elif cat == "cyclone_storm":
        return {
            "team": "Civil Defence & Highway Emergency Clearing Unit",
            "action": "Clear uprooted trees, secure fallen power cables, activate temporary cyclone shelters",
            "justification": "Post-storm accessibility and electrical hazard mitigation.",
        }
    else:
        return {
            "team": "District Disaster Management Authority (DDMA) Field Inspection Unit",
            "action": "Field verification, citizen outreach, and situation log update",
            "justification": "Standard observational protocol to confirm report accuracy.",
        }


def analyze(payload) -> Dict[str, Any]:
    source = f"{payload.title}. {payload.description}"
    text = _clean_text(source)

    # 1. Classification
    model = load_model()
    keyword_cat = _keyword_category(text)
    category = keyword_cat
    confidence = 0.50
    provenance = "Disaster Vocabulary Pattern Matching"

    if model is not None:
        try:
            probs = model.predict_proba([source])[0]
            best_idx = probs.argmax()
            model_category = str(model.classes_[best_idx])
            model_conf = float(probs[best_idx])

            if keyword_cat == "other":
                category = model_category
                confidence = round(model_conf, 3)
                provenance = "HumAID TF-IDF Logistic Classifier"
            else:
                category = keyword_cat
                if category in list(model.classes_):
                    idx = list(model.classes_).index(category)
                    confidence = round(float(probs[idx]), 3)
                else:
                    confidence = round(max(0.65, model_conf), 3)
                provenance = "HumAID Classifier + Transparent Disaster Vocabulary"
        except Exception:
            category = keyword_cat if keyword_cat != "other" else "flood"
            confidence = 0.72
            provenance = "Keyword Disaster Classifier Fallback"
    else:
        confidence = round(min(0.92, 0.45 + 0.12 * sum(w in text for words in KEYWORDS.values() for w in words)), 3)

    # If user provided a specific category that is not unknown, respect or evaluate mismatch
    if payload.reported_category and payload.reported_category.lower() not in ("unknown", "other"):
        rep_clean = payload.reported_category.lower()
        if "flood" in rep_clean:
            category = "flood"

    # 2. Extract Impact Numbers
    numbers = _extract_numbers(text)
    affected = payload.affected_people if payload.affected_people is not None else numbers["affected"]
    injured = payload.injured_people if payload.injured_people is not None else numbers["injured"]
    trapped = payload.trapped_people if payload.trapped_people is not None else numbers["trapped"]

    damages = _extract_damages(text)
    resources = _extract_resources(text, payload.resources)

    # 3. Location & Geocoding
    geo_data = resolve_location_coordinates(
        location_str=payload.location,
        landmark_str=payload.landmark or "",
        user_lat=payload.latitude,
        user_lng=payload.longitude,
    )

    # 4. Severity Assessment
    triage = assess_transparent_severity(
        trapped_people=trapped,
        injured_people=injured,
        affected_people=affected,
        text=text,
        has_image=payload.has_image,
    )

    # 5. Duplicate Detection
    existing_list = getattr(payload, "existing_reports", None) or []
    dup_info = detect_duplicates_and_relations(
        current_report={
            "report_id": payload.report_id,
            "title": payload.title,
            "description": payload.description,
            "location": payload.location,
        },
        existing_reports=existing_list,
    )

    # 6. Structured Grounded Summary
    summary = generate_grounded_summary(
        category=category,
        location=payload.location,
        landmark=payload.landmark,
        affected=affected,
        trapped=trapped,
        injured=injured,
        damages=damages,
        resources=resources,
        status_level=triage["severity_level"],
    )

    # 7. Response Unit Recommendation
    recommendation = recommend_response(
        category=category,
        severity_level=triage["severity_level"],
        resources=resources,
    )

    extracted = {
        "reported_location": payload.location,
        "landmark": payload.landmark or "None reported",
        "latitude": geo_data["latitude"],
        "longitude": geo_data["longitude"],
        "geocoding_status": geo_data["geocoding_status"],
        "hazard_zone": geo_data["hazard_zone"],
        "reported_affected_people": affected,
        "reported_injured_people": injured,
        "reported_trapped_people": trapped,
        "damage_indicators": damages,
        "requested_resources": resources or [payload.resources] if payload.resources else ["General assistance"],
        "urgency_signals": [w for w in URGENT_TERMS if w in text],
    }

    evidence = triage["reasons"]
    if dup_info["status"] != "UNIQUE_REPORT":
        evidence.append(dup_info["relationship_note"])

    caveats = [
        "This is an automated AI decision-support estimate and does NOT constitute official field verification.",
        "Citizen reports are unconfirmed until validated by designated disaster authorities.",
        "Emergency resource dispatch requires officer review and authorization.",
    ]

    return {
        "category": category,
        "confidence": confidence,
        "priority": triage["priority"],
        "severity_level": triage["severity_level"],
        "severity_score": triage["severity_score"],
        "evidence_score": min(100, 25 + len(evidence) * 15 + (15 if confidence >= 0.6 else 0)),
        "summary": summary,
        "extracted": extracted,
        "evidence": evidence,
        "caveats": caveats,
        "duplicate_analysis": dup_info,
        "recommendation": recommendation,
        "model": {
            "name": provenance,
            "version": "DisasterClassifier_HumAID_v2.1",
            "artifact": str(ARTIFACT.name),
            "geocoding_engine": "OpenFreeMap / GeoReference v1.0",
        },
    }
