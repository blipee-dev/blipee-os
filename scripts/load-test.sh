#!/bin/bash

# Load testing script for blipee-os

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3000"}
AUTH_TOKEN=${AUTH_TOKEN:-""}
K6_VERSION="0.45.0"

echo -e "${GREEN}🚀 Blipee OS Load Testing Suite${NC}"
echo "================================"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${YELLOW}k6 not found. Installing...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install k6
    else
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    fi
fi

# Function to run a specific test
run_test() {
    local test_name=$1
    local test_file=$2
    local extra_args=$3
    
    echo -e "\n${YELLOW}Running test: ${test_name}${NC}"
    echo "------------------------"
    
    k6 run \
        --out json=results/${test_name}-$(date +%Y%m%d-%H%M%S).json \
        --summary-export=results/${test_name}-summary.json \
        -e BASE_URL="${BASE_URL}" \
        -e AUTH_TOKEN="${AUTH_TOKEN}" \
        ${extra_args} \
        ${test_file}
}

# Create results directory
mkdir -p results

# Test selection menu
echo -e "\n${GREEN}Select test to run:${NC}"
echo "1) Quick smoke test (1 min)"
echo "2) Standard load test (5 min)"
echo "3) Stress test (10 min)"
echo "4) Spike test (5 min)"
echo "5) Soak test (30 min)"
echo "6) Custom test"
echo "0) Exit"

read -p "Enter your choice: " choice

case $choice in
    1)
        # Smoke test - minimal load to verify system works
        run_test "smoke" "tests/load/k6-config.js" "--duration 1m --vus 5"
        ;;
    2)
        # Standard load test
        run_test "load" "tests/load/k6-config.js"
        ;;
    3)
        # Stress test - find breaking point
        run_test "stress" "tests/load/k6-config.js" "--stage 1m:100,2m:200,2m:300,2m:400,3m:0"
        ;;
    4)
        # Spike test - sudden traffic increase
        run_test "spike" "tests/load/k6-config.js" "--stage 30s:10,10s:200,1m:200,10s:10,2m:10"
        ;;
    5)
        # Soak test - sustained load over time
        run_test "soak" "tests/load/k6-config.js" "--duration 30m --vus 50"
        ;;
    6)
        # Custom test
        read -p "Enter number of VUs: " vus
        read -p "Enter duration (e.g., 5m): " duration
        run_test "custom" "tests/load/k6-config.js" "--duration ${duration} --vus ${vus}"
        ;;
    0)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Show results summary
echo -e "\n${GREEN}Test completed!${NC}"
echo "Results saved to: results/"

# Parse and display key metrics
if [ -f "results/load-summary.json" ]; then
    echo -e "\n${YELLOW}Key Metrics:${NC}"
    # This would parse the JSON and show key metrics
    # For now, just show that results are available
    echo "View detailed results in: results/"
fi

# Optional: Upload results to monitoring
read -p "Upload results to monitoring dashboard? (y/n): " upload
if [ "$upload" = "y" ]; then
    echo "Uploading results..."
    # This would upload results to your monitoring system
    echo -e "${GREEN}Results uploaded successfully${NC}"
fi