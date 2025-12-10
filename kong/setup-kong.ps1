# PowerShell script to configure Kong Gateway with all services
# Usage: .\kong\setup-kong.ps1

$KONG_ADMIN_URL = "http://localhost:8001"

Write-Host "🚀 Configuring Kong Gateway..." -ForegroundColor Cyan

# Check if Kong is running
try {
    $response = Invoke-WebRequest -Uri $KONG_ADMIN_URL -Method Get -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Kong Admin API is accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Kong Admin API is not accessible at $KONG_ADMIN_URL" -ForegroundColor Red
    Write-Host "   Please make sure Kong is running: docker-compose up -d kong" -ForegroundColor Yellow
    exit 1
}

# Function to create service and route
function Create-Service {
    param(
        [string]$ServiceName,
        [string]$ServiceUrl,
        [string]$RoutePath,
        [int]$RateLimitMin,
        [int]$RateLimitHour
    )

    Write-Host "📝 Creating service: $ServiceName" -ForegroundColor Yellow

    # Create service
    try {
        $body = @{
            name = $ServiceName
            url = $ServiceUrl
        }
        Invoke-WebRequest -Uri "$KONG_ADMIN_URL/services/" -Method Post -Body $body -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  ✅ Service created" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Service might already exist" -ForegroundColor Yellow
    }

    # Create route
    try {
        $body = @{
            paths = @($RoutePath)
            strip_path = "false"
        }
        Invoke-WebRequest -Uri "$KONG_ADMIN_URL/services/$ServiceName/routes" -Method Post -Body $body -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  ✅ Route created" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Route might already exist" -ForegroundColor Yellow
    }

    # Add rate limiting
    try {
        $body = @{
            name = "rate-limiting"
            config = @{
                minute = $RateLimitMin
                hour = $RateLimitHour
                policy = "local"
            }
        }
        $jsonBody = ($body | ConvertTo-Json -Depth 3)
        Invoke-WebRequest -Uri "$KONG_ADMIN_URL/services/$ServiceName/plugins" -Method Post -Body $jsonBody -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  ✅ Rate limiting configured" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Rate limiting might already exist" -ForegroundColor Yellow
    }

    # Add CORS
    try {
        $body = @{
            name = "cors"
            config = @{
                origins = @("http://localhost:3000", "http://localhost:3001")
                methods = @("GET", "POST", "PUT", "DELETE", "OPTIONS")
                credentials = "true"
                max_age = 3600
            }
        }
        $jsonBody = ($body | ConvertTo-Json -Depth 3)
        Invoke-WebRequest -Uri "$KONG_ADMIN_URL/services/$ServiceName/plugins" -Method Post -Body $jsonBody -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  ✅ CORS configured" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  CORS might already exist" -ForegroundColor Yellow
    }

    Write-Host ""
}

# Create all services
Create-Service "user-service" "http://user-service:3001" "/api/users" 100 1000
Create-Service "car-service" "http://car-service:3002" "/api/cars" 100 1000
Create-Service "rental-service" "http://rental-service:3003" "/api/rentals" 100 1000
Create-Service "payment-service" "http://payment-service:3004" "/api/payments" 50 500
Create-Service "analytics-service" "http://analytics-service:3005" "/api/analytics" 60 600
Create-Service "chat-service" "http://chat-service:3006" "/api/chat" 200 2000
Create-Service "notification-service" "http://notification-service:3007" "/api/notifications" 100 1000
Create-Service "review-service" "http://review-service:3008" "/api/reviews" 100 1000
Create-Service "report-service" "http://report-service:3009" "/api/reports" 30 300
Create-Service "support-service" "http://support-service:3011" "/api/support" 100 1000

Write-Host "✨ Kong Gateway configuration completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 List all services:" -ForegroundColor Cyan
try {
    $services = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/services" -Method Get
    $services.data | ForEach-Object { Write-Host "  - $($_.name)" }
} catch {
    Write-Host "  Could not retrieve services list" -ForegroundColor Yellow
}

