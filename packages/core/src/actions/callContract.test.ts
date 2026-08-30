import {
  buildTxHash,
  Contract,
  Encoding,
  encode,
  NodeInvocationError,
} from '@aeternity/aepp-sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_TTL } from '../constants'
import {
  CallContractInvocationError,
  CallContractMapKeyOrderError,
  CallContractNoAccountError,
  callContract,
} from './callContract'

describe('callContract', () => {
  it('should be a function', () => {
    expect(typeof callContract).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(callContract.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw CallContractNoAccountError when no account and not static', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => ({})),
      state: { current: undefined, connections: new Map() },
    }

    await expect(
      callContract(mockConfig as any, {
        address: 'ct_test',
        aci: {},
        method: 'greet',
      }),
    ).rejects.toThrow(CallContractNoAccountError)
  })

  it('should throw when getNode fails', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { current: undefined, connections: new Map() },
    }

    await expect(
      callContract(mockConfig as any, {
        address: 'ct_test',
        aci: {},
        method: 'greet',
      }),
    ).rejects.toThrow()
  })

  it('should call connector.getProvider() for signing account, not use string address', async () => {
    const mockSigningAccount = { address: 'ak_test', sign: vi.fn() }
    const mockConnector = {
      getProvider: vi.fn().mockResolvedValue(mockSigningAccount),
    }
    const mockConnections = new Map([
      [
        'uid1',
        {
          activeAccount: 'ak_test',
          connector: mockConnector,
          networkId: 'ae_uat',
        },
      ],
    ])
    const mockConfig = {
      getNodeClient: vi.fn(() => ({})),
      state: { current: 'uid1', connections: mockConnections },
    }

    // Contract.initialize will fail with mock node but getProvider must be called first
    await expect(
      callContract(mockConfig as any, {
        address: 'ct_test',
        aci: {},
        method: 'greet',
      }),
    ).rejects.toThrow()

    expect(mockConnector.getProvider).toHaveBeenCalledOnce()
  })

  it('should have DEFAULT_TTL of 300 for transaction expiry', () => {
    expect(DEFAULT_TTL).toBe(300)
  })
})

/** `test/integration/MapOrder.aes`, the contract this defect was measured on. */
const MAP_ORDER_ACI = [
  {
    contract: {
      name: 'MapOrder',
      kind: 'contract_main',
      payable: false,
      typedefs: [],
      state: { record: [{ name: 'count', type: 'int' }] },
      functions: [
        {
          name: 'bulk',
          arguments: [{ name: 'entries', type: { map: ['string', 'int'] } }],
          returns: 'int',
          stateful: true,
          payable: false,
        },
      ],
    },
  },
]

describe('callContract — the map key order guard', () => {
  it('refuses the call before the node is reached', async () => {
    const getNodeClient = vi.fn(() => ({}))
    const config = {
      getNodeClient,
      state: { current: undefined, connections: new Map() },
    }

    const error = await callContract(config as any, {
      address: 'ct_test',
      aci: MAP_ORDER_ACI,
      method: 'bulk',
      args: [
        new Map([
          ['ä', 1n],
          ['xy', 2n],
        ]),
      ],
    }).catch((e) => e)

    expect(error).toBeInstanceOf(CallContractMapKeyOrderError)
    expect(error.defects).toEqual([
      {
        path: 'entries',
        keyType: 'string',
        nodeOrder: ['xy', 'ä'],
        encoderOrder: ['ä', 'xy'],
      },
    ])
    // The point of the guard: nothing is built, nothing is posted, no gas is
    // charged — so it must refuse before it asks for a node or an account.
    expect(getNodeClient).not.toHaveBeenCalled()
  })

  it('names both orders in the message', async () => {
    const config = {
      getNodeClient: vi.fn(() => ({})),
      state: { current: undefined, connections: new Map() },
    }
    const error = await callContract(config as any, {
      address: 'ct_test',
      aci: MAP_ORDER_ACI,
      method: 'bulk',
      args: [
        new Map([
          ['ä', 1n],
          ['xy', 2n],
        ]),
      ],
    }).catch((e) => e)

    expect(error.message).toContain('map(string, _)')
    expect(error.message).toContain('the node accepts    "xy", "ä"')
    expect(error.message).toContain('the encoder writes  "ä", "xy"')
  })

  it('lets through a map the encoder gets right', async () => {
    const config = {
      getNodeClient: vi.fn(() => ({})),
      state: { current: undefined, connections: new Map() },
    }
    // `{"ä" → 1, "ö" → 2}` encodes correctly today; refusing it would be a
    // regression shipped to fix a defect. It gets past the guard and fails
    // further on, for want of an account.
    await expect(
      callContract(config as any, {
        address: 'ct_test',
        aci: MAP_ORDER_ACI,
        method: 'bulk',
        args: [
          new Map([
            ['ä', 1n],
            ['ö', 2n],
          ]),
        ],
      }),
    ).rejects.toBeInstanceOf(CallContractNoAccountError)
  })
})

