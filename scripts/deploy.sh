#!/bin/bash

# Production Deployment Script for Qupedia Backend
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="qupedia-backend"
DOCKER_IMAGE="$APP_NAME:latest"
CONTAINER_NAME="$APP_NAME-container"
NETWORK_NAME="qupedia-network"
ENV_FILE=".env"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env file not found. Please create it from .env.example"
        exit 1
    fi
    
    log_success "All requirements met"
}

validate_env() {
    log_info "Validating environment configuration..."
    
    # Required environment variables
    required_vars=(
        "NODE_ENV"
        "PORT"
        "DB_HOST"
        "DB_PORT"
        "DB_USERNAME"
        "DB_PASSWORD"
        "DB_DATABASE"
        "JWT_SECRET"
        "REDIS_HOST"
        "REDIS_PORT"
    )
    
    source "$ENV_FILE"
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check if NODE_ENV is set to production
    if [ "$NODE_ENV" != "production" ]; then
        log_warning "NODE_ENV is not set to 'production'. Current value: $NODE_ENV"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Environment validation completed"
}

build_application() {
    log_info "Building application..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --only=production
    
    # Build the application
    log_info "Building TypeScript application..."
    npm run build
    
    log_success "Application built successfully"
}

build_docker_image() {
    log_info "Building Docker image..."
    
    # Build the Docker image
    docker build -t "$DOCKER_IMAGE" .
    
    log_success "Docker image built: $DOCKER_IMAGE"
}

stop_existing_containers() {
    log_info "Stopping existing containers..."
    
    # Stop and remove existing container if it exists
    if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
        log_info "Stopping existing container: $CONTAINER_NAME"
        docker stop "$CONTAINER_NAME" || true
        docker rm "$CONTAINER_NAME" || true
    fi
    
    log_success "Existing containers stopped"
}

create_network() {
    log_info "Creating Docker network..."
    
    # Create network if it doesn't exist
    if ! docker network ls | grep -q "$NETWORK_NAME"; then
        docker network create "$NETWORK_NAME"
        log_success "Network created: $NETWORK_NAME"
    else
        log_info "Network already exists: $NETWORK_NAME"
    fi
}

run_migrations() {
    log_info "Running database migrations..."
    
    # Run migrations using a temporary container
    docker run --rm \
        --env-file "$ENV_FILE" \
        --network "$NETWORK_NAME" \
        "$DOCKER_IMAGE" \
        npm run migration:run
    
    log_success "Database migrations completed"
}

deploy_application() {
    log_info "Deploying application..."
    
    # Run the application container
    docker run -d \
        --name "$CONTAINER_NAME" \
        --env-file "$ENV_FILE" \
        --network "$NETWORK_NAME" \
        -p 3000:3000 \
        --restart unless-stopped \
        --health-cmd="node healthcheck.js" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        "$DOCKER_IMAGE"
    
    log_success "Application deployed successfully"
}

wait_for_health() {
    log_info "Waiting for application to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec "$CONTAINER_NAME" node healthcheck.js &> /dev/null; then
            log_success "Application is healthy"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: Application not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Application failed to become healthy within expected time"
    return 1
}

show_status() {
    log_info "Deployment Status:"
    echo
    echo "Container Status:"
    docker ps -f name="$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo
    echo "Application Logs (last 20 lines):"
    docker logs --tail 20 "$CONTAINER_NAME"
    echo
    echo "Health Check:"
    if docker exec "$CONTAINER_NAME" node healthcheck.js &> /dev/null; then
        log_success "✓ Application is healthy"
    else
        log_error "✗ Application health check failed"
    fi
    echo
    echo "Access URLs:"
    echo "  - API: http://localhost:3000"
    echo "  - Health: http://localhost:3000/health"
    echo "  - Documentation: http://localhost:3000/api/docs"
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    log_success "Cleanup completed"
}

# Main deployment process
main() {
    log_info "Starting Qupedia Backend Deployment"
    echo "======================================"
    
    check_requirements
    validate_env
    build_application
    build_docker_image
    stop_existing_containers
    create_network
    run_migrations
    deploy_application
    
    if wait_for_health; then
        show_status
        cleanup
        log_success "Deployment completed successfully!"
    else
        log_error "Deployment failed - application is not healthy"
        docker logs "$CONTAINER_NAME"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "--help" | "-h")
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --status       Show current deployment status"
        echo "  --logs         Show application logs"
        echo "  --stop         Stop the application"
        echo "  --restart      Restart the application"
        exit 0
        ;;
    "--status")
        show_status
        exit 0
        ;;
    "--logs")
        docker logs -f "$CONTAINER_NAME"
        exit 0
        ;;
    "--stop")
        log_info "Stopping application..."
        docker stop "$CONTAINER_NAME"
        log_success "Application stopped"
        exit 0
        ;;
    "--restart")
        log_info "Restarting application..."
        docker restart "$CONTAINER_NAME"
        if wait_for_health; then
            log_success "Application restarted successfully"
        else
            log_error "Application restart failed"
            exit 1
        fi
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac