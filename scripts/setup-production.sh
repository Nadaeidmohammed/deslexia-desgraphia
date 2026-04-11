#!/bin/bash

# Production Environment Setup Script for Qupedia Backend
# This script sets up the production environment and dependencies

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

check_system() {
    log_info "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        log_info "Detected Linux system"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        log_info "Detected macOS system"
    else
        log_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    
    # Check if running as root (not recommended)
    if [ "$EUID" -eq 0 ]; then
        log_warning "Running as root is not recommended for production"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "System check completed"
}

install_node() {
    log_info "Checking Node.js installation..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js is already installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 18 ]; then
            log_warning "Node.js version $NODE_VERSION is below recommended version 18+"
        else
            log_success "Node.js version is compatible"
            return 0
        fi
    fi
    
    log_info "Installing Node.js 20 LTS..."
    
    if [ "$OS" = "linux" ]; then
        # Install Node.js using NodeSource repository
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" = "macos" ]; then
        # Install Node.js using Homebrew
        if command -v brew &> /dev/null; then
            brew install node@20
        else
            log_error "Homebrew not found. Please install Node.js 20+ manually"
            exit 1
        fi
    fi
    
    log_success "Node.js installed successfully"
}

install_docker() {
    log_info "Checking Docker installation..."
    
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        log_info "Docker is already installed: $DOCKER_VERSION"
        
        # Check if Docker daemon is running
        if docker info &> /dev/null; then
            log_success "Docker daemon is running"
        else
            log_warning "Docker daemon is not running. Please start Docker service"
        fi
        return 0
    fi
    
    log_info "Installing Docker..."
    
    if [ "$OS" = "linux" ]; then
        # Install Docker on Linux
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        
        # Install Docker Compose
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        log_warning "Please log out and log back in for Docker group changes to take effect"
    elif [ "$OS" = "macos" ]; then
        log_error "Please install Docker Desktop for Mac manually from https://docker.com"
        exit 1
    fi
    
    log_success "Docker installed successfully"
}

setup_directories() {
    log_info "Setting up application directories..."
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p uploads
    mkdir -p backups
    mkdir -p scripts
    
    # Set proper permissions
    chmod 755 logs uploads backups scripts
    
    log_success "Directories created successfully"
}

setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Copy environment template if .env doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_info "Created .env from .env.example"
            log_warning "Please edit .env file with your production configuration"
        else
            log_error ".env.example not found"
            exit 1
        fi
    else
        log_info ".env file already exists"
    fi
    
    # Set secure permissions for .env file
    chmod 600 .env
    
    log_success "Environment setup completed"
}

install_dependencies() {
    log_info "Installing application dependencies..."
    
    # Install production dependencies
    npm ci --only=production
    
    log_success "Dependencies installed successfully"
}

setup_database() {
    log_info "Setting up database configuration..."
    
    # Check if database configuration is present
    if grep -q "DB_HOST=" .env && grep -q "DB_DATABASE=" .env; then
        log_info "Database configuration found in .env"
        
        # Test database connection (optional)
        read -p "Test database connection? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Testing database connection..."
            if npm run migration:run --dry-run &> /dev/null; then
                log_success "Database connection successful"
            else
                log_warning "Database connection test failed. Please check your configuration"
            fi
        fi
    else
        log_warning "Database configuration not found in .env"
        log_info "Please configure database settings in .env file"
    fi
}

setup_ssl() {
    log_info "Setting up SSL configuration..."
    
    # Create SSL directory
    mkdir -p ssl
    chmod 700 ssl
    
    if [ ! -f "ssl/server.crt" ] || [ ! -f "ssl/server.key" ]; then
        log_info "SSL certificates not found"
        read -p "Generate self-signed SSL certificates for development? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            openssl req -x509 -newkey rsa:4096 -keyout ssl/server.key -out ssl/server.crt -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
            chmod 600 ssl/server.key ssl/server.crt
            log_success "Self-signed SSL certificates generated"
            log_warning "For production, please use certificates from a trusted CA"
        fi
    else
        log_info "SSL certificates already exist"
    fi
}

setup_systemd_service() {
    if [ "$OS" = "linux" ]; then
        log_info "Setting up systemd service..."
        
        read -p "Create systemd service for auto-start? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            APP_DIR=$(pwd)
            USER=$(whoami)
            
            sudo tee /etc/systemd/system/qupedia-backend.service > /dev/null <<EOF
[Unit]
Description=Qupedia Backend API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm run start:prod
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/.env

[Install]
WantedBy=multi-user.target
EOF
            
            sudo systemctl daemon-reload
            sudo systemctl enable qupedia-backend
            
            log_success "Systemd service created and enabled"
            log_info "Use 'sudo systemctl start qupedia-backend' to start the service"
        fi
    fi
}

setup_logrotate() {
    if [ "$OS" = "linux" ]; then
        log_info "Setting up log rotation..."
        
        read -p "Setup log rotation? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            APP_DIR=$(pwd)
            
            sudo tee /etc/logrotate.d/qupedia-backend > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    create 644 $(whoami) $(whoami)
}
EOF
            
            log_success "Log rotation configured"
        fi
    fi
}

show_summary() {
    log_info "Production Setup Summary"
    echo "========================"
    echo
    echo "✓ System requirements checked"
    echo "✓ Node.js installed/verified"
    echo "✓ Docker installed/verified"
    echo "✓ Application directories created"
    echo "✓ Environment configuration setup"
    echo "✓ Dependencies installed"
    echo "✓ Database configuration checked"
    echo "✓ SSL configuration setup"
    echo
    echo "Next Steps:"
    echo "1. Edit .env file with your production configuration"
    echo "2. Configure your database and Redis settings"
    echo "3. Set up your AWS S3 credentials"
    echo "4. Run database migrations: npm run migration:run"
    echo "5. Deploy the application: ./scripts/deploy.sh"
    echo
    echo "For more information, see README.md"
}

# Main setup process
main() {
    log_info "Starting Qupedia Backend Production Setup"
    echo "==========================================="
    
    check_system
    install_node
    install_docker
    setup_directories
    setup_environment
    install_dependencies
    setup_database
    setup_ssl
    setup_systemd_service
    setup_logrotate
    
    show_summary
    log_success "Production setup completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    "--help" | "-h")
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --check        Check system requirements only"
        exit 0
        ;;
    "--check")
        check_system
        install_node
        install_docker
        log_success "System check completed"
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