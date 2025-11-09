#!/bin/bash

# Script to regenerate Prisma Client after schema changes
# This fixes the "supportResistanceLevel undefined" error

echo "========================================="
echo "Regenerating Prisma Client"
echo "========================================="
echo ""

# Check database connection
echo "1. Testing database connection..."
if psql "postgresql://postgres:root@localhost:5432/nof1_dev" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection OK"
else
    echo "❌ Cannot connect to database"
    exit 1
fi
echo ""

# Generate Prisma Client using bun
echo "2. Generating Prisma Client..."
cd /mnt/c/cuongpt/vide_code/open-nof1.ai
bun x prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma Client generated successfully"
else
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi
echo ""

# Verify the new model exists
echo "3. Verifying supportResistanceLevel model..."
if grep -q "supportResistanceLevel" ./node_modules/.prisma/client/index.d.ts; then
    echo "✅ supportResistanceLevel model found in Prisma Client"
else
    echo "❌ supportResistanceLevel model NOT found"
    exit 1
fi
echo ""

echo "========================================="
echo "✅ Prisma Client regeneration complete!"
echo "========================================="
echo ""
echo "⚠️  IMPORTANT: Restart your app to use the new Prisma Client"
echo ""
echo "To restart:"
echo "  1. Stop current processes (Ctrl+C in terminals)"
echo "  2. Run: bun dev"
echo "  3. Run: bun run cron.ts"
echo ""
