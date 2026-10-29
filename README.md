# DisasterReportAI

An end-to-end intelligent decision-support and disaster report management system. Citizens submit field observations with impact details and location; ML models preprocess, classify, extract structured metrics, geocode coordinates, and cluster duplicate reports; and government disaster officials manage emergency triage through an interactive live command dashboard.

## System Architecture

- `frontend/` — React + Vite command center with OpenStreetMap live GIS, Recharts visual analytics, government official triage console, citizen 5-step status tracking, and command room imagery gallery.
- `backend/` — Spring Boot 3.5.6 API with JWT role-based security (`ROLE_AUTHORITY`, `ROLE_CITIZEN`, `ROLE_VOLUNTEER`), MySQL persistence (`disasterreport`), incident clustering, and ML orchestration.
- `ml-service/` — FastAPI service powered by HumAID disaster datasets (53,531 records), scikit-learn TF-IDF classifier, transparent urgency rule engine, regex entity extraction, duplicate correlation, and grounded incident summarization.
- `datasets/` — Raw and processed training corpuses, including `disaster_text_training.csv`, `location_geocoding_reference.csv`, `priority_signal_rules.csv`, and `response_resource_reference.csv`.

## Workflow Overview

1. **Citizen Field Report Submission**: Citizen enters incident details, location, landmark, affected/trapped/injured counts, and requests resources.
2. **Backend Persistence**: Spring Boot creates a unique tracking ID (e.g. `RPT-1042`), validates input, and stores the original text in MySQL.
3. **ML Preprocessing & Classification**: FastAPI normalizes text and classifies disaster hazard using HumAID-trained models.
4. **Information Extraction**: Contextual NLP identifies trapped counts, casualties, damages, and requested aid.
5. **Geocoding & Map Placement**: Resolves place names and landmarks to precise latitude and longitude coordinates.
6. **Duplicate & Related Report Clustering**: Cosine similarity and geographic radius identify related reports and group them into incident clusters (e.g. `INC-2026-001`).
7. **Transparent Urgency Scoring**: Multi-factor scoring derives `CRITICAL_REVIEW`, `HIGH_REVIEW`, `URGENT_REVIEW`, or `MODERATE_REVIEW`.
8. **Grounded AI Synthesis**: Executive summary highlights verified versus unverified claims without hallucinating missing facts.
9. **Government Officials Command Center**: Officials visualize incidents on live OpenStreetMap, inspect Recharts distribution graphs, review incoming reports, and dispatch emergency response units (NDRF, SDRF, Fire Services).
10. **Citizen Status Tracker**: Citizen monitors real-time response actions and official remarks through an interactive 5-stage progress stepper.

## Quick Start

See `PROJECT_SETUP.md` for complete terminal execution commands, database configurations, and pre-seeded official credentials (`official@disaster.gov.in` / `Official@2026`).

## Safety & Governance Note

This platform provides automated decision support and prioritization intelligence for emergency authorities. Automated predictions and priority scores do not constitute official on-the-ground verification until validated by authorized disaster management officials.
