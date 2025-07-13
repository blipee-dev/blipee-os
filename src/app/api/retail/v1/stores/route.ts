import { NextRequest, NextResponse } from 'next/server';

// Mock store data for testing
const mockStores = [
  {
    id: 'OML01',
    name: 'OML01-Omnia GuimarãesShopping',
    code: 'OML01',
    is_active: true,
    location: 'Guimarães, Portugal',
  },
  {
    id: 'OML02',
    name: 'OML02-Omnia Fórum Almada',
    code: 'OML02',
    is_active: true,
    location: 'Almada, Portugal',
  },
  {
    id: 'ONL01',
    name: 'ONL01-Only UBBO Amadora',
    code: 'ONL01',
    is_active: true,
    location: 'Amadora, Portugal',
  },
];

export async function GET(request: NextRequest) {
  try {
    // For now, return mock data
    // TODO: Replace with actual database query
    
    return NextResponse.json({
      success: true,
      stores: mockStores,
      total: mockStores.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}