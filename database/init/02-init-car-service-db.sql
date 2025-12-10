-- Initialize car_service_db database
-- This script runs automatically when PostgreSQL container starts for the first time

-- Create database if it doesn't exist (using DO block to avoid errors)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'car_service_db') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE car_service_db');
    END IF;
END
$$;

-- Note: The database creation might need to be done manually or through POSTGRES_DB
-- This script is mainly for additional setup if needed

-- Grant all privileges (will work even if database already exists)
GRANT ALL PRIVILEGES ON DATABASE car_service_db TO postgres;
