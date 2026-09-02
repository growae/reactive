import { describe, expect, it } from 'vitest'
import { findMapKeyOrderDefects } from './mapArgumentGuard'

/**
 * The ACI of `test/integration/MapOrder.aes`, the contract the on-node half of
 * this defect was measured against.
 */
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
          name: 'init',
          arguments: [],
          returns: 'MapOrder.state',
          stateful: false,
          payable: false,
        },
        {
          name: 'bulk',
          arguments: [{ name: 'entries', type: { map: ['string', 'int'] } }],
          returns: 'int',
          stateful: true,
          payable: false,
        },
        {
          name: 'bulk_bits',
          arguments: [{ name: 'entries', type: { map: ['bits', 'int'] } }],
          returns: 'int',
          stateful: true,
          payable: false,
        },
        {
          name: 'bulk_int',
          arguments: [{ name: 'entries', type: { map: ['int', 'int'] } }],
          returns: 'int',
          stateful: true,
          payable: false,
        },
      ],
    },
  },
]

describe('findMapKeyOrderDefects', () => {
  it('refuses the string-key argument the node rejects', () => {
    const defects = findMapKeyOrderDefects(MAP_ORDER_ACI, 'bulk', [
      new Map([
        ['ä', 1n],
        ['xy', 2n],
      ]),
    ])
    expect(defects).toEqual([
      {
        path: 'entries',
        keyType: 'string',
        nodeOrder: ['xy', 'ä'],
        encoderOrder: ['ä', 'xy'],
      },
    ])
  })

  it('does not care which order the caller inserted them in', () => {
    // The encoder sorts, so insertion order is not a lever for the caller and
    // must not be one for the guard either.
    const defects = findMapKeyOrderDefects(MAP_ORDER_ACI, 'bulk', [
      new Map([
        ['xy', 2n],
        ['ä', 1n],
      ]),
    ])
    expect(defects).toHaveLength(1)
  })

  it('accepts the controls that are fine today', () => {
    expect(
      findMapKeyOrderDefects(MAP_ORDER_ACI, 'bulk', [
        new Map([
          ['ab', 1n],
          ['xy', 2n],
        ]),
      ]),
    ).toEqual([])
    expect(
      findMapKeyOrderDefects(MAP_ORDER_ACI, 'bulk', [
        new Map([
          ['ä', 1n],
          ['ö', 2n],
        ]),
      ]),
    ).toEqual([])
    expect(
      findMapKeyOrderDefects(MAP_ORDER_ACI, 'bulk_bits', [
        new Map([
          [0n, 1n],
          [1n, 2n],
        ]),
      ]),
    ).toEqual([])
  })

  it('refuses two negative bits keys', () => {
    const defects = findMapKeyOrderDefects(MAP_ORDER_ACI, 'bulk_bits', [
      new Map([
        [-1n, 1n],
        [-2n, 2n],
      ]),
    ])
    expect(defects).toEqual([
      {
        path: 'entries',
        keyType: 'bits',
        nodeOrder: [-2n, -1n],
        encoderOrder: [-1n, -2n],
      },
    ])
  })

  it('leaves int keys alone — both implementations order them the same', () => {
    // The reason the key type has to come from the ACI at all: an `int` key and
    // a `bits` key are the same JavaScript value, and refusing negative `int`
    // keys would refuse calls the node accepts.
    expect(
      findMapKeyOrderDefects(MAP_ORDER_ACI, 'bulk_int', [
        new Map([
          [-1n, 1n],
          [-2n, 2n],
        ]),
      ]),
    ).toEqual([])
  })

  it('reads the array-of-pairs form the encoder equally accepts', () => {
    expect(
      findMapKeyOrderDefects(MAP_ORDER_ACI, 'bulk', [
        [
          ['ä', 1n],
          ['xy', 2n],
        ],
      ]),
    ).toHaveLength(1)
  })

  it('accepts number-shaped bits keys', () => {
    expect(
      findMapKeyOrderDefects(MAP_ORDER_ACI, 'bulk_bits', [
        new Map([
          [-1, 1n],
          [-2, 2n],
        ]),
      ]),
    ).toHaveLength(1)
  })
})

/**
 * A second contract whose maps are reached through the compound types a caller
 * actually writes, plus a typedef alias, plus a `Set.set` — which the reference
 * serialises through the same map serialiser and sorts with the same
 * comparator.
 */
