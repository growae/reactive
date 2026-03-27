import { describe, it, expect } from 'vitest'

describe('Nuxt module', () => {
  it('should export a module definition', async () => {
    const mod = await import('./module.js')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('object')
  })
})
