import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestedQueries } from '../SuggestedQueries';
import { jest } from '@jest/globals';

describe('SuggestedQueries', () => {
  const mockOnSelect = jest.fn();
  
  const defaultQueries = [
    'How can I reduce energy consumption?',
    'Show me this months sustainability metrics',
    'What are my current carbon emissions?'
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render suggested queries', () => {
    render(<SuggestedQueries queries={defaultQueries} onSelect={mockOnSelect} />);
    
    defaultQueries.forEach(query => {
      expect(screen.getByText(query)).toBeInTheDocument();
    });
  });

  it('should call onSelect when query is clicked', () => {
    render(<SuggestedQueries queries={defaultQueries} onSelect={mockOnSelect} />);
    
    fireEvent.click(screen.getByText(defaultQueries[0]));
    expect(mockOnSelect).toHaveBeenCalledWith(defaultQueries[0]);
  });

  it('should render with custom className', () => {
    const { container } = render(
      <SuggestedQueries 
        queries={defaultQueries} 
        onSelect={mockOnSelect}
        className="custom-class" 
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should handle empty queries array', () => {
    render(<SuggestedQueries queries={[]} onSelect={mockOnSelect} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render query buttons with proper styling', () => {
    render(<SuggestedQueries queries={defaultQueries} onSelect={mockOnSelect} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('glass-morphism');
      expect(button).toHaveClass('hover:scale-105');
    });
  });

  it('should handle keyboard navigation', () => {
    render(<SuggestedQueries queries={defaultQueries} onSelect={mockOnSelect} />);
    
    const firstButton = screen.getByText(defaultQueries[0]);
    fireEvent.keyDown(firstButton, { key: 'Enter' });
    
    expect(mockOnSelect).toHaveBeenCalledWith(defaultQueries[0]);
  });
});