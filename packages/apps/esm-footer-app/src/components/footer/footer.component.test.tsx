import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { useConfig } from '@egen-civitas/esm-framework';
import Footer from './footer.component';

vi.mock('@egen-civitas/esm-framework', () => ({
  useConfig: vi.fn(),
  ConfigurableLink: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

const mockUseConfig = vi.mocked(useConfig);

const baseConfig = {
  civitas: {
    logoUrl: '',
    websiteUrl: 'https://civitas-africa.vercel.app/',
    tagline: 'La plateforme éducative nationale du Gabon',
  },
  company: { name: 'CIVITAS', tagline: "Solutions d'intégration IA", url: '' },
  appearance: { textColor: '#000000' },
  copyright: { showYear: true, text: '' },
  links: [],
  additionalLogos: [],
};

describe('Footer', () => {
  it('renders the footer content', () => {
    mockUseConfig.mockReturnValue(baseConfig);

    render(<Footer />);

    expect(screen.getByText('Built by')).toBeInTheDocument();
    expect(screen.getByAltText('CIVITAS logo')).toBeInTheDocument();
    expect(screen.getByText('La plateforme éducative nationale du Gabon')).toBeInTheDocument();
  });

  it('renders additional logos when configured', () => {
    mockUseConfig.mockReturnValue({
      ...baseConfig,
      additionalLogos: [{ src: 'https://example.com/logo.png', alt: 'Example Logo' }],
    });

    render(<Footer />);

    expect(screen.getByAltText('Example Logo')).toBeInTheDocument();
  });
});
