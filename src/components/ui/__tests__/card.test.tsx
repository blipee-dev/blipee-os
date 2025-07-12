import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '../card';

describe('Card', () => {
  describe('Card component', () => {
    it('should render with children', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'border-white/[0.05]',
        'bg-white/[0.03]',
        'backdrop-blur-xl',
        'text-card-foreground',
        'shadow-sm'
      );
    });

    it('should apply custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
      // Should still have default classes
      expect(card).toHaveClass('rounded-lg', 'border');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should pass through HTML attributes', () => {
      render(
        <Card
          data-testid="test-card"
          id="card-id"
          aria-label="Test card"
          onClick={() => {}}
        >
          Content
        </Card>
      );
      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('id', 'card-id');
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });

    it('should have correct display name', () => {
      expect(Card.displayName).toBe('Card');
    });
  });

  describe('CardHeader component', () => {
    it('should render with children', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('should apply custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('flex', 'p-6');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref}>Header</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct display name', () => {
      expect(CardHeader.displayName).toBe('CardHeader');
    });
  });

  describe('CardTitle component', () => {
    it('should render with children', () => {
      render(<CardTitle>Title Text</CardTitle>);
      expect(screen.getByText('Title Text')).toBeInTheDocument();
    });

    it('should render as h3 element', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title.tagName).toBe('H3');
    });

    it('should apply default classes', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveClass(
        'text-2xl',
        'font-semibold',
        'leading-none',
        'tracking-tight'
      );
    });

    it('should apply custom className', () => {
      render(<CardTitle className="custom-title" data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('custom-title');
      expect(title).toHaveClass('text-2xl', 'font-semibold');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });

    it('should have correct display name', () => {
      expect(CardTitle.displayName).toBe('CardTitle');
    });
  });

  describe('CardDescription component', () => {
    it('should render with children', () => {
      render(<CardDescription>Description Text</CardDescription>);
      expect(screen.getByText('Description Text')).toBeInTheDocument();
    });

    it('should render as p element', () => {
      render(<CardDescription>Description</CardDescription>);
      const description = screen.getByText('Description');
      expect(description.tagName).toBe('P');
    });

    it('should apply default classes', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      const description = screen.getByTestId('desc');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should apply custom className', () => {
      render(<CardDescription className="custom-desc" data-testid="desc">Description</CardDescription>);
      const description = screen.getByTestId('desc');
      expect(description).toHaveClass('custom-desc');
      expect(description).toHaveClass('text-sm');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<CardDescription ref={ref}>Description</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });

    it('should have correct display name', () => {
      expect(CardDescription.displayName).toBe('CardDescription');
    });
  });

  describe('CardContent component', () => {
    it('should render with children', () => {
      render(<CardContent>Content Body</CardContent>);
      expect(screen.getByText('Content Body')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('should apply custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct display name', () => {
      expect(CardContent.displayName).toBe('CardContent');
    });
  });

  describe('CardFooter component', () => {
    it('should render with children', () => {
      render(<CardFooter>Footer Content</CardFooter>);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('should apply custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
      expect(footer).toHaveClass('flex', 'p-6');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct display name', () => {
      expect(CardFooter.displayName).toBe('CardFooter');
    });
  });

  describe('Full Card composition', () => {
    it('should render complete card with all subcomponents', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('This is a test card')).toBeInTheDocument();
      expect(screen.getByText('Card content goes here')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should handle missing optional components', () => {
      render(
        <Card>
          <CardContent>Just content</CardContent>
        </Card>
      );

      expect(screen.getByText('Just content')).toBeInTheDocument();
    });

    it('should pass through all HTML attributes to subcomponents', () => {
      render(
        <Card>
          <CardHeader id="header-id" data-testid="header">
            <CardTitle id="title-id">Title</CardTitle>
            <CardDescription id="desc-id">Description</CardDescription>
          </CardHeader>
          <CardContent id="content-id" data-testid="content">Content</CardContent>
          <CardFooter id="footer-id" data-testid="footer">Footer</CardFooter>
        </Card>
      );

      expect(screen.getByTestId('header')).toHaveAttribute('id', 'header-id');
      expect(screen.getByText('Title')).toHaveAttribute('id', 'title-id');
      expect(screen.getByText('Description')).toHaveAttribute('id', 'desc-id');
      expect(screen.getByTestId('content')).toHaveAttribute('id', 'content-id');
      expect(screen.getByTestId('footer')).toHaveAttribute('id', 'footer-id');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content', () => {
      render(<Card />);
      // Should render without errors
      expect(document.querySelector('.rounded-lg')).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(
        <Card>
          {null}
          <CardContent>{null}</CardContent>
        </Card>
      );
      // Should render without errors
      expect(document.querySelector('.rounded-lg')).toBeInTheDocument();
    });

    it('should handle complex nested content', () => {
      render(
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <span>Nested Title</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <div>
                <p>Deeply nested content</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Nested Title')).toBeInTheDocument();
      expect(screen.getByText('Deeply nested content')).toBeInTheDocument();
    });
  });
});