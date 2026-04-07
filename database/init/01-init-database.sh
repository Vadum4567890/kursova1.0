#!/bin/bash
set -e
# Розширення для user_service_db (POSTGRES_DB). Монолітна car_rental_db не використовується в microservices-стеці.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL
