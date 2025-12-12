#!/bin/bash

# Docker Initialization Script for HRMS
# This script helps you set up and run HRMS with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 HRMS Docker Setup${NC}"
echo "========================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"

# Create necessary directories
echo -e "${BLUE}📁 Creating necessary directories...${NC}"
mkdir -p docker/volumes/mongodb
mkdir -p uploads/excel
mkdir -p uploads/selfies
mkdir -p logs

# Set proper permissions
echo -e "${BLUE}🔐 Setting proper permissions...${NC}"
sudo chown -R $USER:$USER docker/volumes/ uploads/ logs/ 2>/dev/null || true

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"

    if [ -f "docker/.env.docker.example" ]; then
        cp docker/.env.docker.example .env
        echo -e "${GREEN}✅ Created .env file from template${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env file with your configuration:${NC}"
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
        echo -e "${RED}❌ Template file not found. Please create .env manually.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Check if required environment variables are set
echo -e "${BLUE}🔍 Checking environment configuration...${NC}"

if ! grep -q "EMAIL_USER=.*@.*" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  EMAIL_USER is not set or looks invalid${NC}"
fi

if ! grep -q "EMAIL_PASSWORD=" .env 2>/dev/null || grep -q "EMAIL_PASSWORD=your-" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  EMAIL_PASSWORD is not set or using default value${NC}"
fi

# Start the services
echo -e "${BLUE}🐳 Starting Docker services...${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 10

# Check service status
echo -e "${BLUE}📊 Checking service status...${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose ps
else
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
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart: docker-compose restart"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  - Your data is saved in ./docker/volumes/mongodb/"
echo "  - Uploaded files are in ./uploads/"
echo "  - Never delete these folders unless you want to lose data"
echo ""
echo -e "${BLUE}Need help? Check the README.md or run: docker-compose logs -f hrms-app${NC}"
