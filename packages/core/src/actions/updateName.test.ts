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

import { UpdateNameNoAccountError, updateName } from './updateName.js'

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

let update: ReturnType<typeof vi.fn>

describe('updateName', () => {
  beforeEach(() => {
    update = vi.fn().mockResolvedValue({
      hash: 'th_mockTxHash123',
      rawTx: 'tx_mockRawTx123',
      blockHeight: 142,
    })
    nameRef.current = { update }
  })

  it('should be a function', () => {
    expect(typeof updateName).toBe('function')
  })

  it('should throw UpdateNameNoAccountError without a connected account', async () => {
    const mockConfig = {
      state: { connections: new Map(), current: 'uid1' },
      getNodeClient: vi.fn().mockReturnValue({}),
    }
    await expect(
      updateName(mockConfig as any, {
        name: 'test.chain',
        pointers: [{ key: 'account_pubkey', id: ADDRESS }],
      }),
    ).rejects.toThrow(UpdateNameNoAccountError)
  })

  it('should throw when current is undefined', async () => {
    const mockConfig = {
      state: { connections: new Map(), current: undefined },
      getNodeClient: vi.fn().mockReturnValue({}),
    }
    await expect(
      updateName(mockConfig as any, { name: 'test.chain', pointers: [] }),
    ).rejects.toThrow(UpdateNameNoAccountError)
  })

  it('should have correct error name', () => {
    const error = new UpdateNameNoAccountError()
    expect(error.name).toBe('UpdateNameNoAccountError')
  })

  it('should have correct error message', () => {
    const error = new UpdateNameNoAccountError()
    expect(error.message).toContain('without a connected account')
  })

  it('should turn the pointer list into the map the sdk takes', async () => {
    await updateName(connectedConfig() as any, {
      name: 'test.chain',
      pointers: [
        { key: 'account_pubkey', id: ADDRESS },
        { key: 'contract_pubkey', id: 'ct_test' },
      ],
    })

    expect(update.mock.calls[0]![0]).toEqual({
      account_pubkey: ADDRESS,
      contract_pubkey: 'ct_test',
    })
  })

  it('should default the ttls and pass overrides through', async () => {
    await updateName(connectedConfig() as any, {
      name: 'test.chain',
      pointers: [],
    })
    expect(update.mock.calls[0]![1]).toEqual({
      nameTtl: 180000,
      clientTtl: 3600,
      ttl: 300,
    })

    await updateName(connectedConfig() as any, {
      name: 'test.chain',
      pointers: [],
      nameTtl: 1000,
      clientTtl: 60,
      ttl: 0,
    })
    expect(update.mock.calls[1]![1]).toEqual({
      nameTtl: 1000,
      clientTtl: 60,
      ttl: 0,
    })
  })

  it('should only send extendPointers when it was asked for', async () => {
    await updateName(connectedConfig() as any, {
      name: 'test.chain',
      pointers: [],
    })
    expect(update.mock.calls[0]![1]).not.toHaveProperty('extendPointers')

    await updateName(connectedConfig() as any, {
      name: 'test.chain',
      pointers: [],
      extendPointers: true,
    })
    expect(update.mock.calls[1]![1]).toMatchObject({ extendPointers: true })
  })

  it('should return the transaction the sdk mined', async () => {
    const result = await updateName(connectedConfig() as any, {
      name: 'test.chain',
      pointers: [],
    })

    expect(result.txHash).toBe('th_mockTxHash123')
    expect(result.rawTx).toBe('tx_mockRawTx123')
    expect(result.blockHeight).toBe(142)
  })

  it('should reject a name that is not an AENS name', async () => {
    await expect(
      updateName(connectedConfig() as any, {
        name: 'not-a-name',
        pointers: [],
      }),
    ).rejects.toThrow()
  })
})
