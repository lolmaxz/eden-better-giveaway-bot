#!/bin/sh
set -eu

DATA_DIR="${DATA_DIR:-/data}"
DB_PATH="${DATA_DIR}/dev.db"
SEED_DB="${SEED_DB:-/seed/dev.db}"
IMPORTED_FLAG="${DATA_DIR}/.imported"

mkdir -p "$DATA_DIR"

if [ ! -f "$IMPORTED_FLAG" ]; then
	if [ -f "$SEED_DB" ]; then
		echo "Importing existing SQLite database into Docker volume…"
		cp "$SEED_DB" "$DB_PATH"
		if [ -f "${SEED_DB}-wal" ]; then
			cp "${SEED_DB}-wal" "${DB_PATH}-wal"
		fi
		if [ -f "${SEED_DB}-shm" ]; then
			cp "${SEED_DB}-shm" "${DB_PATH}-shm"
		fi
	fi
	touch "$IMPORTED_FLAG"
fi

if [ ! -f "$DB_PATH" ]; then
	echo "No database found at $DB_PATH — Prisma will create it during migrate deploy."
fi

echo "Applying Prisma migrations…"
npx prisma migrate deploy

echo "Starting giveaway bot…"
exec node dist/index.js
