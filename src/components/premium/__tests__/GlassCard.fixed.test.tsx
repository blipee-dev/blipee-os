import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import { GlassCard } from '../GlassCard';

describe('GlassCard', () => {
  describe('Basic rendering', () => {
    it('should render with children', () => {
      render(<GlassCard>Card Content</GlassCard>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should render as div element', () => {
      render(<GlassCard>Content</GlassCard>);
      const card = screen.getByText('Content').parentElement;
      expect(card?.tagName).toBe('DIV');
    });

    it('should apply default variant class', () => {
      const { container } = render(<GlassCard>Content</GlassCard>);
      const card = container.querySelector('.glass-card');
      expect(card).toBeInTheDocument();
      expect(card?.className).toContain('glass-card');
      expect(card?.className).toContain('glass-card-default');
    });

    it('should apply custom className', () => {
      render(<GlassCard className="custom-class">Content</GlassCard>);
      const card = screen.getByText('Content').parentElement;
      expect(card?.className).toContain('custom-class');
      expect(card?.className).toContain('glass-card');
    });
  });

  describe('Variants', () => {
    it('should apply default variant class', () => {
      render(<GlassCard variant="default">Default</GlassCard>);
      const card = screen.getByText('Default').parentElement;
      expect(card?.className).toContain('glass-card-default');
    });

    it('should apply elevated variant class', () => {
      render(<GlassCard variant="elevated">Elevated</GlassCard>);
      const card = screen.getByText('Elevated').parentElement;
      expect(card?.className).toContain('glass-card-elevated');
    });

    it('should apply outlined variant class', () => {
      render(<GlassCard variant="outlined">Outlined</GlassCard>);
      const card = screen.getByText('Outlined').parentElement;
      expect(card?.className).toContain('glass-card-outlined');
    });
  });

  describe('onClick behavior', () => {
    it('should handle onClick when provided', () => {
      const handleClick = jest.fn();
      render(<GlassCard onClick={handleClick}>Clickable</GlassCard>);
      
      const card = screen.getByText('Clickable').parentElement;
      fireEvent.click(card!);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should pass event object to onClick handler', () => {
      const handleClick = jest.fn();
      render(<GlassCard onClick={handleClick}>Clickable</GlassCard>);
      
      const card = screen.getByText('Clickable').parentElement;
      fireEvent.click(card!);
      
      expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({
        type: 'click',
      }));
    });
  });

  describe('Edge cases', () => {
    it('should handle null children', () => {
      render(<GlassCard>{null}</GlassCard>);
      const card = document.querySelector('.glass-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      render(
        <GlassCard>
          <span>Child 1</span>
          <span>Child 2</span>
          <span>Child 3</span>
        </GlassCard>
      );
      
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });

  describe('All props combination', () => {
    it('should handle all props together', () => {
      const handleClick = jest.fn();
      render(
        <GlassCard
          variant="elevated"
          onClick={handleClick}
          className="custom-test-class"
        >
          All Props
        </GlassCard>
      );
      
      const card = screen.getByText('All Props').parentElement;
      
      expect(card?.className).toContain('glass-card');
      expect(card?.className).toContain('glass-card-elevated');
      expect(card?.className).toContain('custom-test-class');
      
      fireEvent.click(card!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});