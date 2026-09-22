curl -X POST http://localhost:3000/api/system_errors \
-H "Content-Type: application/json" \
-d '{
  "signature": "test_err_123",
  "service": "firestore",
  "module": "api:users",
  "errorMessage": "PERMISSION_DENIED: Missing permissions",
  "severity": "critical",
  "status": "new",
  "occurrences": 1,
  "firstSeen": "2026-09-14T10:00:00Z",
  "lastSeen": "2026-09-14T10:00:00Z"
}'
