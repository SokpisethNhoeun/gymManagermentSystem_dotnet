#!/usr/bin/env bash
set -euo pipefail

SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
if [[ ! -x "$SQLCMD" ]]; then
  SQLCMD="/opt/mssql-tools/bin/sqlcmd"
fi

SERVER="${SQLSERVER_HOST:-sqlserver}"
DB_NAME="${DB_NAME:-GymManagementDB}"
SCHEMA_FILE="/docker/sqlserver/GymManagementDB.sql"
SEED_FILE="/docker/sqlserver/seed-data.sql"

if [[ -z "${MSSQL_SA_PASSWORD:-}" ]]; then
  echo "MSSQL_SA_PASSWORD is required."
  exit 1
fi

if [[ "$DB_NAME" != "GymManagementDB" ]]; then
  echo "DB_NAME must be GymManagementDB because GymManagementDB.sql contains USE [GymManagementDB]."
  exit 1
fi

sqlcmd_base=("$SQLCMD" -S "$SERVER" -U sa -P "$MSSQL_SA_PASSWORD" -C -b)

scalar() {
  "${sqlcmd_base[@]}" -d "$DB_NAME" -h -1 -W -Q "SET NOCOUNT ON; $1" | tr -d '[:space:]'
}

echo "Ensuring database [$DB_NAME] exists..."
"${sqlcmd_base[@]}" -d master -Q "IF DB_ID(N'$DB_NAME') IS NULL BEGIN DECLARE @sql nvarchar(max) = N'CREATE DATABASE ' + QUOTENAME(N'$DB_NAME'); EXEC(@sql); END"

user_table_count="$(scalar "SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0;")"
has_users_table="$(scalar "SELECT CASE WHEN OBJECT_ID(N'dbo.tbl_users', N'U') IS NULL THEN 0 ELSE 1 END;")"

if [[ "$has_users_table" == "1" ]]; then
  echo "Database [$DB_NAME] already has tbl_users; skipping schema import."
  exit 0
fi

if [[ "$user_table_count" != "0" ]]; then
  echo "Database [$DB_NAME] has existing user tables but no dbo.tbl_users. Refusing to import over a partial database."
  exit 1
fi

echo "Importing schema from $SCHEMA_FILE..."
"${sqlcmd_base[@]}" -i "$SCHEMA_FILE"

echo "Seeding default roles and users from $SEED_FILE..."
"${sqlcmd_base[@]}" -v DbName="$DB_NAME" -i "$SEED_FILE"

echo "Database [$DB_NAME] initialized."
