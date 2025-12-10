-- Initialize car_rental_db database
-- This script runs automatically when PostgreSQL container starts for the first time

-- Create database if it doesn't exist (using DO block to avoid errors)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'car_rental_db') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE car_rental_db');
    END IF;
END
$$;

-- Note: The database is created by POSTGRES_DB environment variable
-- This script is mainly for additional setup if needed

-- Grant all privileges to postgres user (will work even if database already exists)
GRANT ALL PRIVILEGES ON DATABASE car_rental_db TO postgres;

