import React from 'react';
import { render, screen } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';
import { jest } from '@jest/globals';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />
}));

describe('OptimizedImage component', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test image',
    width: 800,
    height: 600
  };

  it('should render image with alt text', () => {
    render(<OptimizedImage {...defaultProps} />);
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
  });

  it('should pass through src prop', () => {
    render(<OptimizedImage {...defaultProps} />);
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('src', '/test-image.jpg');
  });

  it('should set width and height', () => {
    render(<OptimizedImage {...defaultProps} />);
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '600');
  });

  it('should apply custom className', () => {
    render(<OptimizedImage {...defaultProps} className="custom-image" />);
    const img = screen.getByAltText('Test image');
    expect(img).toHaveClass('custom-image');
  });

  it('should set loading lazy by default', () => {
    render(<OptimizedImage {...defaultProps} />);
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should allow eager loading', () => {
    render(<OptimizedImage {...defaultProps} loading="eager" />);
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('should set priority when specified', () => {
    render(<OptimizedImage {...defaultProps} priority />);
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('priority');
  });

  it('should apply quality setting', () => {
    render(<OptimizedImage {...defaultProps} quality={90} />);
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('quality', '90');
  });

  it('should handle placeholder blur', () => {
    render(<OptimizedImage {...defaultProps} placeholder="blur" blurDataURL="data:..." />);
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('blurDataURL', 'data:...');
  });
});