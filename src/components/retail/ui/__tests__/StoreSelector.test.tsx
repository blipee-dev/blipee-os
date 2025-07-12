import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoreSelector } from '../StoreSelector';
import '@testing-library/jest-dom';

const mockStores = [
  { id: 'OML01', name: 'Store 1', code: 'OML01', is_active: true, location: 'Location 1' },
  { id: 'OML02', name: 'Store 2', code: 'OML02', is_active: true, location: 'Location 2' },
  { id: 'ONL01', name: 'Store 3', code: 'ONL01', is_active: false, location: 'Location 3' },
];

describe('StoreSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render store selector with title', () => {
    render(
      <StoreSelector
        stores={mockStores}
        selectedStore="OML01"
        onStoreChange={mockOnChange}
      />
    );

    expect(screen.getByText('Select Store')).toBeInTheDocument();
  });

  it('should display all stores', () => {
    render(
      <StoreSelector
        stores={mockStores}
        selectedStore="OML01"
        onStoreChange={mockOnChange}
      />
    );

    mockStores.forEach(store => {
      expect(screen.getByText(store.name)).toBeInTheDocument();
    });
  });

  it('should highlight selected store', () => {
    render(
      <StoreSelector
        stores={mockStores}
        selectedStore="OML02"
        onStoreChange={mockOnChange}
      />
    );

    const selectedButton = screen.getByText('Store 2').closest('button');
    expect(selectedButton).toHaveClass('bg-purple-500/20');
  });

  it('should call onChange when store is clicked', () => {
    render(
      <StoreSelector
        stores={mockStores}
        selectedStore="OML01"
        onStoreChange={mockOnChange}
      />
    );

    fireEvent.click(screen.getByText('Store 2'));
    expect(mockOnChange).toHaveBeenCalledWith('OML02');
  });

  it('should show active status for active stores', () => {
    render(
      <StoreSelector
        stores={mockStores}
        selectedStore="OML01"
        onStoreChange={mockOnChange}
      />
    );

    const activeStores = screen.getAllByText('Active');
    expect(activeStores).toHaveLength(2);
  });

  it('should show inactive status for inactive stores', () => {
    render(
      <StoreSelector
        stores={mockStores}
        selectedStore="OML01"
        onStoreChange={mockOnChange}
      />
    );

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should display store locations', () => {
    render(
      <StoreSelector
        stores={mockStores}
        selectedStore="OML01"
        onStoreChange={mockOnChange}
      />
    );

    expect(screen.getByText('Location 1')).toBeInTheDocument();
    expect(screen.getByText('Location 2')).toBeInTheDocument();
  });

  it('should show empty state when no stores', () => {
    render(
      <StoreSelector
        stores={[]}
        selectedStore=""
        onStoreChange={mockOnChange}
      />
    );

    expect(screen.getByText('No stores available')).toBeInTheDocument();
  });

  it('should not break when selectedStore is not in list', () => {
    render(
      <StoreSelector
        stores={mockStores}
        selectedStore="INVALID"
        onStoreChange={mockOnChange}
      />
    );

    // Should still render all stores
    expect(screen.getByText('Store 1')).toBeInTheDocument();
  });
});