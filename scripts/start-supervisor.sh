#!/bin/bash
set -e

echo "🚀 Blipee Multi-Process Startup Script"
echo "========================================"

# 1. Create required directories
echo "📁 Creating required directories..."
mkdir -p /var/log/supervisor
mkdir -p /var/run
mkdir -p /app/logs

# 2. Set permissions
echo "🔐 Setting permissions..."
chmod 755 /var/log/supervisor
chmod 755 /var/run
chmod 755 /app/logs

# 3. Validate environment variables
echo "🔍 Validating environment..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL not set"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not set"
    exit 1
fi

echo "✅ Environment validated"

# 4. Check if required files exist
echo "📂 Checking required files..."
if [ ! -f "/app/services/ai-agent-orchestrator.ts" ]; then
    echo "❌ ERROR: /app/services/ai-agent-orchestrator.ts not found"
    ls -la /app/services/ || echo "services directory not found"
    exit 1
fi

if [ ! -f "/app/services/forecast-service/main.py" ]; then
    echo "❌ ERROR: Prophet service main.py not found"
    exit 1
fi

echo "✅ Required files present"

# 5. Check if Prophet dependencies are installed
echo "🐍 Checking Python dependencies..."
python3 -c "import prophet; import fastapi; import uvicorn" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Prophet dependencies installed"
else
    echo "⚠️  Prophet dependencies missing, installing..."
    pip install -r services/forecast-service/requirements.txt
fi

# 6. Validate supervisor configuration
echo "🔧 Validating supervisor configuration..."
if supervisord -c supervisord.conf -h &>/dev/null; then
    echo "✅ Supervisor configuration valid"
else
    echo "❌ ERROR: Invalid supervisor configuration"
    exit 1
fi

# 7. Start supervisor
echo ""
echo "🎬 Starting Supervisor..."
echo "   Process 1: Node.js Agent Worker (8 autonomous agents)"
echo "   Process 2: Python Prophet Service (port 8001)"
echo ""

exec supervisord -c supervisord.conf
