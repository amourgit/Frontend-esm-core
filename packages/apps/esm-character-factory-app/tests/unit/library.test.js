import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, def, opts) => (typeof def === 'string' ? def.replace('{{count}}', opts?.count ?? '') : key) }) }))
// L'aperçu 3D (three / WebGL) est remplacé par un substitut : il n'est pas exécutable sous jsdom
vi.mock('../../src/features/library/ResourcePreview3D', () => ({ default: ({ uri }) => React.createElement('div', { 'data-testid': 'preview-stub' }, uri) }))

const mockCatalog = vi.fn()
vi.mock('../../src/features/library/catalog', async (orig) => ({ ...(await orig()), loadLegacyCatalog: (...a) => mockCatalog(...a) }))

import { appSection } from '../../src/app-section'
import { collectionIdFromUrl, resolveUrl } from '../../src/features/library/catalog'
import { computeFacets, sortResources, previewable3dFile, thumbnailOf } from '../../src/features/library/library-model'
import { frameDistance } from '../../src/runtime/preview-viewer'
import LibraryPage from '../../src/features/library/LibraryPage'
import { legacyManifestToResources, rootAnimationsToResources } from '../../src/adapters/legacy-manifest'

afterEach(() => { cleanup(); mockCatalog.mockReset() })

const characterManifest = (trait) => ({
  assetsLocation: 'https://assets.example/c',
  traitsDirectory: '/t',
  thumbnailsDirectory: '/th',
  traits: [{ trait, name: trait, collection: [{ id: 'x1', name: `Item ${trait}`, directory: `${trait}/x1.vrm`, thumbnail: 'x1.png' }] }],
})
const okJson = (data) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) })

describe('appSection', () => {
  it('bibliothèque seulement sous character-factory/bibliotheque', () => {
    expect(appSection('/spa/character-factory/bibliotheque')).toBe('library')
    expect(appSection('/character-factory/bibliotheque/')).toBe('library')
    expect(appSection('/spa/character-factory')).toBe('studio')
    expect(appSection('/spa/character-factory/creer')).toBe('studio')
    expect(appSection('/spa/annuaire/bibliotheque')).toBe('studio')
  })
})

const actualCatalog = () => vi.importActual('../../src/features/library/catalog')

describe('catalogue (manifestes historiques)', () => {
  it('collectionIdFromUrl : stable et distinct pour deux « Anata »', () => {
    expect(collectionIdFromUrl('https://m3-org.github.io/loot-assets/anata/female/manifest.json')).toBe('m3-org-github-io-loot-assets-anata-female')
    expect(collectionIdFromUrl('https://a.example/loot-assets/anata/male/manifest.json')).not.toBe(
      collectionIdFromUrl('https://m3-org.github.io/loot-assets/anata/female/manifest.json'),
    )
  })

  it('résout les manifestes relatifs, désambiguïse les noms et tolère les sources en échec', async () => {
    const root = {
      defaultAnimations: [{ name: 'T-Pose', description: 'x', location: './animations/T-Pose.fbx' }],
      characters: [
        { name: 'Anata', manifest: 'https://remote.example/loot-assets/anata/female/manifest.json' },
        { name: 'Anata', manifest: './loot-assets/anata/male/manifest.json' },
        { name: 'Autre', manifest: 'https://remote.example/autre/manifest.json' },
      ],
    }
    const calls = []
    const fetcher = (url) => {
      calls.push(url)
      if (url.endsWith('/base/manifest.json')) return okJson(root)
      if (url.includes('anata/female')) return okJson(characterManifest('BODY'))
      if (url.includes('anata/male')) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error('x')) })
      return okJson(characterManifest('HEAD'))
    }
    const { loadLegacyCatalog: realLoad } = await actualCatalog()
    const result = await realLoad('https://app.example/base/', fetcher)

    expect(calls[0]).toBe('https://app.example/base/manifest.json')
    expect(calls).toContain('https://app.example/base/loot-assets/anata/male/manifest.json') // relatif résolu contre le manifeste racine
    expect(result.collections.map((c) => c.name).sort()).toEqual(['Anata (female)', 'Autre'])
    expect(result.errors).toEqual([{ source: 'https://app.example/base/loot-assets/anata/male/manifest.json', message: 'HTTP 404' }])
    expect(result.resources.some((r) => r.kind === 'animation')).toBe(true)
    expect(result.resources.filter((r) => r.kind === 'part')).toHaveLength(2)
  })

  it('manifeste racine injoignable : catalogue vide + erreur, sans exception', async () => {
    const { loadLegacyCatalog: realLoad } = await actualCatalog()
    const result = await realLoad('https://app.example/base', () => Promise.reject(new Error('réseau')))
    expect(result.resources).toEqual([])
    expect(result.errors[0].message).toBe('réseau')
  })

  it('resolveUrl accepte une base relative à la page', () => {
    expect(resolveUrl('manifest.json', '/spa/assets/')).toMatch(/\/spa\/assets\/manifest\.json$/)
  })
})

