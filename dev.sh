#!/bin/bash

# SSBhakthi Monorepo Development Script
# This script provides easy commands for managing the entire monorepo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local timeout=60
    
    print_color $YELLOW "Waiting for $service_name to be ready..."
    
    for i in $(seq 1 $timeout); do
        if nc -z $host $port 2>/dev/null; then
            print_color $GREEN "$service_name is ready!"
            return 0
        fi
        sleep 1
    done
    
    print_color $RED "$service_name failed to start within $timeout seconds"
    return 1
}

# Function to show usage
show_usage() {
    echo "SSBhakthi Monorepo Development Script"
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup          - Initial setup (install dependencies, start Docker, seed DB)"
    echo "  dev            - Start development (all services + frontend + backend)"
    echo "  dev-quick      - Start development (minimal Docker services)"
    echo "  dev-backend    - Start only backend development"
    echo "  dev-frontend   - Start only frontend development (all languages)"
    echo "  docker-up      - Start Docker services (MongoDB, Redis)"
    echo "  docker-all     - Start all Docker services (including Keycloak)"
    echo "  docker-down    - Stop Docker services"
    echo "  docker-clean   - Clean Docker services and volumes"
    echo "  build          - Build both frontend and backend"
    echo "  test           - Run tests for both projects"
    echo "  lint           - Run linting for both projects"
    echo "  status         - Show status of all services"
    echo "  stop           - Stop all running services"
    echo "  clean          - Clean all build artifacts and node_modules"
    echo "  reset          - Full reset (clean + setup)"
    echo "  help           - Show this help message"
}

# Function to show service status
show_status() {
    print_color $CYAN "=== Service Status ==="
    
    echo "Docker Services:"
    docker-compose ps 2>/dev/null || echo "  No Docker services running"
    
    echo ""
    echo "Development Ports:"
    
    services=(
        "3000:Frontend (Telugu/English)"
        "3001:Frontend (Hindi)"
        "3002:Frontend (Kannada)"
        "4000:Backend API"
        "27017:MongoDB"
        "6379:Redis"
        "8080:Keycloak"
        "8081:Redis Admin"
        "8082:MongoDB Admin"
    )
    
    for service in "${services[@]}"; do
        port=$(echo $service | cut -d: -f1)
        name=$(echo $service | cut -d: -f2)
        
        if check_port $port; then
            print_color $GREEN "  ✓ $name (port $port)"
        else
            print_color $RED "  ✗ $name (port $port)"
        fi
    done
}

# Function to stop all services
stop_services() {
    print_color $YELLOW "Stopping all services..."
    
    # Stop Docker services
    if [ -f docker-compose.yml ]; then
        docker-compose down 2>/dev/null || true
        docker-compose --profile keycloak down 2>/dev/null || true
    fi
    
    # Kill Node.js processes on development ports
    for port in 3000 3001 3002 4000; do
        if check_port $port; then
            print_color $YELLOW "Stopping service on port $port..."
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        fi
    done
    
    print_color $GREEN "All services stopped"
}

# Main script logic
case "${1:-help}" in
    setup)
        print_color $CYAN "=== Setting up SSBhakthi Monorepo ==="
        
        # Install dependencies
        print_color $YELLOW "Installing dependencies..."
        pnpm install
        
        # Start Docker services
        print_color $YELLOW "Starting Docker services..."
        docker-compose up -d
        
        # Wait for MongoDB
        wait_for_service localhost 27017 "MongoDB"
        
        # Seed database
        print_color $YELLOW "Seeding database..."
        cd backend && pnpm run db:seed && cd ..
        
        print_color $GREEN "Setup complete! Run '$0 dev' to start development"
        ;;
        
    dev)
        print_color $CYAN "=== Starting Full Development Environment ==="
        
        # Start Docker services
        print_color $YELLOW "Starting Docker services..."
        docker-compose --profile keycloak up -d
        
        # Wait for services
        wait_for_service localhost 27017 "MongoDB"
        wait_for_service localhost 6379 "Redis"
        wait_for_service localhost 8080 "Keycloak"
        
        # Start development servers
        print_color $YELLOW "Starting development servers..."
        pnpm run dev:services
        ;;
        
    dev-quick)
        print_color $CYAN "=== Starting Quick Development Environment ==="
        pnpm run quick-start
        ;;
        
    dev-backend)
        print_color $CYAN "=== Starting Backend Development ==="
        docker-compose up -d
        wait_for_service localhost 27017 "MongoDB"
        wait_for_service localhost 6379 "Redis"
        pnpm run dev:backend-only
        ;;
        
    dev-frontend)
        print_color $CYAN "=== Starting Frontend Development ==="
        pnpm run dev:frontend-only
        ;;
        
    docker-up)
        print_color $CYAN "=== Starting Docker Services ==="
        docker-compose up -d
        wait_for_service localhost 27017 "MongoDB"
        wait_for_service localhost 6379 "Redis"
        print_color $GREEN "Docker services started"
        ;;
        
    docker-all)
        print_color $CYAN "=== Starting All Docker Services ==="
        docker-compose --profile keycloak up -d
        wait_for_service localhost 27017 "MongoDB"
        wait_for_service localhost 6379 "Redis"
        wait_for_service localhost 8080 "Keycloak"
        print_color $GREEN "All Docker services started"
        ;;
        
    docker-down)
        print_color $CYAN "=== Stopping Docker Services ==="
        docker-compose down
        docker-compose --profile keycloak down
        print_color $GREEN "Docker services stopped"
        ;;
        
    docker-clean)
        print_color $CYAN "=== Cleaning Docker Services ==="
        docker-compose down -v --remove-orphans
        docker-compose --profile keycloak down -v --remove-orphans
        print_color $GREEN "Docker services cleaned"
        ;;
        
    build)
        print_color $CYAN "=== Building Monorepo ==="
        pnpm run build
        ;;
        
    test)
        print_color $CYAN "=== Running Tests ==="
        pnpm run test
        ;;
        
    lint)
        print_color $CYAN "=== Running Linting ==="
        pnpm run lint
        ;;
        
    status)
        show_status
        ;;
        
    stop)
        stop_services
        ;;
        
    clean)
        print_color $CYAN "=== Cleaning Monorepo ==="
        stop_services
        pnpm run clean
        print_color $GREEN "Cleanup complete"
        ;;
        
    reset)
        print_color $CYAN "=== Resetting Monorepo ==="
        stop_services
        pnpm run clean
        pnpm run setup
        print_color $GREEN "Reset complete"
        ;;
        
    help|*)
        show_usage
        ;;
esac