import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

let config
const pageBackground = vi.fn(() => null)
vi.mock('@egen-civitas/esm-framework', () => ({
  useConfig: () => config,
  PageBackground: (props) => pageBackground(props),
  Type: { String: 'String' },
  validators: { oneOf: (values) => values },
}))

import ShellBackground from '../../src/shell-background'
import { configSchema } from '../../src/config-schema'

afterEach(() => { cleanup(); pageBackground.mockClear() })

describe('ShellBackground — système d\'arrière-plan du shell', () => {
  it('par défaut : noir, déclaré via PageBackground (pas de fond dessiné par l\'app)', () => {
    expect(configSchema.backgroundMode._default).toBe('color')
    expect(configSchema.backgroundColor._default).toBe('#000000')
    config = { backgroundMode: 'color', backgroundColor: '#000000', backgroundImageUrl: '' }
    render(React.createElement(ShellBackground))
    const { customComponent } = pageBackground.mock.calls[0][0]
    expect(customComponent.props.style.background).toBe('#000000')
  })
  it('mode theme : ne déclare rien, le shell garde son fond', () => {
    config = { backgroundMode: 'theme', backgroundColor: '#000000', backgroundImageUrl: '' }
    render(React.createElement(ShellBackground))
    expect(pageBackground).not.toHaveBeenCalled()
  })
  it('mode image : utilise l\'image configurée', () => {
    config = { backgroundMode: 'image', backgroundColor: '#000000', backgroundImageUrl: 'https://x.example/bg.jpg' }
    render(React.createElement(ShellBackground))
    expect(pageBackground.mock.calls[0][0]).toMatchObject({ imageSrc: 'https://x.example/bg.jpg' })
  })
  it('mode image sans URL : retombe sur la couleur', () => {
    config = { backgroundMode: 'image', backgroundColor: '#112233', backgroundImageUrl: '' }
    render(React.createElement(ShellBackground))
    expect(pageBackground.mock.calls[0][0].customComponent.props.style.background).toBe('#112233')
  })
})
