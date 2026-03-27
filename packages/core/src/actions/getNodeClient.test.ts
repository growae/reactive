import { describe, it, expect, vi } from 'vitest'
import { getNodeClient } from './getNodeClient.js'

describe('getNodeClient', () => {
  it('should be a function', () => {
    expect(typeof getNodeClient).toBe('function')
  })

  it('should call config.getNodeClient with networkId', () => {
    const mockNode = { url: 'https://testnet.aeternity.io' }
    const mockConfig = {
      getNodeClient: vi.fn().mockReturnValue(mockNode),
    }

    const result = getNodeClient(mockConfig as any, { networkId: 'ae_uat' })

    expect(mockConfig.getNodeClient).toHaveBeenCalledWith({ networkId: 'ae_uat' })
    expect(result).toBe(mockNode)
  })

  it('should call config.getNodeClient with undefined networkId by default', () => {
    const mockNode = {}
    const mockConfig = {
      getNodeClient: vi.fn().mockReturnValue(mockNode),
    }

    const result = getNodeClient(mockConfig as any)

    expect(mockConfig.getNodeClient).toHaveBeenCalledWith({ networkId: undefined })
    expect(result).toBe(mockNode)
  })
})
