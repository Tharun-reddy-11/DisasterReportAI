# Spring Boot API

The API provides secure registration/login, JWT-guarded personal report history, validation, persistent storage, and synchronous orchestration of the local FastAPI ML service.

`POST /api/reports` preserves a report even if ML analysis is unavailable. Status then remains `ANALYSIS_PENDING`; otherwise it becomes `REVIEW_RECOMMENDED`. This language is intentional: model output does not verify events.
