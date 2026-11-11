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
