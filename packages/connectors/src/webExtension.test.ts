import type { ConnectorEventMap, Network } from '@growae/reactive'
import {
  ConnectorAccountUnavailableError,
  createEmitter,
} from '@growae/reactive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { webExtension } from './webExtension.js'

function makeConfig(
  networks: Network[] = [
    { id: 'ae_uat', name: 'Testnet', nodeUrl: 'https://testnet.aeternity.io' },
  ],
) {
  const emitter = createEmitter<ConnectorEventMap>('test-uid')
  return {
    networks: networks as [Network, ...Network[]],
    emitter,
    storage: null,
  }
}

const { TEST_ADDRESS, mockFrame, mockGetConnection } = vi.hoisted(() => {
  const TEST_ADDRESS = 'ak_2swhLkgBPeeADxVTAby6be6on1iqYGLvWamCaDmQnYF9E1WXBZ'
  return {
    TEST_ADDRESS,
    mockFrame: {
      networkId: 'ae_uat',
      isConnected: true,
      accounts: [{ address: TEST_ADDRESS }],
      subscribeAccounts: vi.fn().mockResolvedValue([{ address: TEST_ADDRESS }]),
      askToSelectNetwork: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
      on: vi.fn(),
    },
    mockGetConnection: vi.fn().mockReturnValue({}),
  }
})

// Partial: the wallet entry points below are stubbed, everything else in the
// sdk is the real module. `@growae/reactive` reaches the sdk for values as well
// as types — a class it subclasses is `undefined` under a wholesale mock, and
// the failure lands here rather than where the mock is written.
vi.mock('@aeternity/aepp-sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@aeternity/aepp-sdk')>()),
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

    await expect(instance.getAccounts()).rejects.toThrow(
      'Connector not connected.',
    )
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

  /**
   * The wallet holds every account it exposes, so `onAccount` selects between
   * them. Before it existed, `signTransaction` took `accounts[0]` and nothing
   * propagated `switchActiveAccount` to the wallet: the transaction was built
   * for the selected account and signed by the first one.
   *
   * The unknown-account case throws rather than falling back the way
   * `signMessage` still does. A fallback here returns a valid signature over a
   * transaction from a different sender, which the node accepts.
   */
  describe('signTransaction onAccount', () => {
    const SECOND_ADDRESS =
      'ak_2K7ngGLmhQza45Dtw8352T8kTDrHBEWf9KFqc5pNtJ6G2DQ7uS'
    const signFirst = vi.fn().mockResolvedValue('tx_signedByFirst')
    const signSecond = vi.fn().mockResolvedValue('tx_signedBySecond')

    async function connectedWithTwoAccounts() {
      mockFrame.accounts = [
        { address: TEST_ADDRESS, signTransaction: signFirst },
        { address: SECOND_ADDRESS, signTransaction: signSecond },
      ] as never
      mockFrame.subscribeAccounts.mockResolvedValue([
        { address: TEST_ADDRESS },
        { address: SECOND_ADDRESS },
      ])
      const instance = webExtension()(makeConfig())
      await instance.setup?.()
      await instance.connect()
      return instance
    }

    beforeEach(() => {
      signFirst.mockClear().mockResolvedValue('tx_signedByFirst')
      signSecond.mockClear().mockResolvedValue('tx_signedBySecond')
    })

    it('signs with the named account rather than the first', async () => {
      const instance = await connectedWithTwoAccounts()

      const signed = await instance.signTransaction!({
        tx: 'tx_abc',
        networkId: 'ae_uat',
        onAccount: SECOND_ADDRESS,
      })

      expect(signed).toBe('tx_signedBySecond')
      expect(signFirst).not.toHaveBeenCalled()
    })

    it('signs with the first account when none is named', async () => {
      const instance = await connectedWithTwoAccounts()

      const signed = await instance.signTransaction!({
        tx: 'tx_abc',
        networkId: 'ae_uat',
      })

      expect(signed).toBe('tx_signedByFirst')
    })

    it('throws for an account the wallet does not hold', async () => {
      const instance = await connectedWithTwoAccounts()

      await expect(
        instance.signTransaction!({
          tx: 'tx_abc',
          networkId: 'ae_uat',
          onAccount: 'ak_someOtherAccount',
        }),
      ).rejects.toThrow(ConnectorAccountUnavailableError)
      expect(signFirst).not.toHaveBeenCalled()
      expect(signSecond).not.toHaveBeenCalled()
    })
  })
})
