import React from 'react';
import { render } from '@testing-library/react';
import { AmbientBackground } from '../AmbientBackground';

describe('AmbientBackground component', () => {
  it('should render without crashing', () => {
    const { container } = render(<AmbientBackground />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should have fixed positioning', () => {
    const { container } = render(<AmbientBackground />);
    const background = container.firstChild;
    expect(background).toHaveClass('fixed');
    expect(background).toHaveClass('inset-0');
  });

  it('should have proper z-index', () => {
    const { container } = render(<AmbientBackground />);
    const background = container.firstChild;
    expect(background).toHaveClass('-z-10');
  });

  it('should have overflow hidden', () => {
    const { container } = render(<AmbientBackground />);
    const background = container.firstChild;
    expect(background).toHaveClass('overflow-hidden');
  });

  it('should have dark background', () => {
    const { container } = render(<AmbientBackground />);
    const background = container.firstChild;
    expect(background).toHaveClass('bg-black');
  });

  it('should render gradient elements', () => {
    const { container } = render(<AmbientBackground />);
    const gradients = container.querySelectorAll('.absolute');
    expect(gradients.length).toBeGreaterThan(0);
  });

  it('should apply opacity to gradient elements', () => {
    const { container } = render(<AmbientBackground />);
    const gradients = container.querySelectorAll('[class*="opacity-"]');
    expect(gradients.length).toBeGreaterThan(0);
  });

  it('should have blur effects', () => {
    const { container } = render(<AmbientBackground />);
    const blurElements = container.querySelectorAll('[class*="blur-"]');
    expect(blurElements.length).toBeGreaterThan(0);
  });
});