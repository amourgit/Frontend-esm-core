import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Root from './root.component';

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => <>{children}</>,
  Route: ({ children, element, path }: any) => {
    return element ?? children;
  },
  Routes: ({ children }: any) => <>{children}</>,
}));

vi.mock('./components/footer/footer.component', () => ({
  default: () => <div data-testid="footer">Mock Footer</div>,
}));

describe('Root', () => {
  it('renders the footer on all routes', () => {
    render(<Root />);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
