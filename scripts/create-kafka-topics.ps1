# PowerShell script to create all Kafka topics for car rental platform
# Usage: .\scripts\create-kafka-topics.ps1

$KAFKA_CONTAINER = "car-rental-kafka"
$BOOTSTRAP_SERVER = "localhost:9092"

Write-Host "🚀 Creating Kafka topics for Car Rental Platform..." -ForegroundColor Cyan

# Check if Kafka container is running
$containerRunning = docker ps --filter "name=$KAFKA_CONTAINER" --format "{{.Names}}"
if (-not $containerRunning) {
    Write-Host "❌ Error: Kafka container ($KAFKA_CONTAINER) is not running" -ForegroundColor Red
    Write-Host "   Please start it with: docker-compose up -d kafka" -ForegroundColor Yellow
    exit 1
}

# Function to create topic
function Create-Topic {
    param(
        [string]$Topic,
        [int]$Partitions,
        [int]$Replication
    )
    
    Write-Host "📝 Creating topic: $Topic (partitions: $Partitions, replication: $Replication)" -ForegroundColor Yellow
    
    docker exec $KAFKA_CONTAINER kafka-topics `
        --create `
        --bootstrap-server $BOOTSTRAP_SERVER `
        --topic $Topic `
        --partitions $Partitions `
        --replication-factor $Replication `
        --if-not-exists
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Topic $Topic created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create topic $Topic" -ForegroundColor Red
    }
}

# User Events (3 partitions)
Create-Topic "user.created" 3 1
Create-Topic "user.verified" 3 1
Create-Topic "user.updated" 3 1

# Car Events (3 partitions)
Create-Topic "car.created" 3 1
Create-Topic "car.updated" 3 1
Create-Topic "car.deleted" 3 1

# Rental Events (6 partitions - high volume)
Create-Topic "rental.created" 6 1
Create-Topic "rental.confirmed" 6 1
Create-Topic "rental.rejected" 6 1
Create-Topic "rental.cancelled" 6 1
Create-Topic "rental.check-in" 6 1
Create-Topic "rental.check-out" 6 1
Create-Topic "rental.completed" 6 1

# Payment Events (6 partitions - high volume)
Create-Topic "payment.processed" 6 1
Create-Topic "payment.failed" 6 1
Create-Topic "payout.scheduled" 6 1
Create-Topic "payout.completed" 6 1

# Review Events (3 partitions)
Create-Topic "review.created" 3 1

# Notification Events (3 partitions)
Create-Topic "notification.send" 3 1

Write-Host ""
Write-Host "✨ All topics created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Listing all topics:" -ForegroundColor Cyan
docker exec $KAFKA_CONTAINER kafka-topics --list --bootstrap-server $BOOTSTRAP_SERVER

