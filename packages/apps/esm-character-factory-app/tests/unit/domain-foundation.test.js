import { describe, it, expect, beforeEach } from 'vitest'
import { validateResource, validateComposition, validateProfile } from '../../src/domain/validation'
import { DomainError } from '../../src/domain/types'
import { CompositionService } from '../../src/services/composition-service'
import { MemoryCompositionRepository, MemoryProfileRepository, MemoryResourceRepository } from '../../src/adapters/memory'
import { legacyManifestToResources, rootAnimationsToResources } from '../../src/adapters/legacy-manifest'

// Manifeste SYNTHÉTIQUE construit sur les champs lus par CharacterManifestData.js (aucun manifeste réel n'est
// accessible depuis l'environnement de développement : à confirmer sur un manifeste réel, cf. roadmap §2).
const manifest = {
  assetsLocation: 'https://assets.example/char',
  traitsDirectory: '/traits',
  thumbnailsDirectory: '/thumbs',
  requiredTraits: ['BODY'],
  traits: [
    { trait: 'BODY', name: 'Corps', iconSvg: 'body.svg', collection: [{ id: 'b1', name: 'Body 1', directory: 'body/b1.vrm', thumbnail: 'b1.png' }] },
    {
      trait: 'CHEST',
      name: 'Torse',
      collection: [{ id: 'c1', name: 'Chemise', directory: ['chest/c1.vrm', 'chest/c1_alt.vrm'], thumbnail: 'c1.png', restrictedItems: ['b1', 'inexistant'] }],
    },
  ],
  textureCollections: [{ trait: 'CHEST', collection: [{ id: 't1', name: 'Rouge', directory: 'tex/red.png', thumbnail: 'red_thumb.png' }] }],
}
const BASE = { id: 'legacy:demo', version: '1' }
const BODY = { id: 'legacy:demo:BODY:b1', version: '1' }
const CHEST = { id: 'legacy:demo:CHEST:c1', version: '1' }
const TEX = { id: 'legacy:demo:texture:CHEST:t1', version: '1' }

describe('adaptateur manifeste historique -> ressources', () => {
  const resources = legacyManifestToResources(manifest, { collectionId: 'demo', collectionName: 'Démo' })

  it('produit l\'agrégat personnage, les parties et les textures', () => {
    expect(resources.map((r) => r.id)).toEqual([BASE.id, BODY.id, CHEST.id, TEX.id])
    expect(resources.map((r) => r.kind)).toEqual(['character', 'part', 'part', 'texture'])
  })

  it('reconstruit les URLs comme CharacterManifestData (assetsLocation + dossier + directory)', () => {
    const body = resources.find((r) => r.id === BODY.id)
    expect(body.files).toEqual([
      { role: 'original', uri: 'https://assets.example/char/traits/body/b1.vrm', format: 'vrm' },
      { role: 'preview', uri: 'https://assets.example/char/thumbs/b1.png', format: 'png' },
    ])
  })

  it('gère un `directory` en tableau (plusieurs fichiers) et résout restrictedItems en conflits entre ressources', () => {
    const chest = resources.find((r) => r.id === CHEST.id)
    expect(chest.files.filter((f) => f.role === 'original').map((f) => f.uri)).toEqual([
      'https://assets.example/char/traits/chest/c1.vrm',
      'https://assets.example/char/traits/chest/c1_alt.vrm',
    ])
    expect(chest.compatibility.constraints).toEqual([`conflicts-with:${BODY.id}`]) // « inexistant » est ignoré, comme dans le code d'origine
    expect(chest.compatibility.slots).toEqual(['CHEST'])
  })

  it('résout les chemins relatifs contre l\'URL du manifeste', () => {
    const rel = legacyManifestToResources({ ...manifest, assetsLocation: './x' }, { collectionId: 'r', manifestUrl: 'https://h.example/m/manifest.json' })
    expect(rel.find((r) => r.id === 'legacy:r:BODY:b1').files[0].uri).toBe('https://h.example/m/x/traits/body/b1.vrm')
  })

  it('le personnage référence ses éléments par défaut (traits initiaux, ou requis + aléatoires)', () => {
    expect(resources.find((r) => r.id === BASE.id).defaults).toEqual([BODY])
    const withInitial = legacyManifestToResources({ ...manifest, initialTraits: ['CHEST', 'BODY'] }, { collectionId: 'demo' })
    expect(withInitial[0].defaults).toEqual([CHEST, BODY])
    const fallback = legacyManifestToResources({ ...manifest, requiredTraits: [] }, { collectionId: 'demo' })
    expect(fallback[0].defaults).toEqual([BODY]) // repli : premier élément du premier groupe
  })

  it('toutes les ressources produites sont valides', () => {
    for (const r of resources) expect(validateResource(r), r.id).toEqual({ ok: true, errors: [] })
  })

  it('animations du manifeste racine', () => {
    const anims = rootAnimationsToResources(
      { defaultAnimations: [{ name: 'T-Pose', description: '1_T-Pose', location: './animations/T-Pose.fbx' }] },
      'https://app.example/character-factory-assets/manifest.json',
    )
    expect(anims[0].kind).toBe('animation')
    expect(anims[0].files[0]).toEqual({ role: 'original', uri: 'https://app.example/character-factory-assets/animations/T-Pose.fbx', format: 'fbx' })
    expect(validateResource(anims[0]).ok).toBe(true)
  })
})

