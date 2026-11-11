import { describe, it, expect } from 'vitest'
import { normaliseAssetBase, ASSET_BASE_GLOBAL } from '../../src/asset-base'
import { isWebGLAvailable } from '../../src/webgl-support'

describe('asset-base — réglage assetBaseUrl', () => {
  it('utilise la valeur configurée, sans « / » final ni espaces', () => {
    expect(normaliseAssetBase(' https://assets.egen.example/cf/// ')).toBe('https://assets.egen.example/cf')
  })
  it('retourne null quand rien n\'est configuré (assets embarqués)', () => {
    expect(normaliseAssetBase('')).toBeNull()
    expect(normaliseAssetBase('   ')).toBeNull()
    expect(normaliseAssetBase(undefined)).toBeNull()
    expect(normaliseAssetBase(null)).toBeNull()
  })
  it('la variable globale correspond à celle injectée par rspack.config.js', () => {
    const rspackConfig = require('node:fs').readFileSync(require('node:path').resolve(__dirname, '../../rspack.config.js'), 'utf8')
    expect(rspackConfig).toContain(`globalThis.${ASSET_BASE_GLOBAL}`)
  })
})

describe('webgl-support', () => {
  const docWith = (getContext) => ({ createElement: () => ({ getContext }) })
  it('vrai si webgl2 ou webgl est disponible', () => {
    expect(isWebGLAvailable(docWith((t) => (t === 'webgl2' ? {} : null)))).toBe(true)
    expect(isWebGLAvailable(docWith((t) => (t === 'webgl' ? {} : null)))).toBe(true)
  })
  it('faux si aucun contexte, ou si la création échoue', () => {
    expect(isWebGLAvailable(docWith(() => null))).toBe(false)
    expect(isWebGLAvailable(docWith(() => { throw new Error('boom') }))).toBe(false)
  })
})