const NESTED_ACI = [
  {
    contract: {
      name: 'Nested',
      kind: 'contract_main',
      payable: false,
      typedefs: [
        { name: 'labels', vars: [], typedef: { map: ['string', 'int'] } },
        {
          name: 'row',
          vars: [],
          typedef: {
            record: [
              { name: 'id', type: 'int' },
              { name: 'tags', type: { map: ['string', 'int'] } },
            ],
          },
        },
        {
          name: 'boxed',
          vars: [{ name: "'a" }],
          typedef: { map: ['string', "'a"] },
        },
      ],
      functions: [
        {
          name: 'alias',
          arguments: [{ name: 'labels', type: 'Nested.labels' }],
          returns: 'int',
          stateful: true,
          payable: false,
        },
        {
          name: 'rows',
          arguments: [{ name: 'rows', type: { list: ['Nested.row'] } }],
          returns: 'int',
          stateful: true,
          payable: false,
        },
        {
          name: 'optional',
          arguments: [
            { name: 'maybe', type: { option: [{ map: ['string', 'int'] }] } },
          ],
          returns: 'int',
          stateful: true,
          payable: false,
        },
        {
          name: 'pair',
          arguments: [
            {
              name: 'both',
              type: { tuple: ['int', { map: ['bits', 'int'] }] },
            },
          ],
          returns: 'int',
          stateful: true,
          payable: false,
        },
        {
          name: 'names',
          arguments: [{ name: 'names', type: { 'Set.set': ['string'] } }],
          returns: 'int',
          stateful: true,
          payable: false,
        },
        {
          name: 'generic',
          arguments: [{ name: 'boxed', type: { 'Nested.boxed': ['int'] } }],
          returns: 'int',
          stateful: true,
          payable: false,
        },
        {
          name: 'choice',
          arguments: [
            {
              name: 'either',
              type: {
                variant: [
                  { Left: ['int'] },
                  { Right: [{ map: ['string', 'int'] }] },
                ],
              },
            },
          ],
          returns: 'int',
          stateful: true,
          payable: false,
        },
      ],
    },
  },
]

const BAD = () =>
  new Map([
    ['ä', 1n],
    ['xy', 2n],
  ])

describe('findMapKeyOrderDefects — through the compound types', () => {
  it('resolves a typedef alias', () => {
    expect(findMapKeyOrderDefects(NESTED_ACI, 'alias', [BAD()])).toEqual([
      expect.objectContaining({ path: 'labels', keyType: 'string' }),
    ])
  })

  it('descends into a list of records and names where it found it', () => {
    const defects = findMapKeyOrderDefects(NESTED_ACI, 'rows', [
      [
        { id: 1n, tags: new Map([['ab', 1n]]) },
        { id: 2n, tags: BAD() },
      ],
    ])
    expect(defects).toEqual([
      expect.objectContaining({ path: 'rows[1].tags', keyType: 'string' }),
    ])
  })

  it('descends into an option, and skips it when absent', () => {
    expect(findMapKeyOrderDefects(NESTED_ACI, 'optional', [BAD()])).toEqual([
      expect.objectContaining({ path: 'maybe' }),
    ])
    expect(findMapKeyOrderDefects(NESTED_ACI, 'optional', [undefined])).toEqual(
      [],
    )
  })

  it('descends into a tuple', () => {
    const defects = findMapKeyOrderDefects(NESTED_ACI, 'pair', [
      [
        1n,
        new Map([
          [-1n, 1n],
          [-2n, 2n],
        ]),
      ],
    ])
    expect(defects).toEqual([
      expect.objectContaining({ path: 'both.1', keyType: 'bits' }),
    ])
  })

  it('covers Set.set, which is a map on the wire', () => {
    expect(
      findMapKeyOrderDefects(NESTED_ACI, 'names', [new Set(['ä', 'xy'])]),
    ).toEqual([expect.objectContaining({ path: 'names', keyType: 'string' })])
    expect(
      findMapKeyOrderDefects(NESTED_ACI, 'names', [new Set(['ab', 'xy'])]),
    ).toEqual([])
  })

  it('binds a typedef type variable', () => {
    expect(findMapKeyOrderDefects(NESTED_ACI, 'generic', [BAD()])).toEqual([
      expect.objectContaining({ path: 'boxed', keyType: 'string' }),
    ])
  })

  it('does not descend into a variant', () => {
    // A miss, and deliberately so: the JavaScript shape a caller passes for a
    // variant is not fixed by the ACI, and reading one wrong would refuse a
    // call the node accepts.
    expect(
      findMapKeyOrderDefects(NESTED_ACI, 'choice', [{ Right: [BAD()] }]),
    ).toEqual([])
  })
})

describe('findMapKeyOrderDefects — everything it cannot read is a miss', () => {
  const cases: [string, unknown, string, unknown[]][] = [
    ['an ACI that is not an array', {}, 'bulk', [BAD()]],
    ['an empty ACI', [], 'bulk', [BAD()]],
    ['a last entry with no contract', [{ namespace: {} }], 'bulk', [BAD()]],
    ['a method the contract does not declare', MAP_ORDER_ACI, 'nope', [BAD()]],
    ['an argument that is not a map at all', MAP_ORDER_ACI, 'bulk', ['ä']],
    [
      'keys that are not the shape the ACI says',
      MAP_ORDER_ACI,
      'bulk',
      [
        new Map([
          [1n, 1n],
          [2n, 2n],
        ]),
      ],
    ],
    ['fewer arguments than the ACI declares', MAP_ORDER_ACI, 'bulk', []],
  ]

  it.each(cases)('%s', (_label, aci, method, args) => {
    expect(findMapKeyOrderDefects(aci, method, args)).toEqual([])
  })

  it('survives a cyclic argument', () => {
    const cyclic = new Map<string, unknown>([['ab', 1n]])
    cyclic.set('self', cyclic)
    expect(() =>
      findMapKeyOrderDefects(MAP_ORDER_ACI, 'bulk', [cyclic]),
    ).not.toThrow()
  })
})
