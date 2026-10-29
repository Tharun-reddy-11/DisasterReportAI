# ML service

This service exposes `POST /api/v1/analyze` and trains on local HumAID `*_train.tsv` data. It does not download a remote model or fabricate confidence values. Before initial inference, train an artifact:

```powershell
& 'C:\Users\Tharu\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' training/train.py
```

Without the artifact, it returns clearly labelled transparent keyword fallback results so the intake workflow remains operational. The API health response exposes whether the trained model is active.
