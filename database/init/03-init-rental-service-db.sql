-- Initialize rental_service_db database
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rental_service_db') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE rental_service_db');
    END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE rental_service_db TO postgres;
