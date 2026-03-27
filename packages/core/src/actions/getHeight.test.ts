import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockNode } = vi.hoisted(() => ({
  mockNode: {
    getCurrentKeyBlockHeight: vi.fn(),
  },
}))

vi.mock('@aeternity/aepp-sdk', () => ({
  Node: vi.fn().mockImplementation(() => mockNode),
}))

import { createConfig } from '../createConfig'
import { testnet } from '../types/network'
import { getHeight } from './getHeight'

describe('getHeight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return current height', async () => {
    mockNode.getCurrentKeyBlockHeight.mockResolvedValue({ height: 850000 })

    const config = createConfig({ networks: [testnet], storage: null })
    const height = await getHeight(config)
    expect(height).toBe(850000)
  })

  it('should return a number', async () => {
    mockNode.getCurrentKeyBlockHeight.mockResolvedValue({ height: 1 })

    const config = createConfig({ networks: [testnet], storage: null })
    const height = await getHeight(config)
    expect(typeof height).toBe('number')
  })

  it('should call getCurrentKeyBlockHeight on the node', async () => {
    mockNode.getCurrentKeyBlockHeight.mockResolvedValue({ height: 100 })

    const config = createConfig({ networks: [testnet], storage: null })
    await getHeight(config)
    expect(mockNode.getCurrentKeyBlockHeight).toHaveBeenCalledOnce()
  })
})
