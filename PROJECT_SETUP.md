# DisasterReportAI — Full-Stack Real-Time ML System Setup

## System Architecture

1. **Python ML & NLP Service (`ml-service/`)**:
   - FastAPI service running on `http://localhost:8000`.
   - Disaster classification model trained on 53,531 HumAID disaster records.
   - Information extraction for victim counts (trapped, injured, affected), damages, resources, landmarks.
   - Open Free Map geocoding engine with coordinates reference (`datasets/processed/location_geocoding_reference.csv`).
   - Duplicate & related incident detection using TF-IDF cosine similarity.
   - Transparent, explainable severity assessment engine (`CRITICAL_REVIEW`, `HIGH_REVIEW`, `URGENT_REVIEW`, `MODERATE_REVIEW`).
   - Grounded incident summary generator preserving fact vs. uncertainty.

2. **Spring Boot Backend (`backend/`)**:
   - Java 21 + Spring Boot 3.5.6 running on `http://localhost:8080`.
   - Spring Security with JWT token authentication and role-based access control (`ROLE_AUTHORITY`, `ROLE_CITIZEN`, `ROLE_VOLUNTEER`).
   - MySQL 8.0 database integration with JPA / Hibernate (`disasterreport` database).
   - Official Disaster Control Room APIs (`/api/official/**`) for statistics, telemetry, analytics, and action orders.
   - Citizen field report management APIs (`/api/reports/**`).

3. **React Modern Frontend (`frontend/`)**:
   - React + Vite running on `http://localhost:5173`.
   - **National Command Center Admin Dashboard** (`OfficialDashboard.jsx`) for government disaster officials.
   - **Interactive Live Map** (`LeafletMap.jsx`) using OpenStreetMap free tiles, color-coded severity markers, and popup triage controls.
   - **Visual Charts** (Recharts): Pie chart (category distribution), Bar chart (urgency triage), Area chart (reports timeline trend).
   - **Citizen Field Reporting Workspace** with live 5-step lifecycle tracker (`Submitted` → `AI Analyzed` → `Officer Review` → `Team Dispatched` → `Resolved`).
   - **Hero & Command Gallery** showcasing national emergency operations rooms using the provided high-resolution command facility imagery.

---

## Pre-Configured Test Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Disaster Official / Commander** | `official@disaster.gov.in` | `Official@2026` | National Disaster Command Center, Incident Review, Dispatch |
| **Citizen / Field Reporter** | `btharunreddy26@gmail.com` | `Tharun@1126` | Field Report Submission, 5-Step Status Tracker |

*(Quick 1-click test buttons for both roles are also built directly into the login screen.)*

---

## Quick Start (3 Terminals)

### Terminal 1 — Python ML Service

```powershell
$python = 'C:\Users\Tharu\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
Set-Location D:\Projects\DisasterReportAI\ml-service
& $python -m pip install -r requirements.txt
& $python .\training\prepare_datasets.py
& $python .\training\enrich_datasets.py
& $python .\training\train.py
& $python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Verify ML Health:
`http://localhost:8000/health` → `{"status":"ok","model_ready":true,"geocoding_ready":true}`

---

### Terminal 2 — Spring Boot Backend

```powershell
Set-Location D:\Projects\DisasterReportAI\backend
mvn spring-boot:run
```

The application connects to MySQL on `127.0.0.1:3306` (`disasterreport` database) using credentials from `backend/src/main/resources/application.yml`.
On initial startup, it automatically provisions the `official@disaster.gov.in` authority account and creates baseline disaster reports (including the Ramakrishnapuram bridge flood example).

Verify API Health:
`http://localhost:8080/api/health` → `{"status":"UP"}`

---

### Terminal 3 — React Frontend

```powershell
Set-Location D:\Projects\DisasterReportAI\frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Verifying the End-to-End Workflow

1. **Visit Landing Page (`http://localhost:5173`)**:
   - Inspect the National Command Center gallery featuring the NDMA War Room, State Emergency Operation Center, Disaster Monitoring Wall, and Tactical Flood Rescue Boat images.
2. **Access Government Official Dashboard**:
   - Click **"Official Portal"** on the top navigation.
   - Click the **"Official Commander"** quick-login button, then click **Sign in**.
   - Review live KPI cards, interactive Leaflet OpenStreetMap with flood pins, Recharts pie and bar graphs, and the high-urgency triage feed.
3. **Inspect the Ramakrishnapuram Incident**:
   - In the map or reports table, click **"Review Incident"** on `RPT-1042` or `INC-2026-001`.
   - Review side-by-side: original citizen description vs AI extracted victims and geocoding vs official directives console.
   - Select an assigned battalion (e.g. `NDRF 4th Battalion Flood Cell`), type official instructions, and click **"Submit Official Action"**.
4. **Switch to Citizen View**:
   - Click **"Citizen View"** on the top header.
   - Go to **"My Reports & Tracking"**.
   - Observe that `RPT-1042` updates to **"Action Dispatched"** or **"Resolved"**, with the assigned battalion and official remarks visible in real time.
5. **Submit a New Citizen Report**:
   - Go to **"Submit Report"**. Click **"Load Ramakrishnapuram Flood Example"** or enter any location.
   - Click **"Submit field report"**.
   - Spring Boot persists the report in MySQL, invokes the Python ML service, extracts impacts, geocodes coordinates, runs duplicate detection, and routes it to the official dashboard.
