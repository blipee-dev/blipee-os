#!/bin/bash

# Blipee OS Monitoring Stack Startup Script
# This script starts all monitoring services using Docker Compose

echo "🚀 Starting Blipee OS Monitoring Stack..."
echo "================================================"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker and Docker Compose first"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available"
    echo "Please install Docker Compose V2"
    exit 1
fi

# Navigate to monitoring directory
cd "$(dirname "$0")"

echo "📦 Pulling latest images..."
docker compose pull

echo "🔧 Starting services..."
docker compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "📊 Checking service status..."
docker compose ps

echo ""
echo "✅ Monitoring stack is starting up!"
echo "================================================"
echo "🌐 Access URLs:"
echo "   • Blipee OS App:      http://localhost:3000"
echo "   • Monitoring Page:    http://localhost:3000/settings/monitoring"
echo "   • Grafana Dashboard:  http://localhost:3001 (admin/admin123)"
echo "   • Prometheus:         http://localhost:9090"
echo "   • AlertManager:       http://localhost:9093"
echo "   • Node Exporter:      http://localhost:9100"
echo "   • cAdvisor:           http://localhost:8080"
echo ""
echo "📝 To view logs: docker compose logs -f"
echo "🛑 To stop:      docker compose down"
echo "================================================"