#!/bin/sh
set -eu
# psql variables quote the password as a SQL literal.
psql -v ON_ERROR_STOP=1 --username postgres --dbname postgres --set=mta_password="$MTA_DB_PASSWORD" <<'SQL'
CREATE ROLE mta_app LOGIN PASSWORD :'mta_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE mta OWNER mta_app;
SQL
