import { describe, it, expect, vi, beforeEach } from 'vitest'
import { metamaskSnap } from './metamaskSnap.js'
import { createEmitter } from '@reactive/core'
import type { ConnectorEventMap } from '@reactive/core'
import type { Network } from '@reactive/core'

const TEST_ADDRESS = 'ak_2swhLkgBPeeADxVTAby6be6on1iqYGLvWamCaDmQnYF9E1WXBZ'
const SIGNED_TX = 'tx_signed_snap_abc123'
const SIGNED_MSG_B64 = Buffer.from([1, 2, 3, 4]).toString('base64')

function makeConfig(networks: Network[] = [{ id: 'ae_uat', name: 'Testnet', nodeUrl: 'https://testnet.aeternity.io' }]) {
  const emitter = createEmitter<ConnectorEventMap>('test-uid')
  return {
    networks: networks as [Network, ...Network[]],
    emitter,
    storage: null,
  }
}

function mockEthereum() {
  const request = vi.fn().mockImplementation(async (args: { method: string; params?: any }) => {
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

    await expect(instance.getAccounts()).rejects.toThrow('Connector not connected.')
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

    await expect(instance.getAccounts()).rejects.toThrow('Connector not connected.')
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

  it('should switch network', async () => {
    mockEthereum()
    const connector = metamaskSnap()
    const config = makeConfig([
      { id: 'ae_uat', name: 'Testnet', nodeUrl: 'https://testnet.aeternity.io' },
      { id: 'ae_mainnet', name: 'Mainnet', nodeUrl: 'https://mainnet.aeternity.io' },
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
