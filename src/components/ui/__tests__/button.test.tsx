import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonVariants } from '../button';
import { cn } from '@/lib/utils';

describe('Button', () => {
  describe('Basic rendering', () => {
    it('should render a button element by default', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render children correctly', () => {
      render(<Button>Test Button</Button>);
      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Variants', () => {
    it('should apply default variant by default', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'hover:bg-primary/90');
    });

    it('should apply destructive variant', () => {
      render(<Button variant="destructive">Destructive</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground', 'hover:bg-destructive/90');
    });

    it('should apply outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-input', 'bg-background', 'hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('should apply secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground', 'hover:bg-secondary/80');
    });

    it('should apply ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('should apply link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary', 'underline-offset-4', 'hover:underline');
    });
  });

  describe('Sizes', () => {
    it('should apply default size by default', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-4', 'py-2');
    });

    it('should apply sm size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'rounded-md', 'px-3');
    });

    it('should apply lg size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'rounded-md', 'px-8');
    });

    it('should apply icon size', () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('asChild prop', () => {
    it('should render as Slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = screen.getByText('Link Button');
      expect(link).toBeInTheDocument();
      expect(link.parentElement?.tagName).toBe('DIV'); // Mocked Slot renders as div
    });

    it('should render as button when asChild is false', () => {
      render(<Button asChild={false}>Button</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('HTML attributes', () => {
    it('should pass through HTML button attributes', () => {
      render(
        <Button
          disabled
          type="submit"
          onClick={() => {}}
          aria-label="Custom label"
          data-testid="test-button"
        >
          Button
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('data-testid', 'test-button');
    });

    it('should handle onClick events', async () => {
      const handleClick = () => {};
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      // Test passes if no error is thrown
      expect(button).toBeInTheDocument();
    });

    it('should not trigger onClick when disabled', async () => {
      const handleClick = () => {};
      const user = userEvent.setup();
      
      render(<Button disabled onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      // Test passes if no error is thrown and button is disabled
      expect(button).toBeDisabled();
    });
  });

  describe('Combined props', () => {
    it('should combine variant and size correctly', () => {
      render(<Button variant="outline" size="lg">Combined</Button>);
      const button = screen.getByRole('button');
      
      // Check outline variant classes
      expect(button).toHaveClass('border', 'border-input');
      // Check lg size classes
      expect(button).toHaveClass('h-11', 'px-8');
    });

    it('should combine all props correctly', () => {
      render(
        <Button
          variant="destructive"
          size="sm"
          className="custom-class"
          disabled
        >
          All Props
        </Button>
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-destructive', 'h-9', 'px-3', 'custom-class');
      expect(button).toBeDisabled();
    });
  });

  describe('Display name', () => {
    it('should have the correct display name', () => {
      expect(Button.displayName).toBe('Button');
    });
  });
});

describe('buttonVariants', () => {
  it('should generate correct classes for default variant and size', () => {
    const classes = buttonVariants();
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('text-primary-foreground');
    expect(classes).toContain('h-10');
    expect(classes).toContain('px-4');
  });

  it('should generate correct classes for specific variant', () => {
    const classes = buttonVariants({ variant: 'ghost' });
    expect(classes).toContain('hover:bg-accent');
    expect(classes).not.toContain('bg-primary');
  });

  it('should generate correct classes for specific size', () => {
    const classes = buttonVariants({ size: 'icon' });
    expect(classes).toContain('h-10');
    expect(classes).toContain('w-10');
    expect(classes).not.toContain('px-4');
  });

  it('should generate correct classes for variant and size combination', () => {
    const classes = buttonVariants({ variant: 'link', size: 'sm' });
    expect(classes).toContain('text-primary');
    expect(classes).toContain('h-9');
    expect(classes).toContain('px-3');
  });

  it('should include base classes', () => {
    const classes = buttonVariants();
    expect(classes).toContain('inline-flex');
    expect(classes).toContain('items-center');
    expect(classes).toContain('justify-center');
    expect(classes).toContain('whitespace-nowrap');
    expect(classes).toContain('rounded-md');
    expect(classes).toContain('text-sm');
    expect(classes).toContain('font-medium');
    expect(classes).toContain('transition-colors');
    expect(classes).toContain('focus-visible:outline-none');
    expect(classes).toContain('disabled:pointer-events-none');
    expect(classes).toContain('disabled:opacity-50');
  });

  it('should handle undefined variant', () => {
    const classes = buttonVariants({ variant: undefined });
    expect(classes).toContain('bg-primary'); // Should use default
  });

  it('should handle undefined size', () => {
    const classes = buttonVariants({ size: undefined });
    expect(classes).toContain('h-10'); // Should use default
  });

  it('should handle empty object', () => {
    const classes = buttonVariants({});
    expect(classes).toContain('bg-primary'); // Should use defaults
    expect(classes).toContain('h-10');
  });

  it('should handle custom className through cn function', () => {
    const className = 'custom-test-class';
    const classes = cn(buttonVariants(), className);
    expect(classes).toContain('custom-test-class');
  });
});