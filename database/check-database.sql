-- Script to check if database exists
-- Run: psql -U postgres -f check-database.sql

SELECT datname FROM pg_database WHERE datname = 'car_rental_db';

-- If returns a row, database exists
-- If returns no rows, database does not exist

