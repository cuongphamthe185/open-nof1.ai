#!/bin/bash

# ============================================
# Setup Shell Aliases for NOF1 Trading Bot
# Automatically adds useful aliases to bash/zsh
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       Setup Shell Aliases for NOF1 Trading Bot${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Detect current user
CURRENT_USER=$(whoami)
USER_HOME=$(eval echo ~$CURRENT_USER)

echo -e "${BLUE}[1] Detecting shell configuration...${NC}"
echo -e "   Current user: ${YELLOW}${CURRENT_USER}${NC}"
echo -e "   Home directory: ${YELLOW}${USER_HOME}${NC}"

# Detect shell config file
if [ -f "$USER_HOME/.zshrc" ]; then
    SHELL_CONFIG="$USER_HOME/.zshrc"
    SHELL_TYPE="zsh"
elif [ -f "$USER_HOME/.bashrc" ]; then
    SHELL_CONFIG="$USER_HOME/.bashrc"
    SHELL_TYPE="bash"
else
    # Create .bashrc if doesn't exist
    SHELL_CONFIG="$USER_HOME/.bashrc"
    SHELL_TYPE="bash"
    touch "$SHELL_CONFIG"
fi

echo -e "   Shell config: ${YELLOW}${SHELL_CONFIG}${NC}"
echo -e "   Shell type: ${YELLOW}${SHELL_TYPE}${NC}\n"

# Get project directory dynamically
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo -e "${BLUE}[2] Project directory: ${YELLOW}${PROJECT_DIR}${NC}\n"

# Backup existing config
BACKUP_FILE="${SHELL_CONFIG}.backup-$(date +%Y%m%d-%H%M%S)"
echo -e "${BLUE}[3] Creating backup...${NC}"
cp "$SHELL_CONFIG" "$BACKUP_FILE"
echo -e "   ${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}\n"

# Prepare aliases content
ALIASES_CONTENT="
# ============================================
# NOF1 Trading Bot Aliases
# Added by setup-aliases.sh on $(date)
# ============================================

# Git shortcuts
alias ga='git add .'
alias gb='git branch'
alias gc='git checkout'
alias gm='git commit -m'
alias gpull='git pull'
alias gpush='git push'
alias gpushforce='git push --force-with-lease origin'
alias grb='git rebase -i'
alias grbm='git rebase origin/main'
alias gst='git status'

# Terraform shortcuts
alias tfa='terraform apply'
alias tffmt='terraform fmt -diff -recursive'
alias tfp='terraform plan'
alias tga='terragrunt apply'
alias tghcl='terragrunt hclfmt'
alias tgo='terragrunt plan -out tf.plan'

# General shortcuts
alias grep='grep --color=auto'
alias l='ls -CF'
alias la='ls -A'
alias ll='ls -alF'
alias ls='ls --color=auto'
alias prc='pre-commit run --all-files'
alias helmtem='helm template --debug'

# NOF1 Trading Bot shortcuts
alias nof1-env='${PROJECT_DIR}/check-env.sh'
alias nof1-scan='${PROJECT_DIR}/scan-secrets.sh'
alias nof1-start='${PROJECT_DIR}/start-production.sh'
alias nof1-status='${PROJECT_DIR}/check-status.sh'
alias nof1-stop='pkill -f \"bun dev\" || true && pkill -f \"cron.ts\" || true && sleep 2 && echo \"Stopped\"'
alias nof1-verify='${PROJECT_DIR}/verify-network-config.sh'

# Quick navigation
alias nof1='cd ${PROJECT_DIR}'

# ============================================
"

# Check if aliases already exist
if grep -q "NOF1 Trading Bot Aliases" "$SHELL_CONFIG" 2>/dev/null; then
    echo -e "${YELLOW}[4] Aliases already exist in ${SHELL_CONFIG}${NC}"
    echo -e "   Removing old aliases and adding new ones...\n"
    
    # Remove old aliases section
    sed -i '/# NOF1 Trading Bot Aliases/,/# ============================================$/d' "$SHELL_CONFIG"
fi

# Add aliases to config file
echo -e "${BLUE}[4] Adding aliases to ${SHELL_CONFIG}...${NC}"
echo "$ALIASES_CONTENT" >> "$SHELL_CONFIG"
echo -e "   ${GREEN}✓ Aliases added successfully${NC}\n"

# Make scripts executable
echo -e "${BLUE}[5] Making scripts executable...${NC}"
chmod +x "${PROJECT_DIR}/check-env.sh" 2>/dev/null || true
chmod +x "${PROJECT_DIR}/scan-secrets.sh" 2>/dev/null || true
chmod +x "${PROJECT_DIR}/start-production.sh" 2>/dev/null || true
chmod +x "${PROJECT_DIR}/start-full-system.sh" 2>/dev/null || true
chmod +x "${PROJECT_DIR}/check-status.sh" 2>/dev/null || true
chmod +x "${PROJECT_DIR}/verify-network-config.sh" 2>/dev/null || true
echo -e "   ${GREEN}✓ Scripts are now executable${NC}\n"

# Reload shell config
echo -e "${BLUE}[6] Reloading shell configuration...${NC}"
if [ "$SHELL_TYPE" = "zsh" ]; then
    # For zsh, source the config if running in zsh
    if [ -n "$ZSH_VERSION" ]; then
        source "$SHELL_CONFIG" 2>/dev/null || true
    fi
elif [ "$SHELL_TYPE" = "bash" ]; then
    # For bash, source the config if running in bash
    if [ -n "$BASH_VERSION" ]; then
        source "$SHELL_CONFIG" 2>/dev/null || true
    fi
fi
echo -e "   ${GREEN}✓ Configuration reloaded${NC}\n"

# Display summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Aliases successfully added to: ${SHELL_CONFIG}${NC}"
echo -e "${GREEN}✓ Backup saved to: ${BACKUP_FILE}${NC}\n"

echo -e "${YELLOW}Available NOF1 aliases:${NC}"
echo -e "   ${BLUE}nof1${NC}          - Navigate to project directory"
echo -e "   ${BLUE}nof1-env${NC}      - Check environment configuration"
echo -e "   ${BLUE}nof1-scan${NC}     - Scan for secrets in code"
echo -e "   ${BLUE}nof1-start${NC}    - Start the trading bot"
echo -e "   ${BLUE}nof1-status${NC}   - Check bot status"
echo -e "   ${BLUE}nof1-stop${NC}     - Stop the trading bot"
echo -e "   ${BLUE}nof1-verify${NC}   - Verify network configuration"
echo ""

echo -e "${YELLOW}Git aliases:${NC}"
echo -e "   ${BLUE}ga${NC}            - git add ."
echo -e "   ${BLUE}gb${NC}            - git branch"
echo -e "   ${BLUE}gc${NC}            - git checkout"
echo -e "   ${BLUE}gm${NC}            - git commit -m"
echo -e "   ${BLUE}gst${NC}           - git status"
echo -e "   ${BLUE}gpull/gpush${NC}   - git pull/push"
echo ""

echo -e "${YELLOW}To apply changes immediately, run:${NC}"
echo -e "   ${BLUE}source ${SHELL_CONFIG}${NC}"
echo ""

echo -e "${YELLOW}Or simply open a new terminal window.${NC}\n"

echo -e "${GREEN}Setup complete! 🎉${NC}\n"
