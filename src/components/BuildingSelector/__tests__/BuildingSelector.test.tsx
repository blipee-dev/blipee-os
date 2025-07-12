import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuildingSelector } from '../BuildingSelector';
import { jest } from '@jest/globals';

// Mock the Supabase hooks
jest.mock('@/lib/supabase/client', () => ({
  useBuildings: jest.fn(() => ({
    buildings: [
      { id: '1', name: 'Building A', address: '123 Main St' },
      { id: '2', name: 'Building B', address: '456 Oak Ave' }
    ],
    loading: false,
    error: null
  })),
  useSelectedBuilding: jest.fn(() => ({
    selectedBuilding: { id: '1', name: 'Building A' },
    setSelectedBuilding: jest.fn()
  }))
}));

describe('BuildingSelector', () => {
  it('should render building selector', () => {
    render(<BuildingSelector />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should show selected building', () => {
    render(<BuildingSelector />);
    expect(screen.getByText('Building A')).toBeInTheDocument();
  });

  it('should show building list on click', () => {
    render(<BuildingSelector />);
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    
    expect(screen.getByText('Building B')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    const { useBuildings } = require('@/lib/supabase/client');
    useBuildings.mockReturnValue({
      buildings: [],
      loading: true,
      error: null
    });

    render(<BuildingSelector />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    const { useBuildings } = require('@/lib/supabase/client');
    useBuildings.mockReturnValue({
      buildings: [],
      loading: false,
      error: new Error('Failed to load buildings')
    });

    render(<BuildingSelector />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('should handle no buildings', () => {
    const { useBuildings } = require('@/lib/supabase/client');
    useBuildings.mockReturnValue({
      buildings: [],
      loading: false,
      error: null
    });

    render(<BuildingSelector />);
    expect(screen.getByText(/no buildings/i)).toBeInTheDocument();
  });
});