import { describe, it, expect } from 'vitest'
import { checkPair, worstVerdict } from '../../src/domain/compatibility'
import { CompatibilityService } from '../../src/services/compatibility-service'
import { MemoryResourceRepository } from '../../src/adapters/memory'
import { legacyManifestToResources } from '../../src/adapters/legacy-manifest'

const res = (o = {}) => ({
  id: 'r', kind: 'part', name: 'R', tags: [], collections: ['c1'], version: '1', status: 'published',
  files: [{ role: 'original', uri: 'a.vrm', format: 'vrm' }],
  compatibility: { skeleton: 'vrm-humanoid', slots: ['BODY'], attachmentPoints: [], constraints: [] },
  source: { origin: 'import' },
  ...o,
})
const character = (o = {}) => res({ id: 'ch', kind: 'character', files: [], compatibility: { skeleton: 'vrm-humanoid', slots: ['BODY', 'HEAD'], attachmentPoints: [], constraints: [] }, ...o })
const codes = (report) => report.reasons.map((r) => r.code)

describe('checkPair — élément ↔ personnage', () => {
  it('compatible : même squelette, emplacement disponible, même collection', () => {
    expect(checkPair(res(), character())).toEqual({ verdict: 'compatible', reasons: [], adaptations: [] })
  })
  it('incompatible : emplacement absent du personnage', () => {
    const r = checkPair(res({ compatibility: { skeleton: 'vrm-humanoid', slots: ['LEGS'], attachmentPoints: [], constraints: [] } }), character())
    expect(r.verdict).toBe('incompatible')
    expect(codes(r)).toContain('slot-unavailable')
  })
  it('incompatible : squelettes différents', () => {
    const r = checkPair(res({ compatibility: { skeleton: 'quadruped', slots: ['BODY'], attachmentPoints: [], constraints: [] } }), character())
    expect(r.verdict).toBe('incompatible')
    expect(codes(r)).toContain('skeleton-mismatch')
  })
  it('squelette non renseigné : reste compatible MAIS le signale (on ne prétend pas avoir vérifié)', () => {
    const r = checkPair(res({ compatibility: { slots: ['BODY'], attachmentPoints: [], constraints: [] } }), character())
    expect(r.verdict).toBe('compatible')
    expect(r.reasons).toEqual([expect.objectContaining({ code: 'skeleton-unknown', severity: 'info' })])
  })
  it('autre collection : compatible avec avertissement', () => {
    const r = checkPair(res({ collections: ['autre'] }), character())
    expect(r.verdict).toBe('compatible')
    expect(codes(r)).toEqual(['different-collection'])
  })
  it('ressource dépréciée : information seulement', () => {
    const r = checkPair(res({ status: 'deprecated' }), character())
    expect(r.verdict).toBe('compatible')
    expect(codes(r)).toEqual(['deprecated'])
  })
})

