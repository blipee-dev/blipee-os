#!/bin/bash

echo "Fixing malformed function parameter syntax..."

# Fix routes with double parentheses pattern
find src/app/api -type f -name "*.ts" -exec sed -i '' \
  -e 's/export async function GET((_request:/export async function GET(_request:/g' \
  -e 's/export async function POST((_request:/export async function POST(_request:/g' \
  -e 's/export async function PUT((_request:/export async function PUT(_request:/g' \
  -e 's/export async function DELETE((_request:/export async function DELETE(_request:/g' \
  -e 's/export async function PATCH((_request:/export async function PATCH(_request:/g' \
  -e 's/export const GET = withAuth(withErrorHandler(async ((_request:/export const GET = withAuth(withErrorHandler(async (_request:/g' \
  -e 's/export const POST = withAuth(withErrorHandler(async ((_request:/export const POST = withAuth(withErrorHandler(async (_request:/g' \
  -e 's/export const GET = withAPIGateway(async ((_request:/export const GET = withAPIGateway(async (_request:/g' \
  -e 's/export const POST = withAPIGateway(async ((_request:/export const POST = withAPIGateway(async (_request:/g' \
  -e 's/async function handleGetAnalytics((_request:/async function handleGetAnalytics(_request:/g' \
  -e 's/async function handlePostAnalytics((_request:/async function handlePostAnalytics(_request:/g' {} \;

# Fix routes with underscore pattern in wrong place
find src/app/api -type f -name "*.ts" -exec sed -i '' \
  -e 's/export async function GET(_(/export async function GET(/g' \
  -e 's/export async function POST(_(/export async function POST(/g' \
  -e 's/export async function PUT(_(/export async function PUT(/g' \
  -e 's/export async function DELETE(_(/export async function DELETE(/g' {} \;

echo "Function syntax fixes applied!"