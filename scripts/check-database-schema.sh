#!/bin/bash

# Script to check database schema and compare with Prisma schema
# Usage: ./scripts/check-database-schema.sh

DB_URL="postgresql://postgres:root@localhost:5432/nof1_dev"

echo "========================================="
echo "DATABASE SCHEMA VERIFICATION"
echo "========================================="
echo ""

echo "1. Tables in database:"
echo "-------------------------------------"
echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" | psql "$DB_URL" -t -A
echo ""

echo "2. Applied Prisma Migrations:"
echo "-------------------------------------"
echo "SELECT migration_name, started_at FROM _prisma_migrations ORDER BY started_at;" | psql "$DB_URL" -t -A
echo ""

echo "3. Chat table structure:"
echo "-------------------------------------"
echo "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Chat' ORDER BY ordinal_position;" | psql "$DB_URL" -t -A
echo ""

echo "4. Metrics table structure:"
echo "-------------------------------------"
echo "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Metrics' ORDER BY ordinal_position;" | psql "$DB_URL" -t -A
echo ""

echo "5. Trading table structure:"
echo "-------------------------------------"
echo "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Trading' ORDER BY ordinal_position;" | psql "$DB_URL" -t -A
echo ""

echo "6. support_resistance_levels table structure:"
echo "-------------------------------------"
echo "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_resistance_levels' ORDER BY ordinal_position;" | psql "$DB_URL" -t -A
echo ""

echo "7. Indexes on support_resistance_levels:"
echo "-------------------------------------"
echo "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'support_resistance_levels' ORDER BY indexname;" | psql "$DB_URL" -t -A
echo ""

echo "8. Enums in database:"
echo "-------------------------------------"
echo "SELECT t.typname as enum_name, e.enumlabel as enum_value FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid ORDER BY t.typname, e.enumsortorder;" | psql "$DB_URL" -t -A
echo ""

echo "========================================="
echo "VERIFICATION COMPLETE"
echo "========================================="
