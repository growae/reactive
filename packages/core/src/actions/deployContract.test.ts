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
  DeployContractInvocationError,
  DeployContractMapKeyOrderError,
  DeployContractNoAccountError,
  DeployContractNoCodeError,
  deployContract,
} from './deployContract'

describe('deployContract', () => {
  it('should be a function', () => {
    expect(typeof deployContract).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(deployContract.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw DeployContractNoCodeError without sourceCode or bytecode', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => ({})),
      state: { current: { account: 'ak_test' } },
    }

    await expect(deployContract(mockConfig as any, {})).rejects.toThrow(
      DeployContractNoCodeError,
    )
  })

  it('should throw DeployContractNoAccountError without connected account', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => ({})),
      state: { current: undefined, connections: new Map() },
    }

    await expect(
      deployContract(mockConfig as any, { sourceCode: 'contract Test = ...' }),
    ).rejects.toThrow(DeployContractNoAccountError)
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
      deployContract(mockConfig as any, { bytecode: 'cb_test' }),
    ).rejects.toThrow()

    expect(mockConnector.getProvider).toHaveBeenCalledOnce()
  })

  it('should have DEFAULT_TTL of 300 for transaction expiry', () => {
    expect(DEFAULT_TTL).toBe(300)
  })
})

/**
 * `test/integration/MapOrderInit.aes`, as the Sophia 8 compiler emits it.
 *
 * `init` is an ordinary entry in `contract.functions` with its own `arguments`
 * — the constructor is not a separate shape in the ACI — which is the whole
 * reason the guard reaches it unchanged. `wrapped` holds the same map behind a
 * variant, the shape the guard deliberately stops descending into.
 */
const MAP_INIT_ACI = [
  {
    contract: {
      name: 'MapOrderInit',
      kind: 'contract_main',
      payable: false,
      state: { record: [{ name: 'size', type: 'int' }] },
      typedefs: [
        {
          name: 'wrapper',
          typedef: { variant: [{ Wrapped: [{ map: ['string', 'int'] }] }] },
          vars: [],
        },
      ],
      functions: [
        {
          name: 'init',
          arguments: [
            { name: 'entries', type: { map: ['string', 'int'] } },
            { name: 'wrapped', type: 'MapOrderInit.wrapper' },
          ],
          returns: 'MapOrderInit.state',
          stateful: false,
          payable: false,
        },
        {
          name: 'size',
          arguments: [],
          returns: 'int',
          stateful: false,
          payable: false,
        },
      ],
    },
  },
]

/** `{"ä" → 1, "xy" → 2}` — the two orders disagree about these two keys. */
const TRIGGER = () =>
  new Map([
    ['ä', 1n],
    ['xy', 2n],
  ])

/** `{"ä" → 1, "ö" → 2}` — non-ASCII, and the two orders agree. */
const CONTROL = () =>
  new Map([
    ['ä', 1n],
    ['ö', 2n],
  ])

describe('deployContract — the map key order guard', () => {
  const connected = () => ({
    getNodeClient: vi.fn(() => ({})),
    state: {
      current: 'uid1',
      connections: new Map([
        [
          'uid1',
          {
            activeAccount: 'ak_test',
            connector: {
              getProvider: vi.fn(async () => ({ address: 'ak_test' })),
            },
            networkId: 'ae_devnet',
          },
        ],
      ]),
    },
  })

  it('refuses the deployment before the node is reached', async () => {
    const config = connected()

    const error = await deployContract(config as any, {
      bytecode: 'cb_test',
      aci: MAP_INIT_ACI,
      initArgs: [TRIGGER(), { Wrapped: [CONTROL()] }],
      options: { gasLimit: 200_000 },
    }).catch((e) => e)

    expect(error).toBeInstanceOf(DeployContractMapKeyOrderError)
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
    expect(config.getNodeClient).not.toHaveBeenCalled()
  })

  it('names both orders in the message', async () => {
    const error = await deployContract(connected() as any, {
      bytecode: 'cb_test',
      aci: MAP_INIT_ACI,
      initArgs: [TRIGGER(), { Wrapped: [CONTROL()] }],
    }).catch((e) => e)

    expect(error.message).toContain('map(string, _)')
    expect(error.message).toContain('the node accepts    "xy", "ä"')
    expect(error.message).toContain('the encoder writes  "ä", "xy"')
    expect(error.message).toContain('never includes')
  })

  it('lets through init arguments the encoder gets right', async () => {
    // Refusing `{"ä" → 1, "ö" → 2}` would be a regression shipped to fix a
    // defect: both keys are two bytes, so the two orders coincide.
    const config = {
      getNodeClient: vi.fn(() => ({})),
      state: { current: undefined, connections: new Map() },
    }

    await expect(
      deployContract(config as any, {
        bytecode: 'cb_test',
        aci: MAP_INIT_ACI,
        initArgs: [CONTROL(), { Wrapped: [CONTROL()] }],
      }),
    ).rejects.toBeInstanceOf(DeployContractNoAccountError)
  })

  it('is a miss for a map behind a variant, as the call guard is', async () => {
    // A variant's JavaScript shape is not fixed by the ACI, so the walk stops
    // there rather than risk reading a caller's object as something it is not.
    // The deployment goes out; `mapKeyOrderDeploy.integration.test.ts` measures
    // what the node then does with it.
    const config = {
      getNodeClient: vi.fn(() => ({})),
      state: { current: undefined, connections: new Map() },
    }

    await expect(
      deployContract(config as any, {
        bytecode: 'cb_test',
        aci: MAP_INIT_ACI,
        initArgs: [CONTROL(), { Wrapped: [TRIGGER()] }],
      }),
    ).rejects.toBeInstanceOf(DeployContractNoAccountError)
  })

  it('is a miss for a source-only deployment, which carries no ACI', async () => {
    // The sdk compiles one on the way past; there is nothing here to read the
    // init argument types off, and guessing at them would be worse than a miss.
    const config = {
      getNodeClient: vi.fn(() => ({})),
      state: { current: undefined, connections: new Map() },
    }

    await expect(
      deployContract(config as any, {
        sourceCode: 'contract MapOrderInit = ...',
        initArgs: [TRIGGER()],
      }),
    ).rejects.toBeInstanceOf(DeployContractNoAccountError)
  })
})

