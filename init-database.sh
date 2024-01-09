#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname aquastreak <<-EOSQL
    CREATE TABLE IF NOT EXISTS user_streaks ( user_id VARCHAR(50) PRIMARY KEY, streak_count INT DEFAULT 0);
    CREATE TABLE IF NOT EXISTS user_clicks ( user_id VARCHAR(50), click_date DATE);
EOSQL