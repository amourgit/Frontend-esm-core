import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { useConfig, useSession, type Session } from '@egen-civitas/esm-framework';
import { mockSession, mockUnauthenticatedSession } from '../../../__mocks__/mock-session';
import Footer from './footer.component';

vi.mock('@egen-civitas/esm-framework', () => ({
  useConfig: vi.fn(),
  useSession: vi.fn(),
  ConfigurableLink: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

const mockUseConfig = vi.mocked(useConfig);
const mockUseSession = vi.mocked(useSession);

const baseConfig = {
  company: { name: 'CIVITAS', tagline: "Solutions d'intégration IA", url: '' },
  copyright: { showYear: true, text: '' },
  links: [],
};

describe('Footer', () => {
  it('renders nothing when the user is not authenticated', () => {
    mockUseSession.mockReturnValue(mockUnauthenticatedSession as unknown as Session);
    mockUseConfig.mockReturnValue(baseConfig);

    const { container } = render(<Footer />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the company name and tagline when authenticated', () => {
    mockUseSession.mockReturnValue(mockSession as unknown as Session);
    mockUseConfig.mockReturnValue(baseConfig);

    render(<Footer />);

    expect(screen.getByText('CIVITAS')).toBeInTheDocument();
    expect(screen.getByText("Solutions d'intégration IA")).toBeInTheDocument();
  });

  it('renders the company name as a link when a company URL is configured', () => {
    mockUseSession.mockReturnValue(mockSession as unknown as Session);
    mockUseConfig.mockReturnValue({
      ...baseConfig,
      company: { ...baseConfig.company, url: 'https://civitas.example' },
    });

    render(<Footer />);

    expect(screen.getByRole('link', { name: 'CIVITAS' })).toHaveAttribute('href', 'https://civitas.example');
  });

  it('renders configured secondary links', () => {
    mockUseSession.mockReturnValue(mockSession as unknown as Session);
    mockUseConfig.mockReturnValue({
      ...baseConfig,
      links: [{ title: 'Contact', url: 'https://civitas.example/contact' }],
    });

    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', 'https://civitas.example/contact');
  });
});
