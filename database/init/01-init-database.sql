-- UUID для первинних ключів (раніше було в 01-init-database.sh; Alpine-образ без bash).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT 1;
