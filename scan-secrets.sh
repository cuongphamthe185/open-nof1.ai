#!/bin/bash
# ============================================
# SCAN HARDCODED SECRETS IN SOURCE CODE
# ============================================
# Kiểm tra xem có API keys/secrets nào bị hardcode trong code không
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🔒 SCANNING FOR HARDCODED SECRETS${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Count files to scan
TOTAL_FILES=$(find . -type f \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
     -o -name "*.json" -o -name "*.env*" -o -name "*.config.*" -o -name "*.sh" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./.git/*" | wc -l)

echo -e "${BLUE}📁 Scanning $TOTAL_FILES files...${NC}"
echo ""

ISSUES_FOUND=0

# 1. Scan for potential API keys pattern (all file types)
echo -e "${YELLOW}🔍 [1/8] Scanning for API key patterns...${NC}"
RESULTS=$(grep -r -n -E "(api[_-]?key|secret[_-]?key|access[_-]?token)\s*[=:]\s*['\"][a-zA-Z0-9]{20,}" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.json" \
  --include="*.sh" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude="*.test.*" \
  --exclude="*.spec.*" \
  --exclude="package-lock.json" \
  . 2>/dev/null)

if [ -n "$RESULTS" ]; then
  echo -e "${RED}❌ Found potential hardcoded API keys:${NC}"
  echo "$RESULTS"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
  echo ""
else
  echo -e "${GREEN}✅ No hardcoded API keys found${NC}"
  echo ""
fi

# 2. Scan for sk- pattern (DeepSeek keys)
echo -e "${YELLOW}🔍 [2/8] Scanning for DeepSeek API keys (sk-...)${NC}"
RESULTS=$(grep -r -n -E "sk-[a-zA-Z0-9]{32,}" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.json" \
  --include="*.env*" \
  --include="*.sh" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  . 2>/dev/null | grep -v "sk-xxx" | grep -v "placeholder" | grep -v "example" | grep -v "your-real-key")

if [ -n "$RESULTS" ]; then
  echo -e "${RED}❌ Found potential DeepSeek keys:${NC}"
  echo "$RESULTS"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
  echo ""
else
  echo -e "${GREEN}✅ No DeepSeek keys found in code${NC}"
  echo ""
fi

# 3. Scan for postgresql:// with password
echo -e "${YELLOW}🔍 [3/8] Scanning for database URLs with passwords...${NC}"
RESULTS=$(grep -r -n -E "postgresql://[^:]+:[^@]+@" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.json" \
  --include="*.env*" \
  --exclude="scan-secrets.sh" \
  --exclude="validate-env.sh" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  . 2>/dev/null | grep -v "process.env" | grep -v "YOUR_PASSWORD" | grep -v ":password@" | grep -v ":root@localhost")

if [ -n "$RESULTS" ]; then
  echo -e "${RED}❌ Found database URLs with credentials:${NC}"
  echo "$RESULTS"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
  echo ""
else
  echo -e "${GREEN}✅ No database credentials in code${NC}"
  echo ""
fi

# 4. Scan for long base64-like strings
echo -e "${YELLOW}🔍 [4/8] Scanning for base64-encoded secrets...${NC}"
RESULTS=$(grep -r -n -E "['\"][A-Za-z0-9+/]{40,}={0,2}['\"]" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.json" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude="*.test.*" \
  --exclude="package-lock.json" \
  . 2>/dev/null | head -5)

if [ -n "$RESULTS" ]; then
  echo -e "${YELLOW}⚠️  Found potential base64 strings (may be false positive):${NC}"
  echo "$RESULTS"
  echo -e "${BLUE}ℹ️  Review these manually${NC}"
  echo ""
else
  echo -e "${GREEN}✅ No suspicious base64 strings${NC}"
  echo ""
fi

# 5. Scan for Binance API keys pattern
echo -e "${YELLOW}🔍 [5/10] Scanning for Binance API keys...${NC}"
RESULTS=$(grep -r -n -E "['\"]([A-Za-z0-9]{64})['\"]" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.json" \
  --include="*.env*" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  . 2>/dev/null | grep -E "BINANCE|binance" | grep -v "your_" | grep -v "xxx" | head -3)

if [ -n "$RESULTS" ]; then
  echo -e "${RED}❌ Found potential Binance API keys:${NC}"
  echo "$RESULTS"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
  echo ""
else
  echo -e "${GREEN}✅ No Binance API keys found${NC}"
  echo ""
fi

# 6. Scan for private keys (RSA, EC, etc.)
echo -e "${YELLOW}🔍 [6/10] Scanning for private keys...${NC}"
RESULTS=$(grep -r -n -E "(BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY|BEGIN PRIVATE KEY)" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.json" \
  --include="*.pem" \
  --include="*.key" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  . 2>/dev/null)

if [ -n "$RESULTS" ]; then
  echo -e "${RED}❌ Found private keys in code:${NC}"
  echo "$RESULTS"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
  echo ""
else
  echo -e "${GREEN}✅ No private keys found${NC}"
  echo ""
fi

# 7. Scan for AWS credentials
echo -e "${YELLOW}🔍 [7/10] Scanning for AWS credentials...${NC}"
RESULTS=$(grep -r -n -E "(AKIA[0-9A-Z]{16}|aws_secret_access_key)" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.json" \
  --include="*.env*" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  . 2>/dev/null)

if [ -n "$RESULTS" ]; then
  echo -e "${RED}❌ Found AWS credentials:${NC}"
  echo "$RESULTS"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
  echo ""
else
  echo -e "${GREEN}✅ No AWS credentials found${NC}"
  echo ""
fi

# 8. Scan for JWT tokens
echo -e "${YELLOW}🔍 [8/10] Scanning for JWT tokens...${NC}"
RESULTS=$(grep -r -n -E "eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.json" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  . 2>/dev/null | grep -v "token=" | head -3)

if [ -n "$RESULTS" ]; then
  echo -e "${YELLOW}⚠️  Found JWT-like tokens (may be test tokens):${NC}"
  echo "$RESULTS"
  echo -e "${BLUE}ℹ️  Review these manually${NC}"
  echo ""
else
  echo -e "${GREEN}✅ No JWT tokens found${NC}"
  echo ""
fi

# 9. Scan for hardcoded passwords
echo -e "${YELLOW}🔍 [9/10] Scanning for hardcoded passwords...${NC}"
RESULTS=$(grep -r -n -E "(password|passwd|pwd)\s*[=:]\s*['\"][^'\"]{6,}" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  . 2>/dev/null | grep -v "process.env" | grep -v "PASSWORD" | grep -v "your_password" | head -3)

if [ -n "$RESULTS" ]; then
  echo -e "${RED}❌ Found hardcoded passwords:${NC}"
  echo "$RESULTS"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
  echo ""
else
  echo -e "${GREEN}✅ No hardcoded passwords found${NC}"
  echo ""
fi

# 10. Check .gitignore for .env files
echo -e "${YELLOW}🔍 [10/10] Checking .gitignore for .env files...${NC}"
if [ -f .gitignore ]; then
  if grep -q "\.env" .gitignore; then
    echo -e "${GREEN}✅ .env files are in .gitignore${NC}"
  else
    echo -e "${RED}❌ .env files NOT in .gitignore - ADD THEM!${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
else
  echo -e "${YELLOW}⚠️  No .gitignore file found${NC}"
fi
echo ""

# 6. Check if .env.local exists and has real keys
echo -e "${YELLOW}🔍 Checking .env.local for placeholder values...${NC}"
if [ -f .env.local ]; then
  if grep -q "xxx\|your_\|placeholder\|example" .env.local; then
    echo -e "${YELLOW}⚠️  .env.local contains placeholder values${NC}"
    echo -e "${BLUE}ℹ️  This is OK for development, but replace for production${NC}"
  else
    # Check if it has actual secrets
    if grep -E "sk-[a-zA-Z0-9]{32,}|[A-Za-z0-9]{64}" .env.local > /dev/null 2>&1; then
      echo -e "${RED}⚠️  .env.local appears to have REAL API KEYS!${NC}"
      echo -e "${YELLOW}⚠️  Make sure .env.local is in .gitignore!${NC}"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
      echo -e "${GREEN}✅ .env.local looks safe${NC}"
    fi
  fi
else
  echo -e "${BLUE}ℹ️  No .env.local file found (using export variables - GOOD!)${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📊 SCAN RESULTS${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ SCAN PASSED!${NC}"
  echo -e "   No hardcoded secrets detected in source code."
  echo -e "   Your code is safe to commit to Git."
  exit 0
else
  echo -e "${RED}⚠️  FOUND $ISSUES_FOUND ISSUE(S)${NC}"
  echo -e "   Please review and remove hardcoded secrets before committing."
  echo ""
  echo -e "${YELLOW}💡 Best practices:${NC}"
  echo -e "   1. Always use environment variables: process.env.API_KEY"
  echo -e "   2. Never commit .env.local or .env.production"
  echo -e "   3. Add all .env* files to .gitignore"
  echo -e "   4. Use export or secrets management tools"
  exit 1
fi
