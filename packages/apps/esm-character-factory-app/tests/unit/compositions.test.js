import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, def, opts) => (typeof def === 'string' ? def.replace(/\{\{(\w+)\}\}/g, (_m, k) => opts?.[k] ?? '') : key) }) }))
vi.mock('../../src/features/library/ResourcePreview3D', () => ({ default: ({ uris }) => React.createElement('div', { 'data-testid': 'preview-stub' }, uris.join(',')) }))
const mockCatalog = vi.fn()
vi.mock('../../src/features/library/catalog', async (orig) => ({ ...(await orig()), loadLegacyCatalog: (...a) => mockCatalog(...a) }))

import CompositionsPage from '../../src/features/compositions/CompositionsPage'
import { resetCatalog } from '../../src/features/catalog-store'
import { candidatesForSlot, compositionPreviewUris, diffCompositions, latestPerComposition, slotsOf } from '../../src/features/compositions/composition-model'
import { MemoryCompositionRepository } from '../../src/adapters/memory'
import { legacyManifestToResources } from '../../src/adapters/legacy-manifest'
import { appSection } from '../../src/app-section'

afterEach(() => { cleanup(); mockCatalog.mockReset(); resetCatalog() })

const manifest = {
  assetsLocation: 'https://assets.example/char', traitsDirectory: '/traits', thumbnailsDirectory: '/thumbs', requiredTraits: ['BODY', 'CHEST'],
  traits: [
    { trait: 'BODY', collection: [{ id: 'b1', name: 'Body', directory: 'b1.vrm' }] },
    { trait: 'CHEST', collection: [{ id: 'c1', name: 'Chemise', directory: 'c1.vrm', restrictedItems: ['b1'] }, { id: 'c2', name: 'Pull', directory: 'c2.vrm' }] },
  ],
}
const resources = legacyManifestToResources(manifest, { collectionId: 'demo', collectionName: 'Démo' })
const catalog = () => ({ resources, collections: [{ id: 'demo', name: 'Démo', manifestUrl: 'u' }], errors: [] })
const BODY = { id: 'legacy:demo:BODY:b1', version: '1' }
const CHEST1 = { id: 'legacy:demo:CHEST:c1', version: '1' }
const CHEST2 = { id: 'legacy:demo:CHEST:c2', version: '1' }
const comp = (o) => ({ id: 'c', name: 'C', version: 1, status: 'draft', base: { id: 'legacy:demo', version: '1' }, items: [], appearance: { blendshapes: {}, colors: {} }, createdAt: '2026-01-01', updatedAt: '2026-01-01', ...o })

describe('composition-model', () => {
  it('appSection reconnaît les compositions', () => {
    expect(appSection('/spa/character-factory/compositions')).toBe('compositions')
  })
  it('slotsOf et candidatesForSlot', () => {
    const character = resources.find((r) => r.kind === 'character')
    expect(slotsOf(character)).toEqual(['BODY', 'CHEST'])
    expect(candidatesForSlot('CHEST', resources).map((r) => r.name)).toEqual(['Chemise', 'Pull'])
    expect(slotsOf(undefined)).toEqual([])
  })
  it('latestPerComposition : dernière version de chaque composition', () => {
    const list = latestPerComposition([comp({ version: 1 }), comp({ version: 3 }), comp({ id: 'd', name: 'D', version: 2 })])
    expect(list.map((c) => `${c.id}@${c.version}`).sort()).toEqual(['c@3', 'd@2'])
  })
  it('aperçu : éléments par défaut, sauf ceux dont l\'emplacement est redéfini', () => {
    expect(compositionPreviewUris(comp({}), resources)).toEqual(['https://assets.example/char/traits/b1.vrm', 'https://assets.example/char/traits/c1.vrm'])
    const swapped = compositionPreviewUris(comp({ items: [{ slot: 'CHEST', ref: CHEST2 }] }), resources)
    expect(swapped).toEqual(['https://assets.example/char/traits/b1.vrm', 'https://assets.example/char/traits/c2.vrm'])
  })
  it('diffCompositions : repère les emplacements qui diffèrent', () => {
    const rows = diffCompositions([comp({ items: [{ slot: 'BODY', ref: BODY }, { slot: 'CHEST', ref: CHEST1 }] }), comp({ id: 'd', items: [{ slot: 'BODY', ref: BODY }, { slot: 'CHEST', ref: CHEST2 }] })], resources)
    expect(rows.map((r) => [r.key, r.same])).toEqual([['base', true], ['BODY', true], ['CHEST', false]])
    expect(rows.find((r) => r.key === 'CHEST').values).toEqual(['Chemise', 'Pull'])
  })
})

