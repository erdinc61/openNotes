#!/bin/sh
set -e

# Migrate from old name (openself.db -> opennotes.db), including WAL/SHM files
if [ -f /app/data/openself.db ] && [ ! -f /app/data/opennotes.db ]; then
  echo "Migrating database: openself.db -> opennotes.db"
  mv /app/data/openself.db /app/data/opennotes.db
  [ -f /app/data/openself.db-wal ] && mv /app/data/openself.db-wal /app/data/opennotes.db-wal
  [ -f /app/data/openself.db-shm ] && mv /app/data/openself.db-shm /app/data/opennotes.db-shm
fi

# On first run, initialize DB from template if it doesn't exist
if [ ! -f /app/data/opennotes.db ]; then
  echo "Initializing database..."
  cp /app/data/opennotes.db.template /app/data/opennotes.db
fi

exec node server.js
