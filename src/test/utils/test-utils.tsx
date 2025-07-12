import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Utility to get computed styles from inline styles
export const getInlineStyles = (element: HTMLElement) => {
  const style = element.getAttribute('style');
  if (!style) return {};
  
  const styles: Record<string, string> = {};
  style.split(';').forEach(decl => {
    const [prop, value] = decl.split(':').map(s => s.trim());
    if (prop && value) {
      // Convert kebab-case to camelCase
      const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      styles[camelProp] = value;
    }
  });
  
  return styles;
};

// Custom matchers for testing
export const expectToHaveInlineStyle = (element: HTMLElement, expectedStyles: Record<string, any>) => {
  const styles = getInlineStyles(element);
  Object.entries(expectedStyles).forEach(([key, value]) => {
    expect(styles[key]).toBe(value);
  });
};