describe('validateResource', () => {
  const ok = () => structuredClone(legacyManifestToResources(manifest, { collectionId: 'demo' })[1])
  it('refuse un kind inconnu, un fichier sans uri, et une ressource publiée sans fichier original', () => {
    expect(validateResource({ ...ok(), kind: 'nope' }).ok).toBe(false)
    expect(validateResource({ ...ok(), files: [{ role: 'original', uri: '', format: 'vrm' }] }).ok).toBe(false)
    expect(validateResource({ ...ok(), files: [{ role: 'preview', uri: 'a.png', format: 'png' }] }).ok).toBe(false)
  })
  it('accepte un brouillon sans fichier', () => {
    expect(validateResource({ ...ok(), status: 'draft', files: [] }).ok).toBe(true)
  })
})

describe('validateProfile', () => {
  const profile = (version) => ({ id: 'p1', context: 'login', composition: { id: 'c', version }, initialState: {}, allowedCapabilities: ['setExpression'] })
  it('autorise « latest-published » ou un entier dans un profil', () => {
    expect(validateProfile(profile('latest-published')).ok).toBe(true)
    expect(validateProfile(profile(2)).ok).toBe(true)
    expect(validateProfile(profile('latest')).ok).toBe(false)
    expect(validateProfile(profile(0)).ok).toBe(false)
  })
  it('refuse une capacité inconnue', () => {
    expect(validateProfile({ ...profile(1), allowedCapabilities: ['teleport'] }).ok).toBe(false)
  })
})

