import { describe, expect, it, vi } from 'vitest'

vi.mock('../utils/query.js', () => ({
  useQuery: vi.fn(() => ({
    data: undefined,
    error: null,
    isPending: true,
    isSuccess: false,
    isError: false,
    isLoading: true,
    status: 'pending',
    refetch: vi.fn(),
  })),
}))

vi.mock('./useConfig.js', () => ({
  useConfig: vi.fn(() => ({
    state: { networkId: 'ae_uat' },
    getNodeClient: vi.fn(),
  })),
}))

vi.mock('./useNetworkId.js', () => ({
  useNetworkId: vi.fn(() => 'ae_uat'),
}))

import { useNameEntry } from './useNameEntry'

describe('useNameEntry', () => {
  it('should be a function', () => {
    expect(typeof useNameEntry).toBe('function')
  })

  it('should be exported', () => {
    expect(useNameEntry).toBeDefined()
  })

  it('should return query result shape', () => {
    const result = useNameEntry({ name: 'test.chain' })
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('isPending')
    expect(result).toHaveProperty('isSuccess')
  })
})
