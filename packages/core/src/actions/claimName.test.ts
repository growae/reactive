import { beforeEach, describe, expect, it, vi } from 'vitest'

const { nameRef } = vi.hoisted(() => ({
  nameRef: { current: undefined as unknown },
}))

// `Name` is stubbed so the options mapping can be read without a node; the
// connector-signing evidence for this action is in `aens/aensSigning.test.ts`,
// where the sdk builds and signs a real transaction.
vi.mock('@aeternity/aepp-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aeternity/aepp-sdk')>()
  return {
    ...actual,
    Name: vi.fn().mockImplementation(() => nameRef.current),
  }
})

import { produceNameId } from '@aeternity/aepp-sdk'
import { ClaimNameNoAccountError, claimName } from './claimName.js'

const ADDRESS = 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU'

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

let claim: ReturnType<typeof vi.fn>

describe('claimName', () => {
  beforeEach(() => {
    claim = vi.fn().mockResolvedValue({
      hash: 'th_mockTxHash123',
      rawTx: 'tx_mockRawTx123',
      blockHeight: 142,
    })
    nameRef.current = { claim }
  })

  it('should be a function', () => {
    expect(typeof claimName).toBe('function')
  })

  it('should throw ClaimNameNoAccountError without a connected account', async () => {
    const mockConfig = {
      state: { connections: new Map(), current: 'uid1' },
      getNodeClient: vi.fn().mockReturnValue({}),
    }
    await expect(
      claimName(mockConfig as any, { name: 'test.chain', salt: 12345 }),
    ).rejects.toThrow(ClaimNameNoAccountError)
  })

  it('should throw when current is undefined', async () => {
    const mockConfig = {
      state: { connections: new Map(), current: undefined },
      getNodeClient: vi.fn().mockReturnValue({}),
    }
    await expect(
      claimName(mockConfig as any, { name: 'test.chain' }),
    ).rejects.toThrow(ClaimNameNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new ClaimNameNoAccountError()
    expect(error.name).toBe('ClaimNameNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new ClaimNameNoAccountError()
    expect(error.message).toContain('without a connected account')
  })

  it('should pass the salt through as the transaction nameSalt', async () => {
    await claimName(connectedConfig() as any, {
      name: 'test.chain',
      salt: 12345,
    })

    expect(claim).toHaveBeenCalledWith({ nameSalt: 12345, ttl: 300 })
  })

  it('should omit nameSalt when no salt is given, leaving the protocol default', async () => {
    await claimName(connectedConfig() as any, { name: 'test.chain' })

    expect(claim).toHaveBeenCalledWith({ ttl: 300 })
  })

  it('should pass nameFee as a string, from a bigint or a string', async () => {
    await claimName(connectedConfig() as any, {
      name: 'test.chain',
      nameFee: 500000000000000000000n,
    })
    expect(claim).toHaveBeenLastCalledWith({
      nameFee: '500000000000000000000',
      ttl: 300,
    })

    await claimName(connectedConfig() as any, {
      name: 'test.chain',
      nameFee: '123',
    })
    expect(claim).toHaveBeenLastCalledWith({ nameFee: '123', ttl: 300 })
  })

  it('should return the transaction the sdk mined, with the name id', async () => {
    const result = await claimName(connectedConfig() as any, {
      name: 'test.chain',
    })

    expect(result.txHash).toBe('th_mockTxHash123')
    expect(result.rawTx).toBe('tx_mockRawTx123')
    expect(result.blockHeight).toBe(142)
    expect(result.nameId).toBe(produceNameId('test.chain'))
  })

  it('should reject a name that is not an AENS name', async () => {
    await expect(
      claimName(connectedConfig() as any, { name: 'not-a-name' }),
    ).rejects.toThrow()
  })
})
