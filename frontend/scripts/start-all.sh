# scripts/start-all.sh - Start all language instances
#!/bin/bash

echo "🚀 Starting all language instances..."

# Start Telugu/English instance (port 3000)
echo "📍 Starting Telugu/English instance on port 3000..."
DEFAULT_LOCALE=te SUPPORTED_LOCALES=te,en npm run dev &
TE_PID=$!

# Wait a moment
sleep 2

# Start Hindi instance (port 3001)
echo "📍 Starting Hindi instance on port 3001..."
DEFAULT_LOCALE=hi SUPPORTED_LOCALES=hi npm run dev -- -p 3001 &
HI_PID=$!

# Wait a moment
sleep 2

# Start Kannada instance (port 3002)
echo "📍 Starting Kannada instance on port 3002..."
DEFAULT_LOCALE=kn SUPPORTED_LOCALES=kn npm run dev -- -p 3002 &
KN_PID=$!

echo "✅ All instances started!"
echo "🔗 Available URLs:"
echo "   Telugu:  http://localhost:3000"
echo "   English: http://localhost:3000/en"
echo "   Hindi:   http://localhost:3001"
echo "   Kannada: http://localhost:3002"

echo ""
echo "Process IDs:"
echo "   Telugu/English: $TE_PID"
echo "   Hindi: $HI_PID"
echo "   Kannada: $KN_PID"

# Save PIDs for later cleanup
echo $TE_PID > .pids/te.pid
echo $HI_PID > .pids/hi.pid
echo $KN_PID > .pids/kn.pid

echo ""
echo "Press Ctrl+C to stop all instances"

# Wait for all background processes
wait

# scripts/stop-all.sh - Stop all instances
#!/bin/bash

echo "🛑 Stopping all language instances..."

# Create pids directory if it doesn't exist
mkdir -p .pids

# Function to stop process by PID file
stop_instance() {
    local pid_file=$1
    local instance_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🔥 Stopping $instance_name (PID: $pid)..."
            kill "$pid"
            rm "$pid_file"
        else
            echo "⚠️  $instance_name process not running"
            rm "$pid_file"
        fi
    else
        echo "⚠️  No PID file found for $instance_name"
    fi
}

# Stop all instances
stop_instance ".pids/te.pid" "Telugu/English"
stop_instance ".pids/hi.pid" "Hindi"
stop_instance ".pids/kn.pid" "Kannada"

# Also kill any remaining Next.js processes on our ports
echo "🧹 Cleaning up any remaining processes..."
lsof -ti:3000,3001,3002 | xargs kill -9 2>/dev/null || true

echo "✅ All instances stopped!"

# scripts/build-all.sh - Build all instances
#!/bin/bash

echo "🏗️  Building all language instances..."

# Build Telugu/English instance
echo "📦 Building Telugu/English instance..."
DEFAULT_LOCALE=te SUPPORTED_LOCALES=te,en npm run build

# Build Hindi instance
echo "📦 Building Hindi instance..."
DEFAULT_LOCALE=hi SUPPORTED_LOCALES=hi npm run build

# Build Kannada instance  
echo "📦 Building Kannada instance..."
DEFAULT_LOCALE=kn SUPPORTED_LOCALES=kn npm run build

echo "✅ All instances built successfully!"

# scripts/check-instances.sh - Check which instances are running
#!/bin/bash

echo "🔍 Checking instance status..."

check_port() {
    local port=$1
    local language=$2
    local url=$3
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo "✅ $language instance running on port $port - $url"
    else
        echo "❌ $language instance NOT running on port $port"
    fi
}

check_port 3000 "Telugu/English" "http://localhost:3000"
check_port 3001 "Hindi" "http://localhost:3001"
check_port 3002 "Kannada" "http://localhost:3002"

# package.json script additions for Windows (add to existing package.json)
# "scripts": {
#   "start:all:win": "concurrently \"npm run dev:te\" \"npm run dev:hi\" \"npm run dev:kn\"",
#   "check": "node scripts/check-instances.js"
# }