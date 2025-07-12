import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import { GlassCard } from '../GlassCard';

describe('GlassCard', () => {
  it('should render with children', () => {
    render(<GlassCard>Card Content</GlassCard>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should handle onClick when provided', () => {
    const handleClick = jest.fn();
    const { container } = render(<GlassCard onClick={handleClick}>Clickable</GlassCard>);
    
    const card = container.firstChild as HTMLElement;
    fireEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply correct classes for variants', () => {
    const { container: defaultContainer } = render(<GlassCard variant="default">Default</GlassCard>);
    const { container: elevatedContainer } = render(<GlassCard variant="elevated">Elevated</GlassCard>);
    const { container: outlinedContainer } = render(<GlassCard variant="outlined">Outlined</GlassCard>);
    
    const defaultCard = defaultContainer.firstChild as HTMLElement;
    const elevatedCard = elevatedContainer.firstChild as HTMLElement;
    const outlinedCard = outlinedContainer.firstChild as HTMLElement;
    
    expect(defaultCard.className).toContain('glass-card-default');
    expect(elevatedCard.className).toContain('glass-card-elevated');
    expect(outlinedCard.className).toContain('glass-card-outlined');
  });

  it('should handle multiple children', () => {
    render(
      <GlassCard>
        <span>Child 1</span>
        <span>Child 2</span>
      </GlassCard>
    );
    
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('should combine custom className with default classes', () => {
    const { container } = render(
      <GlassCard className="custom-class" variant="elevated">
        Content
      </GlassCard>
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('glass-card');
    expect(card.className).toContain('glass-card-elevated');
    expect(card.className).toContain('custom-class');
  });
});