const fixture = () => {
  const a = legacyManifestToResources(characterManifest('BODY'), { collectionId: 'col-a', collectionName: 'Collection A' })
  const b = legacyManifestToResources(characterManifest('HEAD'), { collectionId: 'col-b', collectionName: 'Collection B' })
  const anims = rootAnimationsToResources({ defaultAnimations: [{ name: 'Walk', location: './a/walk.fbx' }] }, 'https://app.example/m.json')
  return { resources: [...a, ...b, ...anims], collections: [{ id: 'col-a', name: 'Collection A', manifestUrl: 'u' }, { id: 'col-b', name: 'Collection B', manifestUrl: 'u' }], errors: [] }
}

describe('library-model', () => {
  const { resources } = fixture()
  it('facettes : compteurs par type et collection', () => {
    const f = computeFacets(resources)
    expect(f.kinds.find((k) => k.kind === 'part').count).toBe(2)
    expect(f.collections.find((c) => c.id === 'col-a').count).toBe(2) // personnage + 1 partie
  })
  it('tri par nom, insensible à la casse', () => {
    const names = sortResources(resources, 'name').map((r) => r.name)
    expect(names).toEqual([...names].sort((x, y) => x.localeCompare(y, undefined, { sensitivity: 'base', numeric: true })))
  })
  it('fichier 3D prévisualisable et miniature', () => {
    const part = resources.find((r) => r.kind === 'part')
    expect(previewable3dFile(part).format).toBe('vrm')
    expect(thumbnailOf(part)).toMatch(/x1\.png$/)
    expect(previewable3dFile(resources.find((r) => r.kind === 'character'))).toBeNull()
  })
})

describe('frameDistance (cadrage de l\'aperçu 3D)', () => {
  it('croît avec la taille et reste fini pour un objet vide', () => {
    expect(frameDistance([2, 2, 2], 35)).toBeGreaterThan(frameDistance([1, 1, 1], 35))
    expect(frameDistance([0, 0, 0], 35)).toBe(1)
  })
})

describe('LibraryPage', () => {
  it('affiche le catalogue, filtre, ouvre la fiche et l\'aperçu 3D à la demande', async () => {
    mockCatalog.mockResolvedValue(fixture())
    render(React.createElement(LibraryPage))

    await screen.findByRole('tab', { name: /Tous \(5\)/ })
    expect(screen.getByRole('tab', { name: /Élément \(2\)/ })).toBeTruthy()

    // recherche
    fireEvent.change(screen.getByLabelText('Rechercher une ressource…'), { target: { value: 'item head' } })
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1))

    // fiche
    fireEvent.click(screen.getByRole('listitem'))
    const detail = screen.getByRole('complementary')
    expect(within(detail).getByRole('heading', { name: 'Item HEAD' })).toBeTruthy()
    expect(within(detail).getByText('HEAD', { selector: 'dd' })).toBeTruthy()

    // aperçu 3D : seulement à la demande
    expect(screen.queryByTestId('preview-stub')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: "Afficher l'aperçu 3D" }))
    expect(screen.getByTestId('preview-stub').textContent).toMatch(/HEAD\/x1\.vrm$/)
  })

  it('signale les sources indisponibles', async () => {
    mockCatalog.mockResolvedValue({ ...fixture(), errors: [{ source: 'https://down.example/manifest.json', message: 'HTTP 404' }] })
    render(React.createElement(LibraryPage))
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/1 source\(s\) du catalogue indisponible/)
    expect(alert.textContent).toMatch(/down\.example/)
  })

  it('catalogue vide : message clair', async () => {
    mockCatalog.mockResolvedValue({ resources: [], collections: [], errors: [] })
    render(React.createElement(LibraryPage))
    expect(await screen.findByText('Aucune ressource ne correspond.')).toBeTruthy()
  })
})
