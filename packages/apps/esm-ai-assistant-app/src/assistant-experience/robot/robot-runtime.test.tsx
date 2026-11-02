import React from 'react';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { RobotErrorBoundary } from './lazy';

const require = createRequire(import.meta.url);

describe('configuration rspack : moteur de rendu du robot', () => {
  // Régression : sans cet alias, le moteur de développement de @react-three/fiber lit une propriété
  // absente du React de production fourni par le shell et le robot plante
  // (« Cannot read properties of undefined (reading 'current') »).
  it.each(['development', 'production'])('force la build de production de react-reconciler (mode %s)', (mode) => {
    const createConfig = require('../../../rspack.config.js');
    const config = createConfig({}, { mode });
    const target: string = config.resolve.alias['react-reconciler$'];
    expect(target).toMatch(/react-reconciler\.production\.min\.js$/);
    expect(fs.existsSync(target)).toBe(true);
  });
});

describe('RobotErrorBoundary', () => {
  function Boom(): React.ReactElement {
    throw new Error('WebGL indisponible');
  }

  it('affiche un message au lieu de faire planter la page, et signale l’erreur', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onError = vi.fn();
    render(
      <div>
        <p>conversation</p>
        <RobotErrorBoundary onError={onError}>
          <Boom />
        </RobotErrorBoundary>
      </div>,
    );
    expect(screen.getByText('conversation')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Robot 3D indisponible' })).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('laisse passer les enfants quand tout va bien', () => {
    render(
      <RobotErrorBoundary>
        <p>robot</p>
      </RobotErrorBoundary>,
    );
    expect(screen.getByText('robot')).toBeInTheDocument();
  });
});
