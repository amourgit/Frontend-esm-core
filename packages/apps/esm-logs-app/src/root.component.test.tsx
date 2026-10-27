import React from 'react';
import '@testing-library/jest-dom/vitest';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setToolWindowBadge } from '@egen-civitas/esm-framework';
import { LOGS_TOOL_ID } from './constants';
import { pushLog, resetLogStoreForTests } from './logs/log-store';
import Root from './root.component';

vi.mock('@egen-civitas/esm-framework', () => ({ setToolWindowBadge: vi.fn() }));

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 40)));

describe('Root (pastille du rail)', () => {
  beforeEach(() => {
    resetLogStoreForTests();
  });

  it('publie le nombre d\'erreurs sur le bouton Logs, zone fermée comprise', async () => {
    const { container } = render(<Root />);
    expect(container).toBeEmptyDOMElement();
    act(() => {
      pushLog('error', 'a');
      pushLog('warn', 'b');
      pushLog('error', 'c');
    });
    await settle();
    expect(setToolWindowBadge).toHaveBeenLastCalledWith(LOGS_TOOL_ID, 2);
  });

  it('retire la pastille au démontage', () => {
    render(<Root />).unmount();
    expect(setToolWindowBadge).toHaveBeenLastCalledWith(LOGS_TOOL_ID, null);
  });
});
