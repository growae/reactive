import { MemoryAccount } from '@aeternity/aepp-sdk'
import { describe, expect, it } from 'vitest'
import { memory } from '../connectors/memory.js'
import { createConfig } from '../createConfig.js'
import { loadProtocol } from '../exports/protocol.js'
import { testnet } from '../types/network.js'
import { contractCalldata, decodeContractValue } from './calldata.js'
import { connect } from './connect.js'
import { signTypedData, verifyTypedData } from './typedData.js'

describe('Rust contract wire operations', () => {
  it('encodes FATE integer and nested values, and rejects unsafe integer inputs', async () => {
    const { fate, encoding } = await loadProtocol()
    const one = fate.encodeValue({ tag: 'integer', val: '1' })
    expect([...one]).toEqual([2])
    expect(await contractCalldata({ function: 'echo', args: [1n] })).toBe(
      fate.encodeCalldata('echo', [one]),
    )
    const nested = fate.encodeValue({ tag: 'tuple-values', val: [one] })
    await expect(
      decodeContractValue(encoding.encode(nested, 'cb')),
    ).resolves.toEqual({ tuple: [1n] })
    await expect(
      contractCalldata({ function: 'echo', args: [2 ** 54] }),
    ).rejects.toThrow(/bigint/)
  })

  it('matches an independent AE typed-data signer, preserves canonical ACI ordering, and binds network', async () => {
    const { keys, encoding, fate } = await loadProtocol()
    const [secretKey, address] = keys.fromSeed(new Uint8Array(32).fill(7))
    const data = encoding.encode(
      fate.encodeValue({ tag: 'integer', val: '7' }),
      'cb',
    )
    const config = createConfig({
      networks: [testnet],
      storage: null,
      connectors: [memory({ accounts: [{ secretKey }] })],
    })
    await connect(config, { connector: config.connectors[0]! })
    const domain = { name: 'Example', version: 2, networkId: testnet.id }
    const aci = { record: [{ name: 'n', type: 'int' }] } as const
    const signature = await signTypedData(config, { data, aci, domain })
    const reference = await new MemoryAccount(
      secretKey as `sk_${string}`,
    ).signTypedData(data as `cb_${string}`, aci, domain)
    expect(signature).toBe(reference)
    await expect(
      verifyTypedData(config, {
        data,
        aci: { record: [{ type: 'int', name: 'n' }] },
        address,
        signature,
        domain,
      }),
    ).resolves.toBe(true)
    await expect(
      verifyTypedData(config, {
        data,
        aci,
        address,
        signature,
        domain: { ...domain, networkId: 'ae_mainnet' },
      }),
    ).resolves.toBe(false)
  })
})
