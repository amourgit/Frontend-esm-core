import React, { useState } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'

vi.mock('@egen-civitas/esm-framework', () => ({
  navigate: vi.fn(),
  interpolateUrl: (s) => s,
}))

import RouteSync from '../../src/route-sync'
import { ViewContext, ViewMode } from '../../src/studio/context/ViewContext'
import { SceneContext } from '../../src/studio/context/SceneContext'
import { AudioProvider } from '../../src/studio/context/AudioContext'
import { LookAtManager } from '../../src/studio/library/lookatManager'

afterEach(() => cleanup())

function Harness({ characterManager, expose }) {
  const [viewMode, setViewMode] = useState(ViewMode.APPEARANCE)
  expose.setViewMode = setViewMode
  return React.createElement(
    ViewContext.Provider,
    { value: { viewMode, setViewMode } },
    React.createElement(
      SceneContext.Provider,
      { value: { characterManager } },
      React.createElement(RouteSync),
    ),
  )
}

describe('route-sync — nettoyage de la scène (même comportement que les boutons « Retour » d\'origine)', () => {
  const setup = () => {
    const characterManager = { removeCurrentCharacter: vi.fn(), removeCurrentManifest: vi.fn() }
    const expose = {}
    render(React.createElement(Harness, { characterManager, expose }))
    return { characterManager, expose }
  }

  it('retire le personnage en quittant APPEARANCE vers une vue sans personnage', () => {
    const { characterManager, expose } = setup()
    act(() => expose.setViewMode(ViewMode.LANDING))
    expect(characterManager.removeCurrentCharacter).toHaveBeenCalledTimes(1)
    expect(characterManager.removeCurrentManifest).toHaveBeenCalledTimes(1)
  })

  it('ne touche pas à la scène entre deux vues « avec personnage »', () => {
    const { characterManager, expose } = setup()
    act(() => expose.setViewMode(ViewMode.SAVE))
    expect(characterManager.removeCurrentCharacter).not.toHaveBeenCalled()
  })

  it('ne touche pas à la scène entre deux vues « sans personnage »', () => {
    const { characterManager, expose } = setup()
    act(() => expose.setViewMode(ViewMode.LANDING))
    characterManager.removeCurrentCharacter.mockClear()
    act(() => expose.setViewMode(ViewMode.CREATE))
    expect(characterManager.removeCurrentCharacter).not.toHaveBeenCalled()
  })
})

describe('AudioProvider — démontage', () => {
  it('arrête la musique de fond quand l\'app est démontée', () => {
    const pause = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    const { unmount } = render(React.createElement(AudioProvider, null, null))
    unmount()
    expect(pause).toHaveBeenCalled()
  })
})

describe('LookAtManager — dispose', () => {
  it('retire ses écouteurs globaux (plus de suivi de la souris après dispose)', () => {
    const camera = { position: { x: 0, y: 0, z: 0 } }
    const manager = new LookAtManager(80, 'editor-scene', camera)
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 20 }))
    expect(manager.curMousePos).toEqual({ x: 10, y: 20 })
    manager.dispose()
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 99, clientY: 99 }))
    expect(manager.curMousePos).toEqual({ x: 10, y: 20 })
  })
})
