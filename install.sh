#!/bin/bash
#
# PhaseSwarm Installer
# Multi-phase, multi-agent execution planning for Claude Code
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/bryhearnchi-bot/phaseswarm/main/install.sh | bash
#   OR
#   ./install.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print with color
print_status() {
    echo -e "${BLUE}[PhaseSwarm]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PhaseSwarm]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[PhaseSwarm]${NC} $1"
}

print_error() {
    echo -e "${RED}[PhaseSwarm]${NC} $1"
}

# Determine script directory (handles both direct run and curl pipe)
get_script_dir() {
    if [ -n "$BASH_SOURCE" ] && [ -f "$BASH_SOURCE" ]; then
        # Running from file
        dirname "$(readlink -f "$BASH_SOURCE" 2>/dev/null || echo "$BASH_SOURCE")"
    else
        # Running from curl pipe - download from GitHub
        echo ""
    fi
}

SCRIPT_DIR=$(get_script_dir)

# Target directories
CLAUDE_DIR=".claude/commands"
REGISTRY_FILE="$HOME/.phaseswarm-registry.json"

# Command files to install
COMMANDS=("phaseswarm-create.md" "phaseswarm-run.md")

# GitHub raw URL base (for curl install)
GITHUB_RAW_BASE="https://raw.githubusercontent.com/bryhearnchi-bot/phaseswarm/main"

echo ""
echo "======================================"
echo "    PhaseSwarm Installer"
echo "    Multi-Phase Agent Orchestration"
echo "======================================"
echo ""

# Step 1: Create .claude/commands directory
print_status "Creating $CLAUDE_DIR directory..."

if [ -d "$CLAUDE_DIR" ]; then
    print_warning "Directory $CLAUDE_DIR already exists"
else
    if mkdir -p "$CLAUDE_DIR"; then
        print_success "Created $CLAUDE_DIR"
    else
        print_error "Failed to create $CLAUDE_DIR"
        print_error "Please check permissions and try again"
        exit 1
    fi
fi

# Step 2: Copy/Download command files
print_status "Installing PhaseSwarm commands..."

for cmd in "${COMMANDS[@]}"; do
    target_file="$CLAUDE_DIR/$cmd"

    # Check if target already exists
    if [ -f "$target_file" ]; then
        print_warning "$cmd already exists"
        read -p "  Overwrite? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Skipping $cmd"
            continue
        fi
    fi

    # Try to copy from local commands directory first
    if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/commands/$cmd" ]; then
        if cp "$SCRIPT_DIR/commands/$cmd" "$target_file"; then
            print_success "Installed $cmd (from local)"
        else
            print_error "Failed to copy $cmd"
            exit 1
        fi
    else
        # Download from GitHub
        print_status "Downloading $cmd from GitHub..."
        if curl -fsSL "$GITHUB_RAW_BASE/commands/$cmd" -o "$target_file"; then
            print_success "Installed $cmd (from GitHub)"
        else
            print_error "Failed to download $cmd"
            print_error "URL: $GITHUB_RAW_BASE/commands/$cmd"
            exit 1
        fi
    fi
done

# Step 3: Create registry file if it doesn't exist
print_status "Checking PhaseSwarm registry..."

if [ -f "$REGISTRY_FILE" ]; then
    print_warning "Registry already exists at $REGISTRY_FILE"
else
    print_status "Creating registry at $REGISTRY_FILE..."

    cat > "$REGISTRY_FILE" << 'EOF'
{
  "registry_version": 1,
  "created": "",
  "projects": []
}
EOF

    # Update created date
    if command -v date &> /dev/null; then
        created_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS sed
            sed -i '' "s/\"created\": \"\"/\"created\": \"$created_date\"/" "$REGISTRY_FILE"
        else
            # GNU sed
            sed -i "s/\"created\": \"\"/\"created\": \"$created_date\"/" "$REGISTRY_FILE"
        fi
    fi

    print_success "Created registry file"
fi

# Step 4: Verify installation
print_status "Verifying installation..."

all_ok=true
for cmd in "${COMMANDS[@]}"; do
    if [ -f "$CLAUDE_DIR/$cmd" ]; then
        print_success "  Found: $CLAUDE_DIR/$cmd"
    else
        print_error "  Missing: $CLAUDE_DIR/$cmd"
        all_ok=false
    fi
done

if [ -f "$REGISTRY_FILE" ]; then
    print_success "  Found: $REGISTRY_FILE"
else
    print_error "  Missing: $REGISTRY_FILE"
    all_ok=false
fi

if [ "$all_ok" = false ]; then
    print_error "Installation incomplete. Please check errors above."
    exit 1
fi

# Success message
echo ""
echo "======================================"
print_success "PhaseSwarm installed successfully!"
echo "======================================"
echo ""
echo "Usage:"
echo ""
echo "  1. Create a PhaseSwarm from a PRD:"
echo "     ${BLUE}/phaseswarm-create${NC}"
echo ""
echo "  2. Run an existing PhaseSwarm:"
echo "     ${BLUE}/phaseswarm-run${NC}"
echo ""
echo "Commands installed to: ${GREEN}$CLAUDE_DIR${NC}"
echo "Registry location: ${GREEN}$REGISTRY_FILE${NC}"
echo ""
echo "For more info: https://github.com/bryhearnchi-bot/phaseswarm"
echo ""
