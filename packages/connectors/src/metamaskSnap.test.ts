import type { ConnectorEventMap, Network } from '@growae/reactive'
import {
  ConnectorAccountUnavailableError,
  createEmitter,
} from '@growae/reactive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { metamaskSnap } from './metamaskSnap.js'

const TEST_ADDRESS = 'ak_2swhLkgBPeeADxVTAby6be6on1iqYGLvWamCaDmQnYF9E1WXBZ'
const SIGNED_TX = 'tx_signed_snap_abc123'
const SIGNED_MSG_B64 = Buffer.from([1, 2, 3, 4]).toString('base64')

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

function mockEthereum() {
  const request = vi
    .fn()
    .mockImplementation(async (args: { method: string; params?: any }) => {
      if (args.method === 'wallet_requestSnaps') return {}
      if (args.method === 'wallet_invokeSnap') {
        const snapMethod = args.params?.request?.method
        if (snapMethod === 'getPublicKey') return { publicKey: TEST_ADDRESS }
        if (snapMethod === 'signTransaction') return { signedTx: SIGNED_TX }
        if (snapMethod === 'signMessage') return { signature: SIGNED_MSG_B64 }
      }
      return null
    })
  ;(globalThis as any).window = { ethereum: { request } }
  return request
}

function clearEthereum() {
  delete (globalThis as any).window
}

