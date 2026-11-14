import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'

// Règles de dépendance de la roadmap §5 : domain <- ports <- services ; les adaptateurs « purs » n'importent ni
// React, ni three, ni le Core, ni le code hérité (src/studio). Ce test échoue si un développeur casse la règle.
const src = resolve(__dirname, '../../src')
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|js|jsx)$/.test(name) ? [p] : []
  })
const importsOf = (file) => [...readFileSync(file, 'utf8').matchAll(/(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1] ?? m[2])

const PURE = ['domain', 'ports', 'services', 'adapters/memory', 'adapters/legacy-manifest', 'adapters/browser-storage']
const FORBIDDEN = [/^react(-dom)?(\/|$)/, /^three(\/|$)/, /^@egen-civitas\//, /studio(\/|$)/]
const ALLOWED_LAYERS = {
  domain: [],
  ports: ['domain'],
  services: ['domain', 'ports'],
  'adapters/memory': ['domain', 'ports'],
  'adapters/legacy-manifest': ['domain'],
  'adapters/browser-storage': ['domain', 'ports'],
}

describe('architecture — dépendances entre couches', () => {
  for (const layer of PURE) {
    const files = walk(join(src, layer))
    it(`${layer} : ${files.length} fichier(s) sans dépendance interdite`, () => {
      expect(files.length).toBeGreaterThan(0)
      for (const file of files) {
        for (const spec of importsOf(file)) {
          for (const rule of FORBIDDEN) expect(spec, `${relative(src, file)} importe « ${spec} »`).not.toMatch(rule)
          if (spec.startsWith('.')) {
            const target = relative(src, resolve(file, '..', spec)).split('\\').join('/')
            const own = target.startsWith(layer)
            const allowed = ALLOWED_LAYERS[layer].some((l) => target.startsWith(l))
            expect(own || allowed, `${relative(src, file)} -> ${target} : couche non autorisée pour ${layer}`).toBe(true)
          }
        }
      }
    })
  }
})

// runtime/ : dépend de three, jamais de React, du Core ni du code hérité ; features/ : jamais du code hérité (src/studio)
describe('architecture — runtime et features', () => {
  it('runtime/ n\'importe ni React, ni le Core, ni studio/', () => {
    for (const file of walk(join(src, 'runtime'))) {
      for (const spec of importsOf(file)) {
        for (const rule of [/^react(-dom)?(\/|$)/, /^@egen-civitas\//, /studio(\/|$)/]) expect(spec, `${relative(src, file)} importe « ${spec} »`).not.toMatch(rule)
      }
    }
  })
  it('features/ n\'importe pas studio/ (passer par runtime/engine-adapter)', () => {
    const files = walk(join(src, 'features'))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      for (const spec of importsOf(file)) expect(spec, `${relative(src, file)} importe « ${spec} »`).not.toMatch(/studio(\/|$)/)
    }
  })
})
