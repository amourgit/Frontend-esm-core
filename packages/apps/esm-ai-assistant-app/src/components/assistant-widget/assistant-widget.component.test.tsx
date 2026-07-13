import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { useSession, type Session } from '@egen/esm-framework';
import { useAIEnabled } from '@egen/esm-ai-framework';
import { mockSession, mockUnauthenticatedSession } from '../../../__mocks__/mock-session';
import AssistantWidget from './assistant-widget.component';

vi.mock('@egen/esm-framework', () => ({
  useSession: vi.fn(),
  useOnClickOutside: () => ({ current: null }),
}));

vi.mock('@egen/esm-ai-framework', () => ({
  useAIEnabled: vi.fn(),
}));

vi.mock('../assistant-launcher/assistant-launcher.component', () => ({
  default: () => <button data-testid="launcher">Mock Launcher</button>,
}));

vi.mock('../assistant-panel/assistant-panel.component', () => ({
  default: () => <div data-testid="panel">Mock Panel</div>,
}));

const mockUseSession = vi.mocked(useSession);
const mockUseAIEnabled = vi.mocked(useAIEnabled);

describe('AssistantWidget', () => {
  it('renders nothing when the user is not authenticated', () => {
    mockUseSession.mockReturnValue(mockUnauthenticatedSession as unknown as Session);
    mockUseAIEnabled.mockReturnValue(true);

    const { container } = render(<AssistantWidget />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the AI layer is disabled, even if authenticated', () => {
    mockUseSession.mockReturnValue(mockSession as unknown as Session);
    mockUseAIEnabled.mockReturnValue(false);

    const { container } = render(<AssistantWidget />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the launcher when authenticated and AI is enabled', () => {
    mockUseSession.mockReturnValue(mockSession as unknown as Session);
    mockUseAIEnabled.mockReturnValue(true);

    const { getByTestId, queryByTestId } = render(<AssistantWidget />);
    expect(getByTestId('launcher')).toBeInTheDocument();
    expect(queryByTestId('panel')).not.toBeInTheDocument();
  });
});
