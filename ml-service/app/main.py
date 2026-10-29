from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .schemas import AnalysisRequest, Prediction, DuplicateCheckRequest
from .analysis import analyze, load_model, _load_geo_cache, detect_duplicates_and_relations

app = FastAPI(title="DisasterReportAI ML Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "DisasterReportAI ML Service",
        "model_ready": load_model() is not None,
        "geocoding_ready": len(_load_geo_cache()) > 0,
    }

@app.post("/api/v1/analyze", response_model=Prediction)
def analyse_report(request: AnalysisRequest):
    return analyze(request)

@app.post("/api/v1/cluster")
def cluster_reports(request: DuplicateCheckRequest):
    reports = request.reports
    clusters = []
    processed = set()
    for i, r in enumerate(reports):
        rid = r.get("id") or r.get("public_id")
        if rid in processed:
            continue
        group = [rid]
        processed.add(rid)
        for j, other in enumerate(reports):
            oid = other.get("id") or other.get("public_id")
            if oid in processed:
                continue
            dup_res = detect_duplicates_and_relations(r, [other])
            if dup_res.get("similarity_score", 0) >= 0.35:
                group.append(oid)
                processed.add(oid)
        clusters.append({
            "primary_report_id": rid,
            "report_count": len(group),
            "linked_report_ids": group,
            "suggested_incident_code": f"INC-2026-{1000 + len(clusters)}",
        })
    return {"total_clusters": len(clusters), "clusters": clusters}

@app.get("/api/v1/locations")
def list_reference_locations():
    cache = _load_geo_cache()
    return {"total": len(cache), "locations": list(cache.values())}