describe('CompositionService — invariants du domaine', () => {
  let service, compositions, resources, n
  const items = () => [
    { slot: 'BODY', ref: BODY },
    { slot: 'CHEST', ref: CHEST, overrides: { texture: TEX, color: '#ff0000' } },
  ]

  beforeEach(() => {
    n = 0
    resources = new MemoryResourceRepository().seed(legacyManifestToResources(manifest, { collectionId: 'demo' }))
    compositions = new MemoryCompositionRepository()
    service = new CompositionService(compositions, resources, () => '2026-01-01T00:00:00.000Z', () => `id-${++n}`)
  })

  const expectCode = async (promise, code) => {
    const error = await promise.then(() => null, (e) => e)
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe(code)
  }

  it('crée un brouillon v1 aux références épinglées, sans aucun fichier copié (invariant 1)', async () => {
    const c = await service.create({ name: 'Tenue A', base: BASE, items: items() })
    expect(c).toMatchObject({ id: 'id-1', version: 1, status: 'draft' })
    expect(validateComposition(c).ok).toBe(true)
    const stored = JSON.stringify(await compositions.get(c.id, 1))
    expect(stored).not.toMatch(/"(files|uri|url|file|path)"/)
  })

  it('refuse une référence inconnue, un slot dupliqué et une copie de fichier', async () => {
    await expectCode(service.create({ name: 'x', base: BASE, items: [{ slot: 'BODY', ref: { id: 'nope', version: '1' } }] }), 'MISSING_REFERENCE')
    await expectCode(service.create({ name: 'x', base: BASE, items: [{ slot: 'BODY', ref: BODY }, { slot: 'BODY', ref: CHEST }] }), 'INVALID')
    await expectCode(service.create({ name: 'x', base: BASE, items: [{ slot: 'BODY', ref: BODY, files: [{ uri: 'copie.vrm' }] }] }), 'INVALID')
  })

  it('une version non brouillon est immuable ; createVersion crée la suivante (invariant 2)', async () => {
    const v1 = await service.create({ name: 'Tenue A', base: BASE, items: items() })
    await service.update(v1.id, 1, { name: 'Tenue A (révisée)' })
    await service.promote(v1.id, 1, 'published')
    await expectCode(service.update(v1.id, 1, { name: 'interdit' }), 'IMMUTABLE_VERSION')

    const v2 = await service.createVersion(v1.id, 1)
    expect(v2).toMatchObject({ version: 2, status: 'draft', items: v1.items, base: v1.base })
    await service.update(v1.id, 2, { items: [{ slot: 'BODY', ref: BODY }] })

    const reloadedV1 = await compositions.get(v1.id, 1)
    expect(reloadedV1.items).toHaveLength(2)
    expect(reloadedV1.name).toBe('Tenue A (révisée)')
    expect(reloadedV1.status).toBe('published')
  })

  it('une variante référence les mêmes ressources mais évolue indépendamment (invariant 3)', async () => {
    const source = await service.create({ name: 'Tenue A', base: BASE, items: items() })
    const variant = await service.createVariant(source.id, 1, 'Tenue A — bleue')
    expect(variant.id).not.toBe(source.id)
    expect(variant).toMatchObject({ version: 1, status: 'draft', variantOf: { id: source.id, version: 1 } })
    expect(variant.items).toEqual(source.items)
    expect(JSON.stringify(variant)).not.toMatch(/"(files|uri)"/)

    await service.update(variant.id, 1, { items: [{ slot: 'BODY', ref: BODY }] })
    expect((await compositions.get(source.id, 1)).items).toHaveLength(2)
    expect((await compositions.get(variant.id, 1)).items).toHaveLength(1)
  })

  it('résout les références en fichiers à charger (F7.5), « optimized » avant « original »', async () => {
    const c = await service.create({ name: 'Tenue A', base: BASE, items: items() })
    const { assets, missing } = await service.resolve(c)
    expect(missing).toEqual([])
    expect(assets.map((a) => a.slot)).toEqual(['base', 'BODY', 'CHEST'])
    expect(assets.find((a) => a.slot === 'BODY').file.uri).toBe('https://assets.example/char/traits/body/b1.vrm')
    expect(assets.find((a) => a.slot === 'CHEST').textureOverride.resource.id).toBe(TEX.id)

    const withOptimized = (await resources.get(BODY))
    withOptimized.files.unshift({ role: 'optimized', uri: 'https://assets.example/opt/b1.glb', format: 'glb' })
    const repo = new MemoryResourceRepository().seed([withOptimized, ...(await resources.list()).filter((r) => r.id !== BODY.id)])
    const optimised = await new CompositionService(compositions, repo).resolve(c)
    expect(optimised.assets.find((a) => a.slot === 'BODY').file.role).toBe('optimized')
  })

  it('signale les ressources manquantes à la résolution', async () => {
    const c = await service.create({ name: 'Tenue A', base: BASE, items: items() })
    const orphan = { ...c, items: [...c.items, { slot: 'FEET', ref: { id: 'absent', version: '9' } }] }
    expect((await service.resolve(orphan)).missing).toEqual([{ id: 'absent', version: '9' }])
  })

  it('aller-retour : sauvegarde puis relecture à l\'identique', async () => {
    const c = await service.create({ name: 'Tenue A', base: BASE, items: items(), appearance: { blendshapes: { smile: 0.4 }, colors: { skin: '#aa8866' } } })
    expect(await compositions.get(c.id)).toEqual(c)
    expect(await compositions.listVersions(c.id)).toHaveLength(1)
  })
})

describe('dépôts en mémoire', () => {
  it('filtre les ressources par type, texte et collection', async () => {
    const repo = new MemoryResourceRepository().seed(legacyManifestToResources(manifest, { collectionId: 'demo' }))
    expect(await repo.list({ kind: 'texture' })).toHaveLength(1)
    expect((await repo.list({ text: 'chemise' }))[0].id).toBe(CHEST.id)
    expect(await repo.list({ collection: 'autre' })).toHaveLength(0)
  })
  it('profils : put / get / delete', async () => {
    const repo = new MemoryProfileRepository()
    await repo.put({ id: 'p', composition: { id: 'c', version: 1 }, context: 'login', initialState: {}, allowedCapabilities: [] })
    expect((await repo.get('p')).context).toBe('login')
    await repo.delete('p')
    expect(await repo.get('p')).toBeNull()
  })
})
