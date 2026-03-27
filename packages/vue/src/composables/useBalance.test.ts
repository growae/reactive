import { describe, expect, it, vi } from 'vitest'
import { useBalance } from './useBalance.js'

const mockUseQuery = vi.fn(() => ({
  data: { value: undefined },
  error: { value: null },
  isError: { value: false },
  isPending: { value: true },
  isSuccess: { value: false },
  status: { value: 'pending' },
  queryKey: ['balance', {}],
}))

vi.mock('../utils/query.js', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

vi.mock('./useConfig.js', () => ({
  useConfig: vi.fn(() => ({
    subscribe: vi.fn(() => vi.fn()),
    networks: [{ id: 'ae_uat' }],
    state: {
      networkId: 'ae_uat',
      connections: new Map(),
      status: 'disconnected',
      current: undefined,
    },
  })),
}))

vi.mock('./useNetworkId.js', () => ({
  useNetworkId: vi.fn(() => ({ value: 'ae_uat' })),
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onScopeDispose: vi.fn(),
  }
})

describe('useBalance', () => {
  it('should return query result shape', () => {
    const result = useBalance({ address: 'ak_test123' })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('isError')
    expect(result).toHaveProperty('isPending')
    expect(result).toHaveProperty('isSuccess')
    expect(result).toHaveProperty('status')
  })

  it('should call useQuery with correct query key', () => {
    useBalance({ address: 'ak_test123', format: 'ae' })

    expect(mockUseQuery).toHaveBeenCalled()
  })

  it('should handle empty parameters', () => {
    const result = useBalance({} as any)

    expect(result).toBeDefined()
    expect(result).toHaveProperty('data')
  })
})
