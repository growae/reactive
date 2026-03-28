import { describe, expect, it, vi } from 'vitest'

const mockUseQuery = vi.fn((_options?: unknown) => ({
  data: { value: undefined },
  error: { value: null },
  isError: { value: false },
  isPending: { value: true },
  isSuccess: { value: false },
  status: { value: 'pending' },
}))

vi.mock('../utils/query.js', () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
}))

vi.mock('./useConfig.js', () => ({
  useConfig: vi.fn(() => ({
    state: { networkId: 'ae_uat' },
  })),
}))

vi.mock('./useNetworkId.js', () => ({
  useNetworkId: vi.fn(() => ({ value: 'ae_uat' })),
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return { ...actual, onScopeDispose: vi.fn() }
})

import { useMicroBlock } from './useMicroBlock'

describe('useMicroBlock', () => {
  it('should be a function', () => {
    expect(typeof useMicroBlock).toBe('function')
  })

  it('should return query result shape', () => {
    const result = useMicroBlock({ hash: 'mh_test' } as any)
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('isPending')
    expect(result).toHaveProperty('isSuccess')
  })

  it('should call useQuery', () => {
    useMicroBlock({ hash: 'mh_test' } as any)
    expect(mockUseQuery).toHaveBeenCalled()
  })

  it('should handle empty parameters', () => {
    const result = useMicroBlock({} as any)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('data')
  })
})
