#!/bin/bash

# HRMS Docker Setup and Installation Script
# This script automatically installs Docker and Docker Compose if not present,
# then sets up the HRMS application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command_exists lsb_release; then
            DISTRO=$(lsb_release -is | tr '[:upper:]' '[:lower:]')
            VERSION=$(lsb_release -rs)
        elif [[ -f /etc/os-release ]]; then
            . /etc/os-release
            DISTRO=$ID
            VERSION=$VERSION_ID
        elif [[ -f /etc/debian_version ]]; then
            DISTRO="debian"
        elif [[ -f /etc/redhat-release ]]; then
            DISTRO="rhel"
        else
            DISTRO="unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        DISTRO="macos"
    else
        DISTRO="unknown"
    fi

    echo "$DISTRO"
}

# Function to install Docker on Ubuntu/Debian
install_docker_debian() {
    print_status "Installing Docker on Debian/Ubuntu..."

    # Update package index
    sudo apt-get update

    # Install prerequisites
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Set up stable repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Update package index again
    sudo apt-get update

    # Install Docker Engine
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Start and enable Docker service
    sudo systemctl start docker
    sudo systemctl enable docker

    # Add current user to docker group
    sudo usermod -aG docker $USER

    print_success "Docker installed successfully"
    print_warning "You may need to log out and back in for Docker group changes to take effect"
}

# Function to install Docker on CentOS/RHEL/Fedora
install_docker_rhel() {
    print_status "Installing Docker on RHEL/CentOS/Fedora..."

    # Install prerequisites
    sudo dnf install -y dnf-plugins-core || sudo yum install -y yum-utils

    # Add Docker repository
    sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo || \
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

    # Install Docker
    sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin || \
    sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Start and enable Docker service
    sudo systemctl start docker
    sudo systemctl enable docker

    # Add current user to docker group
    sudo usermod -aG docker $USER

    print_success "Docker installed successfully"
    print_warning "You may need to log out and back in for Docker group changes to take effect"
}

# Function to install Docker on macOS
install_docker_macos() {
    print_status "Installing Docker on macOS..."

    if command_exists brew; then
        brew install --cask docker
        print_success "Docker installed via Homebrew"
        print_warning "Please start Docker Desktop from Applications folder"
    else
        print_error "Homebrew not found. Please install Homebrew first: https://brew.sh/"
        print_status "Then run: brew install --cask docker"
        exit 1
    fi
}

# Function to install Docker based on OS
install_docker() {
    local os=$(detect_os)

    case $os in
        ubuntu|debian)
            install_docker_debian
            ;;
        centos|rhel|fedora)
            install_docker_rhel
            ;;
        macos)
            install_docker_macos
            ;;
        *)
            print_error "Unsupported OS: $os"
            print_status "Please install Docker manually from: https://docs.docker.com/get-docker/"
            exit 1
            ;;
    esac
}

# Main script
echo -e "${BLUE}🚀 HRMS Docker Setup & Installation${NC}"
echo "====================================="
echo ""

# Check if running as root (not recommended for Docker)
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root is not recommended for Docker installation"
    print_status "Consider running as a regular user with sudo privileges"
fi

# Check and install Docker if needed
if command_exists docker; then
    print_success "Docker is already installed"
    docker --version
else
    print_warning "Docker is not installed. Installing Docker..."
    install_docker
fi

# Check Docker Compose (new plugin or standalone)
if docker compose version >/dev/null 2>&1; then
    print_success "Docker Compose (plugin) is available"
    docker compose version
elif command_exists docker-compose; then
    print_success "Docker Compose (standalone) is available"
    docker-compose --version
else
    print_warning "Docker Compose not found as plugin, checking if we need to install standalone version..."
    # Docker Compose plugin should be included with Docker installation above
    # If not, we might need additional installation
    print_error "Docker Compose not found. Please check your Docker installation."
    exit 1
fi

# Test Docker installation
print_status "Testing Docker installation..."
if sudo -n docker run --rm hello-world >/dev/null 2>&1; then
    print_success "Docker is working correctly"
elif docker run --rm hello-world >/dev/null 2>&1; then
    print_success "Docker is working correctly"
else
    print_error "Docker test failed. You may need to log out and back in for group changes to take effect."
    print_status "Alternatively, try running: sudo systemctl restart docker"
    exit 1
fi

echo ""
print_success "All Docker components are ready!"

# Now proceed with the existing setup logic
echo ""
echo -e "${BLUE}📋 Continuing with HRMS setup...${NC}"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p docker/volumes/mongodb
mkdir -p uploads/excel
mkdir -p uploads/selfies
mkdir -p logs

# Set proper permissions
print_status "Setting proper permissions..."
sudo chown -R $USER:$USER docker/volumes/ uploads/ logs/ 2>/dev/null || true

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."

    if [ -f "docker/.env.docker.example" ]; then
        cp docker/.env.docker.example .env
        print_success "Created .env file from template"
        print_warning "Please edit .env file with your configuration:"
        echo "   - EMAIL_USER and EMAIL_PASSWORD (required)"
        echo "   - JWT_SECRET (recommended to change)"
        echo "   - Other settings as needed"
        echo ""
        echo -e "${BLUE}Edit the .env file now? (y/n)${NC}"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            ${EDITOR:-nano} .env
        fi
    else
        print_error "Template file not found. Please create .env manually."
        exit 1
    fi
else
    print_success ".env file already exists"
fi

# Check if required environment variables are set
print_status "Checking environment configuration..."

if ! grep -q "EMAIL_USER=.*@.*" .env 2>/dev/null; then
    print_warning "EMAIL_USER is not set or looks invalid"
fi

if ! grep -q "EMAIL_PASSWORD=" .env 2>/dev/null || grep -q "EMAIL_PASSWORD=your-" .env 2>/dev/null; then
    print_warning "EMAIL_PASSWORD is not set or using default value"
fi

# Start the services
print_status "Starting Docker services..."
if command_exists docker-compose; then
    docker-compose up -d
elif docker compose version >/dev/null 2>&1; then
    docker compose up -d
else
    print_error "No Docker Compose command found"
    exit 1
fi

# Wait for services to be healthy
print_status "Waiting for services to start..."
sleep 10

# Check service status
print_status "Checking service status..."
if command_exists docker-compose; then
    docker-compose ps
elif docker compose version >/dev/null 2>&1; then
    docker compose ps
fi

# Show access information
echo ""
echo -e "${GREEN}🎉 HRMS is now running!${NC}"
echo "=============================="
echo -e "${GREEN}📱 HRMS Application:${NC} http://localhost:3000"
echo -e "${GREEN}🗄️  MongoDB Admin UI:${NC}  http://localhost:8081 (admin/pass123)"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  View logs: docker compose logs -f"
echo "  Stop services: docker compose down"
echo "  Restart: docker compose restart"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  - Your data is saved in ./docker/volumes/mongodb/"
echo "  - Uploaded files are in ./uploads/"
echo "  - Never delete these folders unless you want to lose data"
echo ""
echo -e "${BLUE}Need help? Check the README.md or run: docker compose logs -f hrms-app${NC}"

print_success "Setup completed successfully!"