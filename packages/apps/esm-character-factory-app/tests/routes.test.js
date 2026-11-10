import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(__dirname, '..')
const routes = JSON.parse(readFileSync(resolve(root, 'src/routes.json'), 'utf8'))
const indexSource = readFileSync(resolve(root, 'src/index.ts'), 'utf8')
const APP_ROUTE = 'character-factory'

describe('routes.json — disposition dans le shell EGEN', () => {
  it('monte la page principale sur la route character-factory', () => {
    expect(routes.pages).toEqual([expect.objectContaining({ component: 'root', route: APP_ROUTE })])
  })

  it('chaque extension référence un composant exporté par index.ts', () => {
    for (const ext of routes.extensions) {
      expect(indexSource, `${ext.name} -> ${ext.component}`).toMatch(new RegExp(`export const ${ext.component}\\b`))
    }
  })

  it('place chaque extension sur le bon slot', () => {
    const bySlot = (slot) => routes.extensions.filter((e) => e.slot === slot)
    expect(bySlot('shell-rail-left-slot')).toHaveLength(1)
    expect(bySlot('shell-rail-left-slot')[0].meta.global).toBe(true)
    expect(bySlot('app-menu-slot')).toHaveLength(1)
    expect(bySlot('topbar-nav-slot').length).toBeGreaterThan(1)
  })

  it('les entrées de TopBar appartiennent à la section de l\'app et ciblent ses routes', () => {
    const entries = routes.extensions.filter((e) => e.slot === 'topbar-nav-slot')
    for (const e of entries) {
      expect(e.meta.section).toBe(APP_ROUTE)
      expect(e.meta.route === APP_ROUTE || e.meta.route.startsWith(`${APP_ROUTE}/`)).toBe(true)
    }
    expect(entries.filter((e) => e.meta.sectionRoute)).toHaveLength(1)
  })

  it('ordres uniques parmi les entrées de TopBar', () => {
    const orders = routes.extensions.filter((e) => e.slot === 'topbar-nav-slot').map((e) => e.order)
    expect(new Set(orders).size).toBe(orders.length)
  })
})
