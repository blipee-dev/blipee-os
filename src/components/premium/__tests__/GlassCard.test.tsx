import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlassCard } from '../GlassCard';
import { premiumTheme, glassmorphism } from '@/lib/design/theme';
import { jest } from '@jest/globals';

// Mock window.getComputedStyle to return expected values for inline styles
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: string) => '',
  }),
});

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
      render(<GlassCard>Content</GlassCard>);
      const card = screen.getByText('Content').parentElement;
      expect(card).toHaveClass('glass-card', 'glass-card-default');
    });

    it('should apply custom className', () => {
      render(<GlassCard className="custom-class">Content</GlassCard>);
      const card = screen.getByText('Content').parentElement;
      expect(card).toHaveClass('custom-class', 'glass-card');
    });
  });

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      const { container } = render(<GlassCard variant="default">Default</GlassCard>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveStyle({
        borderRadius: premiumTheme.borderRadius.lg,
        padding: '1.5rem',
        transition: premiumTheme.transitions.base,
        cursor: 'default',
      });

      expect(card).toHaveClass('glass-card-default');
    });

    it('should apply elevated variant styles', () => {
      const { container } = render(<GlassCard variant="elevated">Elevated</GlassCard>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveStyle({
        borderRadius: premiumTheme.borderRadius.lg,
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.04)',
      });

      expect(card).toHaveClass('glass-card-elevated');
    });

    it('should apply outlined variant styles', () => {
      const { container } = render(<GlassCard variant="outlined">Outlined</GlassCard>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveStyle({
        borderRadius: premiumTheme.borderRadius.lg,
        padding: '1.5rem',
        background: 'transparent',
        border: `2px solid ${premiumTheme.colors.background.glassBorder}`,
      });

      expect(card).toHaveClass('glass-card-outlined');
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

    it('should apply pointer cursor when onClick is provided', () => {
      const { container } = render(<GlassCard onClick={() => {}}>Clickable</GlassCard>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveStyle({
        cursor: 'pointer',
      });
    });

    it('should apply default cursor when onClick is not provided', () => {
      const { container } = render(<GlassCard>Not Clickable</GlassCard>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveStyle({
        cursor: 'default',
      });
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

  describe('Style combinations', () => {
    it('should combine default variant with onClick styles', () => {
      const { container } = render(
        <GlassCard variant="default" onClick={() => {}}>
          Default Clickable
        </GlassCard>
      );
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveStyle({
        cursor: 'pointer',
      });
      expect(card).toHaveClass('glass-card-default');
    });

    it('should combine elevated variant with onClick styles', () => {
      const { container } = render(
        <GlassCard variant="elevated" onClick={() => {}}>
          Elevated Clickable
        </GlassCard>
      );
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveStyle({
        cursor: 'pointer',
        background: 'rgba(255, 255, 255, 0.04)',
      });
      expect(card).toHaveClass('glass-card-elevated');
    });

    it('should combine outlined variant with onClick styles', () => {
      const { container } = render(
        <GlassCard variant="outlined" onClick={() => {}}>
          Outlined Clickable
        </GlassCard>
      );
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveStyle({
        cursor: 'pointer',
        background: 'transparent',
      });
      expect(card).toHaveClass('glass-card-outlined');
    });
  });

  describe('Edge cases', () => {
    it('should handle null children', () => {
      render(<GlassCard>{null}</GlassCard>);
      const card = document.querySelector('.glass-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(<GlassCard>{undefined}</GlassCard>);
      const card = document.querySelector('.glass-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle empty string children', () => {
      render(<GlassCard>{''}</GlassCard>);
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

    it('should handle complex nested children', () => {
      render(
        <GlassCard>
          <div>
            <h1>Title</h1>
            <p>Paragraph</p>
            <button>Button</button>
          </div>
        </GlassCard>
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });
  });

  describe('Default props', () => {
    it('should use default variant when not specified', () => {
      render(<GlassCard>Default</GlassCard>);
      const card = screen.getByText('Default').parentElement;
      expect(card).toHaveClass('glass-card-default');
    });

    it('should use empty className when not specified', () => {
      render(<GlassCard>No Class</GlassCard>);
      const card = screen.getByText('No Class').parentElement;
      expect(card).toHaveClass('glass-card');
      expect(card?.className).toBe('glass-card glass-card-default ');
    });
  });

  describe('All props combination', () => {
    it('should handle all props together', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <GlassCard
          variant="elevated"
          onClick={handleClick}
          className="custom-test-class"
        >
          All Props
        </GlassCard>
      );
      
      const card = container.firstChild as HTMLElement;
      
      expect(card).toHaveClass('glass-card', 'glass-card-elevated', 'custom-test-class');
      expect(card).toHaveStyle({
        cursor: 'pointer',
        background: 'rgba(255, 255, 255, 0.04)',
      });
      
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Theme integration', () => {
    it('should use theme values for default variant', () => {
      const { container } = render(<GlassCard variant="default">Theme Test</GlassCard>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveStyle({
        borderRadius: premiumTheme.borderRadius.lg,
        padding: '1.5rem',
        transition: premiumTheme.transitions.base,
      });
    });

    it('should use glassmorphism values from theme', () => {
      const { container } = render(<GlassCard variant="default">Glassmorphism</GlassCard>);
      const card = container.firstChild as HTMLElement;

      // The component uses spread operator to apply glassmorphism styles
      expect(card).toHaveStyle({
        borderRadius: premiumTheme.borderRadius.lg,
      });
    });
  });
});