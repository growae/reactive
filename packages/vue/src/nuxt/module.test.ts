import { describe, expect, it } from 'vitest'
import mod from './module.js'

describe('Nuxt module', () => {
  it('should export a module definition', () => {
    expect(mod).toBeDefined()
    expect(typeof mod).toBe('function')
  })
})
