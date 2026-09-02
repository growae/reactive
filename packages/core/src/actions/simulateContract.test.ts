import { describe, expect, it, vi } from 'vitest'
import {
  SimulateContractMapKeyOrderError,
  simulateContract,
} from './simulateContract'

describe('simulateContract', () => {
  it('should be a function', () => {
    expect(typeof simulateContract).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(simulateContract.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw when getNode fails', async () => {
    const mockConfig = {
      getNodeClient: vi.fn(() => {
        throw new Error('No node')
      }),
      state: { current: undefined },
    }

    await expect(
      simulateContract(mockConfig as any, {
        address: 'ct_test',
        aci: {},
        method: 'get',
      }),
    ).rejects.toThrow()
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

describe('simulateContract — the map key order guard', () => {
  it('refuses the simulation before the node is reached', async () => {
    const getNodeClient = vi.fn(() => ({}))
    const config = {
      getNodeClient,
      state: { current: undefined, connections: new Map() },
    }

    const error = await simulateContract(config as any, {
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

    expect(error).toBeInstanceOf(SimulateContractMapKeyOrderError)
    expect(error.name).toBe('SimulateContractMapKeyOrderError')
    expect(error.defects).toEqual([
      {
        path: 'entries',
        keyType: 'string',
        nodeOrder: ['xy', 'ä'],
        encoderOrder: ['ä', 'xy'],
      },
    ])
    // Legibility, not gas: a static call posts nothing either way, so what the
    // guard buys is refusing before the node answers with a decoder error that
    // names no argument.
    expect(getNodeClient).not.toHaveBeenCalled()
  })

  it('names both orders in the message, and claims no gas', async () => {
    const config = {
      getNodeClient: vi.fn(() => ({})),
      state: { current: undefined, connections: new Map() },
    }
    const error = await simulateContract(config as any, {
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
    // A static call is charged nothing, so the message must not say it is.
    expect(error.message).not.toMatch(/gas/i)
  })

  it('lets through a map the encoder gets right', async () => {
    // `{"ä" → 1, "ö" → 2}` encodes correctly today; refusing it would be a
    // regression shipped to fix a defect. It gets past the guard and fails
    // further on, where the node is asked for.
    const getNodeClient = vi.fn(() => {
      throw new Error('No node')
    })
    const config = {
      getNodeClient,
      state: { current: undefined, connections: new Map() },
    }

    const error = await simulateContract(config as any, {
      address: 'ct_test',
      aci: MAP_ORDER_ACI,
      method: 'bulk',
      args: [
        new Map([
          ['ä', 1n],
          ['ö', 2n],
        ]),
      ],
    }).catch((e) => e)

    expect(error).not.toBeInstanceOf(SimulateContractMapKeyOrderError)
    expect(getNodeClient).toHaveBeenCalled()
  })
})
