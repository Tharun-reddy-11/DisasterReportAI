# Implemented workflow

1. A citizen or volunteer registers through the React portal. The Spring API hashes the password with BCrypt and returns a signed short-lived JWT.
2. The user submits a text-first field report with optional impact details and attachment indicators. The original submission is retained in the API database before any ML request is attempted.
3. The API calls FastAPI's `/api/v1/analyze`. The service runs the locally trained HumAID classifier and transparent urgency/evidence extraction.
4. The API stores category, confidence, evidence, caveats and the summary apart from the original report, then returns a review-recommended status.
5. Dashboard cards and distributions are computed from the authenticated user's persisted reports, not hard-coded changing values.

If the ML service is down, the API keeps the report in `ANALYSIS_PENDING` rather than fabricating an analysis. Audio and image file selection is represented in this baseline; secure multipart storage and Whisper/vision workers are intentionally the next integration step, not claimed as completed inference.
