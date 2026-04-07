$ErrorActionPreference = "Stop"

$services = @(
  @{ Name = "api-gateway"; Path = "services/api-gateway"; Build = $true; Test = $true },
  @{ Name = "user-service"; Path = "services/user-service"; Build = $true; Test = $true },
  @{ Name = "car-service"; Path = "services/car-service"; Build = $true; Test = $true },
  @{ Name = "rental-service"; Path = "services/rental-service"; Build = $true; Test = $true },
  @{ Name = "reporting-service"; Path = "services/reporting-service"; Build = $true; Test = $true },
  @{ Name = "media-service"; Path = "services/media-service"; Build = $true; Test = $true }
)

foreach ($service in $services) {
  Write-Host ""
  Write-Host "=== $($service.Name) ==="

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
Write-Host "Backend verification completed successfully for the active runtime topology."
