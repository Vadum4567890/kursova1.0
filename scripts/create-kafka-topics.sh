#!/bin/bash

# Script to create all Kafka topics for car rental platform
# Usage: ./scripts/create-kafka-topics.sh

KAFKA_CONTAINER="car-rental-kafka"
BOOTSTRAP_SERVER="localhost:9092"

echo "🚀 Creating Kafka topics for Car Rental Platform..."

# Check if Kafka container is running
if ! docker ps | grep -q $KAFKA_CONTAINER; then
    echo "❌ Error: Kafka container ($KAFKA_CONTAINER) is not running"
    echo "   Please start it with: docker-compose up -d kafka"
    exit 1
fi

# Function to create topic
create_topic() {
    local topic=$1
    local partitions=$2
    local replication=$3
    
    echo "📝 Creating topic: $topic (partitions: $partitions, replication: $replication)"
    
    docker exec $KAFKA_CONTAINER kafka-topics \
        --create \
        --bootstrap-server $BOOTSTRAP_SERVER \
        --topic $topic \
        --partitions $partitions \
        --replication-factor $replication \
        --if-not-exists
    
    if [ $? -eq 0 ]; then
        echo "✅ Topic $topic created successfully"
    else
        echo "❌ Failed to create topic $topic"
    fi
}

# User Events (3 partitions)
create_topic "user.created" 3 1
create_topic "user.verified" 3 1
create_topic "user.updated" 3 1

# Car Events (3 partitions)
create_topic "car.created" 3 1
create_topic "car.updated" 3 1
create_topic "car.deleted" 3 1

# Rental Events (6 partitions - high volume)
create_topic "rental.created" 6 1
create_topic "rental.confirmed" 6 1
create_topic "rental.rejected" 6 1
create_topic "rental.cancelled" 6 1
create_topic "rental.check-in" 6 1
create_topic "rental.check-out" 6 1
create_topic "rental.completed" 6 1

# Payment Events (6 partitions - high volume)
create_topic "payment.processed" 6 1
create_topic "payment.failed" 6 1
create_topic "payout.scheduled" 6 1
create_topic "payout.completed" 6 1

# Review Events (3 partitions)
create_topic "review.created" 3 1

# Notification Events (3 partitions)
create_topic "notification.send" 3 1

echo ""
echo "✨ All topics created successfully!"
echo ""
echo "📊 Listing all topics:"
docker exec $KAFKA_CONTAINER kafka-topics --list --bootstrap-server $BOOTSTRAP_SERVER

