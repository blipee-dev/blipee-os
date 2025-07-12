import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GradientButton } from '../GradientButton';
import { premiumTheme } from '@/lib/design/theme';
import { jest } from '@jest/globals';

describe('GradientButton', () => {
  describe('Basic rendering', () => {
    it('should render with children', () => {
      render(<GradientButton>Click me</GradientButton>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render as button element', () => {
      render(<GradientButton>Button</GradientButton>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should apply default classes', () => {
      render(<GradientButton>Button</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('gradient-button');
    });

    it('should apply custom className', () => {
      render(<GradientButton className="custom-class">Button</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('gradient-button', 'custom-class');
    });
  });

  describe('Variants', () => {
    it('should apply primary variant by default', () => {
      render(<GradientButton>Primary</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        background: premiumTheme.colors.gradients.primary,
      });
    });

    it('should apply blue variant', () => {
      render(<GradientButton variant="blue">Blue</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        background: premiumTheme.colors.gradients.blue,
      });
    });

    it('should apply success variant', () => {
      render(<GradientButton variant="success">Success</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        background: premiumTheme.colors.gradients.success,
      });
    });

    it('should apply coral variant', () => {
      render(<GradientButton variant="coral">Coral</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        background: premiumTheme.colors.gradients.coral,
      });
    });
  });

  describe('Sizes', () => {
    it('should apply medium size by default', () => {
      render(<GradientButton>Medium</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        height: '44px',
      });
    });

    it('should apply small size', () => {
      render(<GradientButton size="small">Small</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        height: '36px',
      });
    });

    it('should apply large size', () => {
      render(<GradientButton size="large">Large</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        padding: '1rem 2rem',
        fontSize: '1.125rem',
        height: '52px',
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner when loading is true', () => {
      render(<GradientButton loading>Loading</GradientButton>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    it('should show spinner animation', () => {
      render(<GradientButton loading>Test</GradientButton>);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('w-4', 'h-4', 'border-2', 'border-white/30', 'border-t-white', 'rounded-full');
    });

    it('should disable button when loading', () => {
      render(<GradientButton loading>Loading</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveStyle({
        opacity: '0.5',
        cursor: 'not-allowed',
      });
    });

    it('should prevent click events when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<GradientButton loading onClick={handleClick}>Loading</GradientButton>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled state', () => {
    it('should disable button when disabled is true', () => {
      render(<GradientButton disabled>Disabled</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<GradientButton disabled>Disabled</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        background: premiumTheme.colors.background.glass,
        color: premiumTheme.colors.text.tertiary,
        opacity: '0.5',
        cursor: 'not-allowed',
      });
    });

    it('should prevent click events when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<GradientButton disabled onClick={handleClick}>Disabled</GradientButton>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Icons', () => {
    it('should render start icon', () => {
      const StartIcon = () => <span data-testid="start-icon">→</span>;
      render(<GradientButton startIcon={<StartIcon />}>Button</GradientButton>);
      
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('should render end icon', () => {
      const EndIcon = () => <span data-testid="end-icon">←</span>;
      render(<GradientButton endIcon={<EndIcon />}>Button</GradientButton>);
      
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('should render both start and end icons', () => {
      const StartIcon = () => <span data-testid="start-icon">→</span>;
      const EndIcon = () => <span data-testid="end-icon">←</span>;
      render(
        <GradientButton startIcon={<StartIcon />} endIcon={<EndIcon />}>
          Button
        </GradientButton>
      );
      
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('should not show icons when loading', () => {
      const StartIcon = () => <span data-testid="start-icon">→</span>;
      const EndIcon = () => <span data-testid="end-icon">←</span>;
      render(
        <GradientButton loading startIcon={<StartIcon />} endIcon={<EndIcon />}>
          Button
        </GradientButton>
      );
      
      expect(screen.queryByTestId('start-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('end-icon')).not.toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Full width', () => {
    it('should not be full width by default', () => {
      render(<GradientButton>Button</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        width: 'auto',
      });
    });

    it('should be full width when fullWidth is true', () => {
      render(<GradientButton fullWidth>Full Width</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        width: '100%',
      });
    });
  });

  describe('HTML button attributes', () => {
    it('should pass through HTML button attributes', () => {
      render(
        <GradientButton
          type="submit"
          onClick={() => {}}
          onMouseEnter={() => {}}
          aria-label="Custom label"
          data-testid="test-button"
        >
          Button
        </GradientButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('data-testid', 'test-button');
    });

    it('should handle onClick events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<GradientButton onClick={handleClick}>Click me</GradientButton>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle other mouse events', () => {
      const handleMouseEnter = jest.fn();
      const handleMouseLeave = jest.fn();
      
      render(
        <GradientButton
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Hover me
        </GradientButton>
      );
      
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
      
      fireEvent.mouseLeave(button);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Style properties', () => {
    it('should have correct base styles', () => {
      render(<GradientButton>Button</GradientButton>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveStyle({
        color: 'white',
        border: 'none',
        borderRadius: premiumTheme.borderRadius.md,
        fontWeight: '600',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      });
    });

    it('should apply all props correctly', () => {
      const handleClick = jest.fn();
      render(
        <GradientButton
          variant="success"
          size="large"
          fullWidth
          className="custom-test-class"
          onClick={handleClick}
          startIcon={<span>Start</span>}
          endIcon={<span>End</span>}
        >
          All Props
        </GradientButton>
      );
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('gradient-button', 'custom-test-class');
      expect(button).toHaveStyle({
        background: premiumTheme.colors.gradients.success,
        padding: '1rem 2rem',
        fontSize: '1.125rem',
        height: '52px',
        width: '100%',
      });
      
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('All Props')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty children', () => {
      render(<GradientButton />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(<GradientButton>{null}</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle complex children', () => {
      render(
        <GradientButton>
          <span>Complex</span>
          <strong>Children</strong>
        </GradientButton>
      );
      
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Children')).toBeInTheDocument();
    });

    it('should handle disabled and loading at the same time', () => {
      render(<GradientButton disabled loading>Test</GradientButton>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveStyle({
        opacity: '0.5',
        cursor: 'not-allowed',
      });
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Default props', () => {
    it('should use primary variant by default', () => {
      render(<GradientButton>Default</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        background: premiumTheme.colors.gradients.primary,
      });
    });

    it('should use medium size by default', () => {
      render(<GradientButton>Default</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        height: '44px',
      });
    });

    it('should not be loading by default', () => {
      render(<GradientButton>Default</GradientButton>);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('should not be full width by default', () => {
      render(<GradientButton>Default</GradientButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        width: 'auto',
      });
    });

    it('should use empty className by default', () => {
      render(<GradientButton>Default</GradientButton>);
      const button = screen.getByRole('button');
      expect(button.className).toBe('gradient-button ');
    });
  });
});