describe('checkPair — textures, animations, éléments entre eux', () => {
  const texture = (slots) => res({ kind: 'texture', compatibility: { slots, attachmentPoints: [], constraints: [] } })
  it('texture : doit viser l\'emplacement', () => {
    expect(checkPair(texture(['BODY']), res()).verdict).toBe('compatible')
    expect(checkPair(texture(['HEAD']), res()).verdict).toBe('incompatible')
  })
  const anim = (format, skeleton = 'vrm-humanoid') => res({ kind: 'animation', files: [{ role: 'original', uri: `a.${format}`, format }], compatibility: { skeleton, slots: [], attachmentPoints: [], constraints: [] } })
  it('animation FBX : adaptation (recalage) proposée', () => {
    const r = checkPair(anim('fbx'), character())
    expect(r.verdict).toBe('adaptation')
    expect(r.adaptations).toEqual([expect.objectContaining({ type: 'retarget' })])
  })
  it('animation d\'un autre format : compatible, recalage non vérifié ; squelette différent : incompatible', () => {
    const glb = checkPair(anim('glb'), character())
    expect(glb.verdict).toBe('compatible')
    expect(codes(glb)).toEqual(['animation-format-unknown'])
    expect(checkPair(anim('fbx', 'quadruped'), character()).verdict).toBe('incompatible')
  })
  it('deux éléments : même emplacement = conflit ; emplacements distincts = compatibles', () => {
    expect(codes(checkPair(res({ id: 'a' }), res({ id: 'b' })))).toContain('slot-conflict')
    const head = res({ id: 'b', compatibility: { skeleton: 'vrm-humanoid', slots: ['HEAD'], attachmentPoints: [], constraints: [] } })
    expect(checkPair(res({ id: 'a' }), head).verdict).toBe('compatible')
  })
  it('conflit déclaré : symétrique (il suffit qu\'un seul des deux le déclare)', () => {
    const a = res({ id: 'a' })
    const b = res({ id: 'b', compatibility: { skeleton: 'vrm-humanoid', slots: ['HEAD'], attachmentPoints: [], constraints: ['conflicts-with:a'] } })
    expect(codes(checkPair(a, b))).toContain('declared-conflict')
    expect(codes(checkPair(b, a))).toContain('declared-conflict')
  })
  it('association non prise en charge', () => {
    const r = checkPair(anim('fbx'), res())
    expect(r.verdict).toBe('incompatible')
    expect(codes(r)).toEqual(['unsupported-pair'])
  })
  it('worstVerdict', () => {
    expect(worstVerdict([])).toBe('compatible')
    expect(worstVerdict(['compatible', 'adaptation'])).toBe('adaptation')
    expect(worstVerdict(['adaptation', 'incompatible', 'compatible'])).toBe('incompatible')
  })
})

describe('CompatibilityService — compositions', () => {
  const manifest = {
    assetsLocation: 'https://assets.example/char', traitsDirectory: '/traits', thumbnailsDirectory: '/thumbs', requiredTraits: ['BODY'],
    traits: [
      { trait: 'BODY', collection: [{ id: 'b1', name: 'Body', directory: 'b1.vrm' }] },
      { trait: 'CHEST', collection: [{ id: 'c1', name: 'Chemise', directory: 'c1.vrm', restrictedItems: ['b1'] }, { id: 'c2', name: 'Pull', directory: 'c2.vrm' }] },
    ],
  }
  const repo = new MemoryResourceRepository().seed(legacyManifestToResources(manifest, { collectionId: 'demo' }))
  const service = new CompatibilityService(repo)
  const ref = (id) => ({ id: `legacy:demo:${id}`, version: '1' })
  const composition = (items) => ({ id: 'x', name: 'x', version: 1, status: 'draft', base: { id: 'legacy:demo', version: '1' }, items, appearance: { blendshapes: {}, colors: {} }, createdAt: '', updatedAt: '' })

  it('composition sans conflit : compatible', async () => {
    const r = await service.checkComposition(composition([{ slot: 'BODY', ref: ref('BODY:b1') }, { slot: 'CHEST', ref: ref('CHEST:c2') }]))
    expect(r.verdict).toBe('compatible')
    expect(r.conflicts).toEqual([])
  })
  it('restriction déclarée entre deux éléments : conflit détecté', async () => {
    const r = await service.checkComposition(composition([{ slot: 'BODY', ref: ref('BODY:b1') }, { slot: 'CHEST', ref: ref('CHEST:c1') }]))
    expect(r.verdict).toBe('incompatible')
    expect(r.conflicts).toHaveLength(1)
    expect(r.conflicts[0].report.reasons.map((x) => x.code)).toContain('declared-conflict')
  })
  it('ressource manquante : incompatible, signalée', async () => {
    const r = await service.checkComposition(composition([{ slot: 'FEET', ref: { id: 'absent', version: '1' } }]))
    expect(r.verdict).toBe('incompatible')
    expect(r.missing).toEqual([{ id: 'absent', version: '1' }])
  })
})
