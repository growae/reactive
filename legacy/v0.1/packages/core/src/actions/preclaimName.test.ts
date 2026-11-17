import { beforeEach, describe, expect, it, vi } from 'vitest'

const { nameRef } = vi.hoisted(() => ({
  nameRef: { current: undefined as unknown },
}))

// `Name` is stubbed so the return mapping can be read without a node; the
// connector-signing evidence for this action is in `aens/aensSigning.test.ts`,
// where the sdk builds and signs a real transaction.
vi.mock('@aeternity/aepp-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aeternity/aepp-sdk')>()
  return {
    ...actual,
    Name: vi.fn().mockImplementation(() => nameRef.current),
  }
})

import { commitmentHash } from '@aeternity/aepp-sdk'
import { PreclaimNameNoAccountError, preclaimName } from './preclaimName.js'

const ADDRESS = 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU'
const BLOCK_HASH = 'mh_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU'
const SALT = 4242

function connectedConfig() {
  return {
    state: {
      current: 'uid1',
      networkId: 'ae_uat',
      connections: new Map([
        [
          'uid1',
          {
            activeAccount: ADDRESS,
            networkId: 'ae_uat',
            connector: { name: 'mock', signTransaction: vi.fn() },
          },
        ],
      ]),
    },
    getNodeClient: vi.fn().mockReturnValue({}),
  }
}

let preclaim: ReturnType<typeof vi.fn>

describe('preclaimName', () => {
  beforeEach(() => {
    preclaim = vi.fn().mockResolvedValue({
      hash: 'th_mockTxHash123',
      rawTx: 'tx_mockRawTx123',
      blockHeight: 142,
      blockHash: BLOCK_HASH,
      nameSalt: SALT,
    })
    nameRef.current = { preclaim }
  })

  it('should be a function', () => {
    expect(typeof preclaimName).toBe('function')
  })

  it('should throw PreclaimNameNoAccountError without a connected account', async () => {
    const mockConfig = {
      state: { connections: new Map(), current: 'uid1' },
      getNodeClient: vi.fn().mockReturnValue({}),
    }
    await expect(
      preclaimName(mockConfig as any, { name: 'test.chain' }),
    ).rejects.toThrow(PreclaimNameNoAccountError)
  })

  it('should throw when current is undefined', async () => {
    const mockConfig = {
      state: { connections: new Map(), current: undefined },
      getNodeClient: vi.fn().mockReturnValue({}),
    }
    await expect(
      preclaimName(mockConfig as any, { name: 'test.chain' }),
    ).rejects.toThrow(PreclaimNameNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new PreclaimNameNoAccountError()
    expect(error.name).toBe('PreclaimNameNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new PreclaimNameNoAccountError()
    expect(error.message).toContain('without a connected account')
  })

  it('should derive commitmentId from the name and salt, not from the block hash', async () => {
    const result = await preclaimName(connectedConfig() as any, {
      name: 'test.chain',
    })

    expect(result.commitmentId).toBe(commitmentHash('test.chain', SALT))
    expect(result.commitmentId).not.toBe(BLOCK_HASH)
    expect(result.commitmentId.startsWith('cm_')).toBe(true)
  })

  it('should return the salt as a number, ready for claimName', async () => {
    const result = await preclaimName(connectedConfig() as any, {
      name: 'test.chain',
    })

    expect(result.salt).toBe(SALT)
    expect(typeof result.salt).toBe('number')
  })

  it('should return the transaction the sdk mined', async () => {
    const result = await preclaimName(connectedConfig() as any, {
      name: 'test.chain',
    })

    expect(result.txHash).toBe('th_mockTxHash123')
    expect(result.rawTx).toBe('tx_mockRawTx123')
    expect(result.blockHeight).toBe(142)
  })

  it('should default the transaction ttl to 300 and pass an override through', async () => {
    await preclaimName(connectedConfig() as any, { name: 'test.chain' })
    expect(preclaim).toHaveBeenCalledWith({ ttl: 300 })

    await preclaimName(connectedConfig() as any, { name: 'test.chain', ttl: 0 })
    expect(preclaim).toHaveBeenLastCalledWith({ ttl: 0 })
  })

  it('should reject a name that is not an AENS name', async () => {
    await expect(
      preclaimName(connectedConfig() as any, { name: 'not-a-name' }),
    ).rejects.toThrow()
  })
})
