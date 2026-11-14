import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import cssLoader from '../../css-asset-paths-loader.js'

const root = resolve(__dirname, '../..')
const styleCss = readFileSync(resolve(root, 'src/public/style.css'), 'utf8')

describe('style.css — ne doit pas déborder sur le shell', () => {
  // retire commentaires et blocs @font-face / @keyframes (déclarations globales sans effet de mise en page)
  const rules = styleCss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@font-face\s*\{[^}]*\}/g, '')
    .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, '')

  it('toutes les règles sont rattachées à .character-factory-stage', () => {
    const selectors = [...rules.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()).filter(Boolean)
    expect(selectors.length).toBeGreaterThan(5)
    for (const group of selectors) {
      for (const sel of group.split(',').map((s) => s.trim())) {
        expect(sel.startsWith('.character-factory-stage'), `sélecteur non scopé : "${sel}"`).toBe(true)
      }
    }
  })

  it('ne cible plus html, body ni #root du shell (premier élément de chaque sélecteur)', () => {
    const selectors = [...rules.matchAll(/([^{}]+)\{/g)].flatMap((m) => m[1].split(',').map((s) => s.trim())).filter(Boolean)
    for (const sel of selectors) {
      const first = sel.split(/\s+/)[0]
      expect(['html', 'body', '#root'], `sélecteur global : "${sel}"`).not.toContain(first)
    }
  })

  it('les animations globales sont préfixées (pas de collision avec le shell)', () => {
    expect(styleCss).toMatch(/@keyframes cf-rotate/)
    expect(styleCss).not.toMatch(/@keyframes rotate\b/)
  })
})

describe('css-asset-paths-loader — unités de viewport', () => {
  const run = (css) => cssLoader.call({ resourcePath: resolve(root, 'src/studio/components/x/X.module.css') }, css)

  it('convertit vh / dvh / vw en unités de conteneur', () => {
    expect(run('a{height:100vh;width:50vw;max-height:calc(100dvh - 20px)}')).toBe(
      'a{height:100cqh;width:50cqw;max-height:calc(100cqh - 20px)}',
    )
  })

  it("ne touche pas aux autres unités ni aux noms contenant « vh »", () => {
    expect(run('a{height:100%;width:12px;margin:1.5em;--vh:1}')).toBe('a{height:100%;width:12px;margin:1.5em;--vh:1}')
  })
})
