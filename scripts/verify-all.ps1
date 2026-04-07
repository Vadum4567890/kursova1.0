$ErrorActionPreference = "Stop"

powershell -ExecutionPolicy Bypass -File ./scripts/verify-backend.ps1
if ($LASTEXITCODE -ne 0) {
  throw "Backend verification failed"
}

npm --prefix frontend run build
if ($LASTEXITCODE -ne 0) {
  throw "Frontend verification failed"
}

Write-Host ""
Write-Host "Workspace verification completed successfully."