describe('metamaskSnap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearEthereum()
  })

  it('should have correct type', () => {
    expect(metamaskSnap.type).toBe('metamaskSnap')
  })

  it('should return a connector factory', () => {
    const connector = metamaskSnap()
    expect(typeof connector).toBe('function')
  })

  it('should have correct metadata when instantiated', () => {
    mockEthereum()
    const connector = metamaskSnap()
    const config = makeConfig()
    const instance = connector(config)
    instance.setup?.()
    expect(instance.id).toBe('metamaskSnap')
    expect(instance.name).toBe('MetaMask Snap')
    expect(instance.type).toBe('metamaskSnap')
  })

  it('should accept a custom name', () => {
    mockEthereum()
    const connector = metamaskSnap({ name: 'My Snap' })
    const instance = connector(makeConfig())
    expect(instance.name).toBe('My Snap')
  })

  it('should throw ProviderNotFoundError when no MetaMask', async () => {
    clearEthereum()
    const connector = metamaskSnap()
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()

    await expect(instance.connect()).rejects.toThrow('Provider not found.')
  })

  it('should connect and return accounts', async () => {
    const request = mockEthereum()
    const connector = metamaskSnap()
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()

    const result = await instance.connect()

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'wallet_requestSnaps' }),
    )
    expect(result.accounts).toEqual([TEST_ADDRESS])
    expect(result.networkId).toBe('ae_uat')
  })

  it('should throw ConnectorNotConnectedError when not connected', async () => {
    const connector = metamaskSnap()
    const config = makeConfig()
    const instance = connector(config)

    await expect(instance.getAccounts()).rejects.toThrow(
      'Connector not connected.',
    )
  })

  it('should throw ConnectorNotConnectedError on signTransaction when not connected', async () => {
    const connector = metamaskSnap()
    const config = makeConfig()
    const instance = connector(config)

    await expect(
      instance.signTransaction!({ tx: 'tx_abc', networkId: 'ae_uat' }),
    ).rejects.toThrow('Connector not connected.')
  })

  it('should disconnect and clear state', async () => {
    mockEthereum()
    const connector = metamaskSnap()
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()
    await instance.connect()
    await instance.disconnect()

    await expect(instance.getAccounts()).rejects.toThrow(
      'Connector not connected.',
    )
  })

  it('should report isAuthorized based on connection state', async () => {
    mockEthereum()
    const connector = metamaskSnap()
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()

    expect(await instance.isAuthorized()).toBe(false)
    await instance.connect()
    expect(await instance.isAuthorized()).toBe(true)
    await instance.disconnect()
    expect(await instance.isAuthorized()).toBe(false)
  })

  it('should sign a transaction via snap', async () => {
    mockEthereum()
    const connector = metamaskSnap()
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()
    await instance.connect()

    const signed = await instance.signTransaction!({
      tx: 'tx_abc',
      networkId: 'ae_uat',
    })

    expect(signed).toBe(SIGNED_TX)
  })

  /**
   * As with `ledger`: one derivation path, one address. A named account this
   * snap did not derive throws rather than being signed from the configured
   * path, which would return a valid signature from the wrong sender.
   */
  it('signs for the account it derived when it is the one named', async () => {
    mockEthereum()
    const connector = metamaskSnap()
    const instance = connector(makeConfig())
    await instance.setup?.()
    const { accounts } = await instance.connect()

    const signed = await instance.signTransaction!({
      tx: 'tx_abc',
      networkId: 'ae_uat',
      onAccount: accounts[0]!,
    })

    expect(signed).toBe(SIGNED_TX)
  })

  it('throws for a named account the snap does not hold', async () => {
    mockEthereum()
    const connector = metamaskSnap()
    const instance = connector(makeConfig())
    await instance.setup?.()
    await instance.connect()

    await expect(
      instance.signTransaction!({
        tx: 'tx_abc',
        networkId: 'ae_uat',
        onAccount: 'ak_someOtherAccount',
      }),
    ).rejects.toThrow(ConnectorAccountUnavailableError)
  })

  it('should sign a message via snap', async () => {
    mockEthereum()
    const connector = metamaskSnap()
    const config = makeConfig()
    const instance = connector(config)
    await instance.setup?.()
    await instance.connect()

    const sig = await instance.signMessage!({ message: 'hello' })

    expect(sig).toBe(Buffer.from(SIGNED_MSG_B64, 'base64').toString('hex'))
  })

  it('should sign a message for the account the snap derived', async () => {
    mockEthereum()
    const connector = metamaskSnap()
    const instance = connector(makeConfig())
    await instance.setup?.()
    await instance.connect()

    const sig = await instance.signMessage!({
      message: 'hello',
      onAccount: TEST_ADDRESS,
    })

    expect(sig).toBe(Buffer.from(SIGNED_MSG_B64, 'base64').toString('hex'))
  })

  /**
   * The snap derives one address, so there is no other derivation path to
   * resolve to and the parameter used to be ignored outright. Ignoring it
   * returned a signature the caller then verified against the address it
   * named, which is not the address that signed.
   */
  it('throws on signMessage for a named account the snap does not hold', async () => {
    const request = mockEthereum()
    const connector = metamaskSnap()
    const instance = connector(makeConfig())
    await instance.setup?.()
    await instance.connect()
    request.mockClear()

    await expect(
      instance.signMessage!({
        message: 'hello',
        onAccount: 'ak_someOtherAccount',
      }),
    ).rejects.toThrow(ConnectorAccountUnavailableError)
    expect(request).not.toHaveBeenCalled()
  })

  it('should switch network', async () => {
    mockEthereum()
    const connector = metamaskSnap()
    const config = makeConfig([
      {
        id: 'ae_uat',
        name: 'Testnet',
        nodeUrl: 'https://testnet.aeternity.io',
      },
      {
        id: 'ae_mainnet',
        name: 'Mainnet',
        nodeUrl: 'https://mainnet.aeternity.io',
      },
    ])
    const instance = connector(config)
    await instance.setup?.()

    const changeSpy = vi.fn()
    config.emitter.on('change', changeSpy)

    const network = await instance.switchNetwork!({ networkId: 'ae_mainnet' })

    expect(network.id).toBe('ae_mainnet')
    expect(changeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ networkId: 'ae_mainnet' }),
    )
  })

  it('should emit disconnect on onDisconnect', () => {
    mockEthereum()
    const config = makeConfig()
    const connector = metamaskSnap()
    const instance = connector(config)

    const spy = vi.fn()
    config.emitter.on('disconnect', spy)

    instance.onDisconnect()
    expect(spy).toHaveBeenCalled()
  })
})
