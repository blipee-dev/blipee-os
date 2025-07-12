import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress } from '../progress';

describe('Progress component', () => {
  it('should render progress bar', () => {
    render(<Progress value={50} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toBeInTheDocument();
  });

  it('should have correct ARIA attributes', () => {
    render(<Progress value={75} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveAttribute('role', 'progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '75');
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
  });

  it('should render with 0 value', () => {
    render(<Progress value={0} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveAttribute('aria-valuenow', '0');
  });

  it('should render with 100 value', () => {
    render(<Progress value={100} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveAttribute('aria-valuenow', '100');
  });

  it('should apply custom className', () => {
    render(<Progress value={50} className="custom-class" data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveClass('custom-class');
  });

  it('should render indicator element', () => {
    const { container } = render(<Progress value={60} />);
    const indicator = container.querySelector('[data-state="complete"], [data-state="indeterminate"], [data-state="loading"]');
    expect(indicator).toBeInTheDocument();
  });
});