describe('CompositionsPage — parcours complet', () => {
  const setup = async () => {
    mockCatalog.mockResolvedValue(catalog())
    const repository = new MemoryCompositionRepository()
    render(React.createElement(CompositionsPage, { repository }))
    await screen.findByRole('button', { name: /Nouvelle composition/ })
    return repository
  }
  // Parcours guidé : bouton principal -> panneau de création (nom + carte du personnage) -> « Créer la composition »
  const create = async (name) => {
    fireEvent.click(screen.getByRole('button', { name: /Nouvelle composition/ }))
    fireEvent.change(screen.getByLabelText('Nom de la composition'), { target: { value: name } })
    fireEvent.click(screen.getByRole('button', { name: /Démo/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Créer la composition' }))
    await screen.findByLabelText('Version')
  }
  const choose = (slot, id) => fireEvent.change(screen.getByLabelText(new RegExp(`^${slot}`)), { target: { value: id } })

  it('créer, enregistrer, publier (immuable), nouvelle version, variante, comparer', async () => {
    const repository = await setup()
    expect(screen.getByText(/Vous n'avez pas encore de composition/)).toBeTruthy()

    // création + choix d'un élément
    await create('Tenue A')
    expect(screen.getByLabelText('Nom de la composition').value).toBe('Tenue A')
    choose('BODY', BODY.id)
    choose('CHEST', CHEST2.id)
    await waitFor(() => expect(screen.getByTestId('compat-verdict').textContent).toBe('✓ Compatible'))

    // la publication exige un enregistrement préalable
    expect(screen.getByRole('button', { name: 'Publier cette version' }).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer' }).disabled).toBe(true))
    const stored = (await repository.list())[0]
    expect(stored.items.map((i) => i.slot).sort()).toEqual(['BODY', 'CHEST'])
    expect(JSON.stringify(stored)).not.toMatch(/"(files|uri)"/) // aucune copie de fichier

    // publication -> immuable
    fireEvent.click(screen.getByRole('button', { name: 'Publier cette version' }))
    expect(await screen.findByText(/elle est immuable/)).toBeTruthy()
    expect(screen.getByLabelText('Nom de la composition').disabled).toBe(true)
    expect(screen.getByLabelText(/^BODY/).disabled).toBe(true)
    expect((await repository.get(stored.id, 1)).status).toBe('published')

    // nouvelle version (brouillon), la v1 reste intacte
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle version' }))
    await waitFor(() => expect(screen.getByLabelText('Version').value).toBe('2'))
    expect(screen.queryByText(/elle est immuable/)).toBeNull()
    expect(within(screen.getByLabelText('Version')).getAllByRole('option')).toHaveLength(2)

    // variante : nouvelle composition indépendante qui référence les mêmes ressources
    fireEvent.change(screen.getByLabelText('Nom de la variante'), { target: { value: 'Tenue B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Créer une variante' }))
    await waitFor(() => expect(screen.getByLabelText('Nom de la composition').value).toBe('Tenue B'))
    choose('CHEST', CHEST1.id) // Chemise (conflit déclaré avec Body) : doit être signalé
    await waitFor(() => expect(screen.getByTestId('compat-verdict').textContent).toBe('✕ Incompatible'))
    expect(screen.getByRole('button', { name: 'Publier cette version' }).disabled).toBe(true)
    choose('CHEST', '') // retour aux éléments par défaut
    choose('BODY', BODY.id)
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer' }).disabled).toBe(true))

    const all = await repository.list()
    expect(new Set(all.map((c) => c.id)).size).toBe(2)
    // créée depuis la v2 de « Tenue A » (affichée à ce moment) : la variante garde la version source exacte
    expect(all.find((c) => c.name === 'Tenue B').variantOf).toMatchObject({ version: 2 })

    // liste + comparaison
    fireEvent.click(screen.getByRole('button', { name: /Mes compositions/ }))
    const list = await screen.findByTestId('composition-list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(within(list).getByText('variante de Tenue A')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Sélectionner Tenue A'))
    fireEvent.click(screen.getByLabelText('Sélectionner Tenue B'))
    fireEvent.click(screen.getByRole('button', { name: /Comparer la sélection \(2\/3\)/ }))
    const table = await screen.findByTestId('compare-table')
    const chestRow = within(table).getByText('CHEST').closest('tr')
    expect(chestRow.getAttribute('data-different')).toBe('true') // Pull (A) ≠ — (B)
    expect(within(table).getByText('BODY').closest('tr').getAttribute('data-different')).toBe('false')
  })

  it('un conflit déclaré est signalé et bloque la publication', async () => {
    await setup()
    await create('Conflit')
    choose('BODY', BODY.id)
    choose('CHEST', CHEST1.id)
    await waitFor(() => expect(screen.getByTestId('compat-verdict').textContent).toBe('✕ Incompatible'))
    expect(screen.getByText(/Conflit déclaré par le manifeste/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Publier cette version' }).disabled).toBe(true)
  })

  it('l\'aperçu 3D assemble les éléments choisis', async () => {
    await setup()
    await create('Aperçu')
    choose('CHEST', CHEST2.id)
    fireEvent.click(screen.getByRole('button', { name: "Afficher l'aperçu 3D" }))
    expect(screen.getByTestId('preview-stub').textContent).toBe('https://assets.example/char/traits/b1.vrm,https://assets.example/char/traits/c2.vrm')
  })

  it('état vide : explique les étapes et propose de créer ; le panneau dit ce qu\'il manque', async () => {
    await setup()
    expect(screen.getByText(/Créez une composition : un nom et un personnage de base/)).toBeTruthy()
    expect(screen.getByText(/Choisissez un élément pour chaque emplacement/)).toBeTruthy()
    expect(screen.getByText(/puis publiez/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Comparer/ })).toBeNull() // inutile tant qu'il y a moins de 2 compositions

    fireEvent.click(screen.getByRole('button', { name: 'Créer ma première composition' }))
    const panel = screen.getByRole('region', { name: 'Créer une composition' })
    const submit = within(panel).getByRole('button', { name: 'Créer la composition' })
    expect(submit.disabled).toBe(true)
    expect(within(panel).getByText('Il manque : un nom, un personnage de base.')).toBeTruthy()

    fireEvent.change(within(panel).getByLabelText('Nom de la composition'), { target: { value: 'X' } })
    expect(within(panel).getByText('Il manque : un personnage de base.')).toBeTruthy()
    fireEvent.click(within(panel).getByRole('button', { name: /Démo/ }))
    expect(within(panel).getByRole('button', { name: /Démo/ }).getAttribute('aria-pressed')).toBe('true')
    expect(submit.disabled).toBe(false)
    expect(within(panel).queryByText(/Il manque/)).toBeNull()

    fireEvent.click(within(panel).getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('region', { name: 'Créer une composition' })).toBeNull()
  })

  it('sans personnage disponible : explique pourquoi', async () => {
    mockCatalog.mockResolvedValue({ resources: [], collections: [], errors: [{ source: 'u', message: 'HTTP 404' }] })
    render(React.createElement(CompositionsPage, { repository: new MemoryCompositionRepository() }))
    fireEvent.click(await screen.findByRole('button', { name: /Nouvelle composition/ }))
    expect(screen.getByText(/Aucun personnage disponible/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Créer la composition' }).disabled).toBe(true)
  })

  it('éditeur : signale les modifications non enregistrées et explique pourquoi « Publier » est indisponible', async () => {
    await setup()
    await create('Guide')
    expect(screen.queryByText(/Modifications non enregistrées/)).toBeNull()
    expect(screen.getByText(/1\. Personnage de base/)).toBeTruthy()
    expect(screen.getByText(/4\. Aperçu 3D/)).toBeTruthy()

    choose('CHEST', CHEST2.id)
    expect(screen.getByText(/Modifications non enregistrées/)).toBeTruthy()
    expect(screen.getByText('Enregistrez vos modifications pour pouvoir publier.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(screen.queryByText(/Modifications non enregistrées/)).toBeNull())
    expect(await screen.findByText(/Publier rend cette version immuable/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Publier cette version' }).disabled).toBe(false)
  })

  it('conflit : la raison de l\'indisponibilité de « Publier » est affichée', async () => {
    await setup()
    await create('Conflit 2')
    choose('BODY', BODY.id)
    choose('CHEST', CHEST1.id)
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText(/Corrigez les incompatibilités/)).toBeTruthy()
  })
})
