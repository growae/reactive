import { describe, expect, it, vi } from 'vitest'
import { ReactiveProviderNotFoundError } from '../errors/context'
import { useConfig } from './useConfig'

describe('useConfig', () => {
  it('should be a function', () => {
    expect(typeof useConfig).toBe('function')
  })

  it('should return config when passed directly as parameter', () => {
    const mockConfig = {
      _internal: { ssr: false },
      subscribe: vi.fn(),
      getState: vi.fn(),
    } as any

    const config = useConfig(() => ({ config: mockConfig }))
    expect(config()).toBe(mockConfig)
  })

  it('should throw ReactiveProviderNotFoundError when no config', () => {
    expect(() => useConfig(() => ({}))).toThrow(ReactiveProviderNotFoundError)
  })

  it('should throw with descriptive message', () => {
    expect(() => useConfig(() => ({}))).toThrow(
      '`useConfig` must be used within `ReactiveProvider`.',
    )
  })
})
