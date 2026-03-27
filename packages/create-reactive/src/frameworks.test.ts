import { describe, expect, it } from 'vitest'

import { frameworks } from './frameworks.js'

describe('frameworks', () => {
  it('should have at least one framework', () => {
    expect(frameworks.length).toBeGreaterThan(0)
  })

  it('should have react, vue, solid, and vanilla frameworks', () => {
    const names = frameworks.map((f) => f.name)
    expect(names).toContain('react')
    expect(names).toContain('vue')
    expect(names).toContain('solid')
    expect(names).toContain('vanilla')
  })

  it('should have valid variants for each framework', () => {
    for (const framework of frameworks) {
      expect(framework.variants.length).toBeGreaterThan(0)
      for (const variant of framework.variants) {
        expect(variant.name).toBeTruthy()
        expect(variant.display).toBeTruthy()
        expect(typeof variant.color).toBe('function')
      }
    }
  })

  it('should have unique variant names across all frameworks', () => {
    const allVariantNames = frameworks.flatMap((f) =>
      f.variants.map((v) => v.name),
    )
    const unique = new Set(allVariantNames)
    expect(unique.size).toBe(allVariantNames.length)
  })

  it('should have display names for all frameworks', () => {
    for (const framework of frameworks) {
      expect(framework.display).toBeTruthy()
      expect(typeof framework.color).toBe('function')
    }
  })

  it('react should have vite-react and next variants', () => {
    const react = frameworks.find((f) => f.name === 'react')!
    const variantNames = react.variants.map((v) => v.name)
    expect(variantNames).toContain('vite-react')
    expect(variantNames).toContain('next')
  })

  it('vue should have vite-vue and nuxt variants', () => {
    const vue = frameworks.find((f) => f.name === 'vue')!
    const variantNames = vue.variants.map((v) => v.name)
    expect(variantNames).toContain('vite-vue')
    expect(variantNames).toContain('nuxt')
  })
})
