#!/bin/bash
set -e

# The database is already created by POSTGRES_DB environment variable
# This script only ensures privileges are set correctly

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    -- Grant privileges (idempotent - safe to run multiple times)
    GRANT ALL PRIVILEGES ON DATABASE car_rental_db TO postgres;
EOSQL

# Connect to the database and set up extensions
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create extensions if needed
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL

echo "Database car_rental_db initialized successfully"

