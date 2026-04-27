$ErrorActionPreference = "Stop"

$services = @(
  @{ Name = "client-service"; Path = "services/client-service"; Build = $true; Test = $true },
  @{ Name = "search-service"; Path = "services/search-service"; Build = $true; Test = $true }
)

foreach ($service in $services) {
  Write-Host ""
  Write-Host "=== $($service.Name) (legacy) ==="

  if ($service.Build) {
    npm --prefix $service.Path run build
    if ($LASTEXITCODE -ne 0) {
      throw "Build failed for $($service.Name)"
    }
  }

  if ($service.Test) {
    npm --prefix $service.Path test -- --runInBand
    if ($LASTEXITCODE -ne 0) {
      throw "Tests failed for $($service.Name)"
    }
  }
}

Write-Host ""
Write-Host "Legacy service verification completed successfully."
