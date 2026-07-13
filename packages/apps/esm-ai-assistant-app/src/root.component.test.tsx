import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Root from './root.component';

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => <>{children}</>,
  Route: ({ children, element, path }: any) => {
    const publicPaths = ['login/*', 'logout/*', 'home/*', 'change-password/*', 'tenant-suspended/*'];
    if (publicPaths.includes(path)) {
      return null;
    }
    return element ?? children;
  },
  Routes: ({ children }: any) => <>{children}</>,
}));

vi.mock('./components/assistant-widget/assistant-widget.component', () => ({
  default: () => <div data-testid="assistant-widget">Mock Assistant Widget</div>,
}));

describe('Root', () => {
  it('renders the assistant widget on authenticated routes', () => {
    render(<Root />);
    expect(screen.getByTestId('assistant-widget')).toBeInTheDocument();
  });
});
