#!/bin/bash

# Security Test Suite Runner
# This script runs comprehensive security tests for the blipee OS platform

set -e

echo "🔐 Starting Security Test Suite..."
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if Jest is available
if ! npm list jest &> /dev/null; then
    print_warning "Jest is not installed. Installing Jest..."
    npm install --save-dev jest @jest/globals ts-jest @types/jest
    npm install --save-dev jest-junit jest-html-reporters
fi

print_success "Prerequisites check passed"

# Create necessary directories
print_status "Creating test directories..."
mkdir -p test-results
mkdir -p coverage
mkdir -p .jest-cache

# Set environment variables for testing
export NODE_ENV=test
export JEST_WORKER_ID=1
export ENCRYPTION_PROVIDER=local
export KEY_STORE_PATH=./.test-keys

print_status "Running security tests..."

# Run specific test categories
echo ""
echo "🧪 Running Encryption Tests..."
echo "=============================="
npm test -- --testPathPattern="encryption\.test\.ts" --verbose

echo ""
echo "🛡️  Running Rate Limiting Tests..."
echo "=================================="
npm test -- --testPathPattern="rate-limit\.test\.ts" --verbose

echo ""
echo "🔑 Running MFA Tests..."
echo "======================"
npm test -- --testPathPattern="mfa\.test\.ts" --verbose

echo ""
echo "🔐 Running WebAuthn Tests..."
echo "==========================="
npm test -- --testPathPattern="webauthn\.test\.ts" --verbose

echo ""
echo "🔄 Running Integration Tests..."
echo "==============================="
npm test -- --testPathPattern="integration\.test\.ts" --verbose

echo ""
echo "📊 Running All Security Tests with Coverage..."
echo "=============================================="
npm test -- --testPathPattern="__tests__" --coverage --coverageReporters=text --coverageReporters=html --coverageReporters=lcov

# Check test results
if [ $? -eq 0 ]; then
    print_success "All security tests passed!"
else
    print_error "Some security tests failed!"
    exit 1
fi

echo ""
echo "📈 Test Coverage Report:"
echo "========================"
if [ -f coverage/lcov-report/index.html ]; then
    print_status "Coverage report generated: coverage/lcov-report/index.html"
else
    print_warning "Coverage report not found"
fi

echo ""
echo "📝 Test Results:"
echo "==============="
if [ -f test-results/junit.xml ]; then
    print_status "JUnit report generated: test-results/junit.xml"
else
    print_warning "JUnit report not found"
fi

if [ -f test-results/test-report.html ]; then
    print_status "HTML report generated: test-results/test-report.html"
else
    print_warning "HTML report not found"
fi

echo ""
echo "🎯 Security Test Summary:"
echo "=========================="
echo "✅ Encryption & Key Management"
echo "✅ Rate Limiting & DDoS Protection"
echo "✅ Multi-Factor Authentication"
echo "✅ WebAuthn/FIDO2 Security"
echo "✅ Integration & Attack Vector Tests"

echo ""
print_success "Security test suite completed successfully!"
echo "🔐 All security components are properly tested and validated."

# Optional: Run security-specific linting
echo ""
echo "🔍 Running Security-Focused Linting..."
echo "======================================"
if command -v eslint &> /dev/null; then
    npx eslint src/lib/security/ src/lib/auth/ src/lib/audit/ --ext .ts,.tsx --config .eslintrc.js --no-error-on-unmatched-pattern || true
else
    print_warning "ESLint not found. Skipping security linting."
fi

# Optional: Run dependency security audit
echo ""
echo "🔎 Running Dependency Security Audit..."
echo "======================================="
npm audit --audit-level=moderate || print_warning "Some dependencies have security vulnerabilities"

echo ""
echo "🎉 Security test suite execution complete!"
echo "Check the generated reports for detailed results."