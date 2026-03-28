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

import { useMicroBlock } from './useMicroBlock'

describe('useMicroBlock', () => {
  it('should be a function', () => {
    expect(typeof useMicroBlock).toBe('function')
  })

  it('should be exported', () => {
    expect(useMicroBlock).toBeDefined()
  })

  it('should return query result shape', () => {
    const result = useMicroBlock({ hash: 'mh_test' })
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('isPending')
    expect(result).toHaveProperty('isSuccess')
  })
})