describe('deployContract — the invocation error wrap', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const transaction = encode(new Uint8Array([1, 2, 3]), Encoding.Transaction)
  const signed = encode(new Uint8Array([4, 5, 6]), Encoding.Transaction)

  function configWith(account: object) {
    return {
      getNodeClient: vi.fn(() => ({})),
      state: {
        current: 'uid1',
        connections: new Map([
          [
            'uid1',
            {
              activeAccount: 'ak_owner',
              connector: { getProvider: vi.fn(async () => account) },
              networkId: 'ae_devnet',
            },
          ],
        ]),
      },
    }
  }

  it('carries the reason and the hash when the sdk knows the transaction', async () => {
    // `$deploy` estimates gas through a dry run when no `gasLimit` is given,
    // and that path throws with the unsigned transaction attached.
    vi.spyOn(Contract, 'initialize').mockResolvedValue({
      $deploy: vi
        .fn()
        .mockRejectedValue(
          new NodeInvocationError('bad_call_data', transaction),
        ),
    } as any)

    const error = await deployContract(
      configWith({ address: 'ak_owner' }) as any,
      { bytecode: 'cb_test', aci: MAP_INIT_ACI },
    ).catch((e) => e)

    expect(error).toBeInstanceOf(DeployContractInvocationError)
    expect(error.reason).toBe('bad_call_data')
    expect(error.transaction).toBe(transaction)
    expect(error.transactionHash).toBe(buildTxHash(transaction))
    expect(error.message).toContain('Reason: bad_call_data')
    expect(error.cause).toBeInstanceOf(NodeInvocationError)
  })

  it('recovers the hash from the signed transaction on the on-chain path', async () => {
    // With a `gasLimit` the sdk skips the estimate and posts the create
    // transaction outright, then reads the result back by hash inside itself
    // and throws with neither the reason nor the hash. Without the hash there
    // is no handle on a deployment that has already been charged for.
    const account = {
      address: 'ak_owner',
      signTransaction: vi.fn(async () => signed),
    }
    let seenAddress: string | undefined
    vi.spyOn(Contract, 'initialize').mockImplementation((async ({
      onAccount,
    }: any) => {
      seenAddress = onAccount.address
      return {
        $deploy: async () => {
          await onAccount.signTransaction('tx_unsigned', {})
          throw new NodeInvocationError('', undefined)
        },
      }
    }) as any)

    const error = await deployContract(configWith(account) as any, {
      bytecode: 'cb_test',
      aci: MAP_INIT_ACI,
      options: { gasLimit: 200_000 },
    }).catch((e) => e)

    // Reads go to the real account, so a connector holding private state is
    // unaffected by the observation.
    expect(seenAddress).toBe('ak_owner')
    expect(account.signTransaction).toHaveBeenCalledOnce()
    expect(error).toBeInstanceOf(DeployContractInvocationError)
    expect(error.transactionHash).toBe(buildTxHash(signed))
    expect(error.reason).toBeUndefined()
    expect(error.message).toContain('The node reported no reason.')
  })

  it('leaves every other error alone', async () => {
    const other = new Error('node unreachable')
    vi.spyOn(Contract, 'initialize').mockResolvedValue({
      $deploy: vi.fn().mockRejectedValue(other),
    } as any)

    await expect(
      deployContract(configWith({ address: 'ak_owner' }) as any, {
        bytecode: 'cb_test',
      }),
    ).rejects.toBe(other)
  })
})
