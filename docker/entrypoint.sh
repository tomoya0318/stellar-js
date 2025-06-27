#!/bin/bash
set -e

# Stellar-JS Docker Container Entrypoint
# Handles initialization and execution coordination

echo "🚀 Stellar-JS Container Starting..."
echo "========================================"

# Environment validation
echo "🔍 Validating environment..."

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ ERROR: GITHUB_TOKEN environment variable is required"
    echo "Please set GITHUB_TOKEN in your .env file or docker-compose environment"
    exit 1
fi

echo "✅ GitHub token found"

# Database directory setup
echo "🗄️  Setting up database directories..."
mkdir -p /app/data /app/logs /app/exports /app/config

# Check if database exists, if not, run migrations
if [ ! -f "/app/data/stellar.db" ]; then
    echo "🔧 Database not found, running initial setup..."
    npm run db:migrate
    echo "✅ Database initialized"
else
    echo "✅ Database found"
fi

# Determine execution mode based on first argument
COMMAND=${1:-"large-scale-collection"}

echo "📋 Execution mode: $COMMAND"
echo ""

case $COMMAND in
    "large-scale-collection")
        echo "🎯 Starting Large Scale Collection (1000 repositories)"
        echo "Strategy: Phase 1 (Quality 700) + Phase 2 (Temporal 300)"
        exec npm run large-scale-collection
        ;;
    "phase1")
        echo "🎯 Starting Phase 1: Quality Collection (700 repositories)"
        exec npm run phase1
        ;;
    "phase2")
        echo "🕒 Starting Phase 2: Temporal Collection (300 repositories)"
        exec npm run phase2
        ;;
    "analysis")
        echo "📊 Starting Comprehensive Analysis"
        exec npm run comprehensive-analysis
        ;;
    "export")
        echo "📤 Starting Dataset Export"
        exec npm run export-dataset
        ;;
    "studio")
        echo "🔍 Starting Drizzle Studio"
        exec npm run db:studio
        ;;
    "bash")
        echo "🐚 Starting interactive bash session"
        exec /bin/bash
        ;;
    *)
        echo "🔧 Running custom command: $*"
        exec "$@"
        ;;
esac