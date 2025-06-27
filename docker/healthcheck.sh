#!/bin/bash
# Stellar-JS Container Health Check
# Monitors container health and collection progress

# Basic Node.js runtime check
if ! node --version > /dev/null 2>&1; then
    echo "❌ Node.js runtime unavailable"
    exit 1
fi

# Check if database is accessible
if [ -f "/app/data/stellar.db" ]; then
    # Try to query the database
    if ! sqlite3 /app/data/stellar.db "SELECT COUNT(*) FROM repositories;" > /dev/null 2>&1; then
        echo "⚠️ Database exists but is not accessible"
        exit 1
    fi
else
    echo "ℹ️ Database not yet created (normal during startup)"
fi

# Check disk space (warn if less than 1GB available)
AVAILABLE_KB=$(df /app/data | tail -1 | awk '{print $4}')
AVAILABLE_MB=$((AVAILABLE_KB / 1024))

if [ $AVAILABLE_MB -lt 1024 ]; then
    echo "⚠️ Low disk space: ${AVAILABLE_MB}MB available"
    # Don't fail health check, but warn
fi

# Check memory usage (warn if over 90%)
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", ($3/$2) * 100}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "⚠️ High memory usage: ${MEMORY_USAGE}%"
fi

# Check if GitHub API is reachable (with token)
if [ -n "$GITHUB_TOKEN" ]; then
    if ! curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit > /dev/null; then
        echo "⚠️ GitHub API not reachable or token invalid"
        exit 1
    fi
fi

echo "✅ Container healthy"
exit 0