#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE TABLE IF NOT EXISTS user_streak_count (
        user_id VARCHAR(50) PRIMARY KEY,
        streak_count INT NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_streak_date (
        user_id VARCHAR(50) PRIMARY KEY,
        click_date DATE NOT NULL
    );
EOSQL
