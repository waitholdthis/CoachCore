-- Creates the season user and database on first Postgres container startup
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'season') THEN
    CREATE USER season WITH PASSWORD 'season';
  END IF;
END $$;

SELECT 'CREATE DATABASE the_season OWNER season'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'the_season')\gexec

GRANT ALL PRIVILEGES ON DATABASE the_season TO season;
