# Optional Reflex optimizer

The main app does not depend on this process. Start it only after installing
the optional dependencies:

```powershell
python -m pip install -r optimizer/requirements.txt
$env:REFLEX_OPTIMIZER_ENABLED = "true"
npm run dev
```

The TypeScript allocator invokes `service.py --once` for each decision. This
keeps the integration process-safe and preserves the current API contracts.
The model is loaded for each invocation; for production throughput, run the
HTTP service and replace the process adapter with a long-lived client.

The service exposes:

- `POST /optimize` — MiniLM cosine skill matching, normalized weighted ranking,
  and `scipy.optimize.linear_sum_assignment`.
- `POST /reallocate` — event impact-set optimization; unaffected allocations
  are returned as fixed and excluded from the assignment matrix.
- `POST /skill-gaps` — frequency × rarity shortage scoring.

The TypeScript allocator remains the safe default so a missing Python runtime,
model download, or dependency cannot prevent the existing app from starting.
