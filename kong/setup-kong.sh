#!/bin/bash

# Script to configure Kong Gateway with all services
# Usage: ./kong/setup-kong.sh

KONG_ADMIN_URL="http://localhost:8001"

echo "🚀 Configuring Kong Gateway..."

# Check if Kong is running
if ! curl -s $KONG_ADMIN_URL > /dev/null; then
    echo "❌ Error: Kong Admin API is not accessible at $KONG_ADMIN_URL"
    echo "   Please make sure Kong is running: docker-compose up -d kong"
    exit 1
fi

echo "✅ Kong Admin API is accessible"

# Function to create service and route
create_service() {
    local service_name=$1
    local service_url=$2
    local route_path=$3
    local rate_limit_min=$4
    local rate_limit_hour=$5

    echo "📝 Creating service: $service_name"

    # Create service
    curl -s -X POST $KONG_ADMIN_URL/services/ \
        --data "name=$service_name" \
        --data "url=$service_url" > /dev/null

    if [ $? -eq 0 ]; then
        echo "  ✅ Service created"
    else
        echo "  ⚠️  Service might already exist"
    fi

    # Create route
    curl -s -X POST $KONG_ADMIN_URL/services/$service_name/routes \
        --data "paths[]=$route_path" \
        --data "strip_path=false" > /dev/null

    if [ $? -eq 0 ]; then
        echo "  ✅ Route created"
    else
        echo "  ⚠️  Route might already exist"
    fi

    # Add rate limiting
    curl -s -X POST $KONG_ADMIN_URL/services/$service_name/plugins \
        --data "name=rate-limiting" \
        --data "config.minute=$rate_limit_min" \
        --data "config.hour=$rate_limit_hour" \
        --data "config.policy=local" > /dev/null

    if [ $? -eq 0 ]; then
        echo "  ✅ Rate limiting configured"
    fi

    # Add CORS
    curl -s -X POST $KONG_ADMIN_URL/services/$service_name/plugins \
        --data "name=cors" \
        --data "config.origins[]=http://localhost:3000" \
        --data "config.origins[]=http://localhost:3001" \
        --data "config.methods[]=GET" \
        --data "config.methods[]=POST" \
        --data "config.methods[]=PUT" \
        --data "config.methods[]=DELETE" \
        --data "config.methods[]=OPTIONS" \
        --data "config.credentials=true" \
        --data "config.max_age=3600" > /dev/null

    if [ $? -eq 0 ]; then
        echo "  ✅ CORS configured"
    fi

    echo ""
}

# Create all services
create_service "user-service" "http://user-service:3001" "/api/users" 100 1000
create_service "car-service" "http://car-service:3002" "/api/cars" 100 1000
create_service "rental-service" "http://rental-service:3003" "/api/rentals" 100 1000
create_service "payment-service" "http://payment-service:3004" "/api/payments" 50 500
create_service "analytics-service" "http://analytics-service:3005" "/api/analytics" 60 600
create_service "chat-service" "http://chat-service:3006" "/api/chat" 200 2000
create_service "notification-service" "http://notification-service:3007" "/api/notifications" 100 1000
create_service "review-service" "http://review-service:3008" "/api/reviews" 100 1000
create_service "report-service" "http://report-service:3009" "/api/reports" 30 300
create_service "support-service" "http://support-service:3011" "/api/support" 100 1000

echo "✨ Kong Gateway configuration completed!"
echo ""
echo "📊 List all services:"
curl -s $KONG_ADMIN_URL/services | jq -r '.data[].name' 2>/dev/null || curl -s $KONG_ADMIN_URL/services