describe('callContract — the invocation error wrap', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const transaction = encode(new Uint8Array([1, 2, 3]), Encoding.Transaction)
  const signed = encode(new Uint8Array([4, 5, 6]), Encoding.Transaction)

  /**
   * The message format the reason is read out of. `NodeInvocationError` stores
   * the node's reason nowhere else, so this pins the assumption to the sdk
   * rather than to a comment.
   */
  it('the sdk reports the node reason only in its message', () => {
    expect(new NodeInvocationError('bad_call_data', undefined).message).toBe(
      'Invocation failed: "bad_call_data"',
    )
    expect(new NodeInvocationError('', undefined).message).toBe(
      'Invocation failed: ""',
    )
    expect(
      new NodeInvocationError(undefined as unknown as string, undefined)
        .transaction,
    ).toBeUndefined()
  })

  it('carries the reason and the hash on the static path', async () => {
    vi.spyOn(Contract, 'initialize').mockResolvedValue({
      $call: vi
        .fn()
        .mockRejectedValue(
          new NodeInvocationError('bad_call_data', transaction),
        ),
    } as any)

    const error = await callContract(
      {
        getNodeClient: vi.fn(() => ({})),
        state: { current: undefined, connections: new Map() },
      } as any,
      {
        address: 'ct_test',
        aci: {},
        method: 'bulk',
        options: { callStatic: true },
      },
    ).catch((e) => e)

    expect(error).toBeInstanceOf(CallContractInvocationError)
    expect(error.reason).toBe('bad_call_data')
    expect(error.transaction).toBe(transaction)
    expect(error.transactionHash).toBe(buildTxHash(transaction))
    expect(error.message).toContain('Reason: bad_call_data')
    expect(error.cause).toBeInstanceOf(NodeInvocationError)
  })

  it('recovers the hash from the signed transaction on the on-chain path', async () => {
    // The sdk populates `NodeInvocationError.transaction` only on the static
    // path — on chain it reads the call result back by hash inside itself and
    // throws without either. The signed transaction is observed on the way past
    // instead, and its hash is the one the call was mined under.
    const account = {
      address: 'ak_caller',
      signTransaction: vi.fn(async () => signed),
    }
    let seenAddress: string | undefined
    vi.spyOn(Contract, 'initialize').mockImplementation((async ({
      onAccount,
    }: any) => {
      seenAddress = onAccount.address
      return {
        $call: async () => {
          await onAccount.signTransaction('tx_unsigned', {})
          throw new NodeInvocationError('', undefined)
        },
      }
    }) as any)

    const connections = new Map([
      [
        'uid1',
        {
          activeAccount: 'ak_caller',
          connector: { getProvider: vi.fn(async () => account) },
          networkId: 'ae_devnet',
        },
      ],
    ])

    const error = await callContract(
      {
        getNodeClient: vi.fn(() => ({})),
        state: { current: 'uid1', connections },
      } as any,
      { address: 'ct_test', aci: {}, method: 'bulk' },
    ).catch((e) => e)

    // Reads go to the real account, so a connector holding private state is
    // unaffected by the observation.
    expect(seenAddress).toBe('ak_caller')
    expect(account.signTransaction).toHaveBeenCalledOnce()
    expect(error).toBeInstanceOf(CallContractInvocationError)
    expect(error.transactionHash).toBe(buildTxHash(signed))
    expect(error.reason).toBeUndefined()
    expect(error.message).toContain('The node reported no reason.')
  })

  it('leaves every other error alone', async () => {
    const other = new Error('node unreachable')
    vi.spyOn(Contract, 'initialize').mockResolvedValue({
      $call: vi.fn().mockRejectedValue(other),
    } as any)

    await expect(
      callContract(
        {
          getNodeClient: vi.fn(() => ({})),
          state: { current: undefined, connections: new Map() },
        } as any,
        {
          address: 'ct_test',
          aci: {},
          method: 'bulk',
          options: { callStatic: true },
        },
      ),
    ).rejects.toBe(other)
  })
})
