import { describe, it, expect, vi, beforeEach } from 'vitest'
import { webExtension } from './webExtension.js'
import { createEmitter } from '@reactive/core'
import type { ConnectorEventMap } from '@reactive/core'
import type { Network } from '@reactive/core'

const TEST_ADDRESS = 'ak_2swhLkgBPeeADxVTAby6be6on1iqYGLvWamCaDmQnYF9E1WXBZ'

function makeConfig(networks: Network[] = [{ id: 'ae_uat', name: 'Testnet', nodeUrl: 'https://testnet.aeternity.io' }]) {
  const emitter = createEmitter<ConnectorEventMap>('test-uid')
  return {
    networks: networks as [Network, ...Network[]],
    emitter,
    storage: null,
  }
}

const mockFrame = {
  networkId: 'ae_uat',
  isConnected: true,
  accounts: [{ address: TEST_ADDRESS }],
  subscribeAccounts: vi.fn().mockResolvedValue([{ address: TEST_ADDRESS }]),
  askToSelectNetwork: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn(),
  on: vi.fn(),
}

const mockGetConnection = vi.fn().mockReturnValue({})

vi.mock('@aeternity/aepp-sdk', () => ({
  WalletConnectorFrame: {
    connect: vi.fn().mockResolvedValue(mockFrame),
  },
  BrowserWindowMessageConnection: vi.fn(),
  walletDetector: vi.fn(
    (
      _connection: unknown,
      onDetected: (data: { newWallet: unknown }) => void,
    ) => {
      setTimeout(() => {
        onDetected({
          newWallet: {
            info: {
              id: 'superhero',
              name: 'Superhero',
              networkId: 'ae_uat',
              type: 'extension',
              origin: 'chrome-extension://test',
            },
            getConnection: mockGetConnection,
          },
        })
      }, 0)
      return vi.fn()
    },
  ),
  MESSAGE_DIRECTION: { to_waellet: 'to_waellet', to_aepp: 'to_aepp' },
}))

describe('webExtension', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrame.on.mockReset()
    mockFrame.disconnect.mockReset()
    mockFrame.subscribeAccounts.mockResolvedValue([{ address: TEST_ADDRESS }])
  })

  it('should have correct type and metadata', () => {
    expect(webExtension.type).toBe('webExtension')
    const connector = webExtension()
    const instance = connector(makeConfig())
    expect(instance.id).toBe('webExtension')
    expect(instance.name).toBe('Web Extension Wallet')
    expect(instance.type).toBe('webExtension')
  })

  it('should detect wallet and connect', async () => {
    const connector = webExtension({ name: 'Test dApp' })
    const instance = connector(makeConfig())

    const result = await instance.connect()

    expect(result.accounts).toEqual([TEST_ADDRESS])
    expect(result.networkId).toBe('ae_uat')
    expect(mockGetConnection).toHaveBeenCalled()
  })

  it('should disconnect and clear state', async () => {
    const connector = webExtension()
    const instance = connector(makeConfig())

    await instance.connect()
    await instance.disconnect()

    await expect(instance.getAccounts()).rejects.toThrow('Connector not connected.')
  })

  it('should report isAuthorized correctly', async () => {
    const connector = webExtension()
    const instance = connector(makeConfig())

    expect(await instance.isAuthorized()).toBe(false)
    await instance.connect()
    expect(await instance.isAuthorized()).toBe(true)
  })

  it('should throw on getProvider when not connected', async () => {
    const connector = webExtension()
    const instance = connector(makeConfig())
    await expect(instance.getProvider()).rejects.toThrow('Provider not found.')
  })

  it('should register event listeners after connect', async () => {
    const connector = webExtension()
    const instance = connector(makeConfig())
    await instance.connect()

    const registeredEvents = mockFrame.on.mock.calls.map(
      (call: unknown[]) => call[0],
    )
    expect(registeredEvents).toContain('accountsChange')
    expect(registeredEvents).toContain('networkIdChange')
    expect(registeredEvents).toContain('disconnect')
  })

  it('should emit disconnect via onDisconnect', () => {
    const config = makeConfig()
    const connector = webExtension()
    const instance = connector(config)

    const spy = vi.fn()
    config.emitter.on('disconnect', spy)

    instance.onDisconnect()
    expect(spy).toHaveBeenCalled()
  })

  it('should emit change via onAccountsChanged', () => {
    const config = makeConfig()
    const connector = webExtension()
    const instance = connector(config)

    const spy = vi.fn()
    config.emitter.on('change', spy)

    instance.onAccountsChanged([TEST_ADDRESS])
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ accounts: [TEST_ADDRESS] }),
    )
  })
})
