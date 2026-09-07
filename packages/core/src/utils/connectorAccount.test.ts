import {
  AccountBase,
  type Encoded,
  Encoding,
  encode,
} from '@aeternity/aepp-sdk'
import { describe, expect, it, vi } from 'vitest'
import type { Connection, Connector } from '../createConfig.js'
import {
  ConnectorAccount,
  ConnectorAccountAddressError,
  ConnectorSignatureError,
  ConnectorSigningUnsupportedError,
  connectorAccount,
} from './connectorAccount.js'

const ADDRESS = 'ak_2K7ngGLmhQza45Dtw8352T8kTDrHBEWf9KFqc5pNtJ6G2DQ7uS'
const OTHER_ADDRESS = 'ak_nQpnNuBPQwibGpSJmjAah6r3ctVA7oncdiEqzFhTFCbCQfmWM'
const NETWORK_ID = 'ae_uat'
const UNSIGNED = encode(new Uint8Array([1, 2, 3]), Encoding.Transaction)
const SIGNED = encode(new Uint8Array([4, 5, 6]), Encoding.Transaction)
const SIGNATURE = encode(new Uint8Array(64).fill(7), Encoding.Signature)

function createConnector(overrides: Partial<Connector> = {}) {
  return {
    id: 'test',
    name: 'Test Connector',
    type: 'test',
    signTransaction: vi.fn().mockResolvedValue(SIGNED),
    signMessage: vi.fn().mockResolvedValue('0a0b0c'),
    ...overrides,
  } as unknown as Connector
}

function createAccount(connector: Connector = createConnector()) {
  return new ConnectorAccount({
    address: ADDRESS,
    connector,
    networkId: NETWORK_ID,
  })
}

describe('ConnectorAccount', () => {
  it('is the AccountBase the sdk asks for', () => {
    const account = createAccount()
    expect(account).toBeInstanceOf(AccountBase)
    expect(account.address).toBe(ADDRESS)
  })

  it('refuses an address that is not an account address', () => {
    expect(
      () =>
        new ConnectorAccount({
          address: 'not-an-address',
          connector: createConnector(),
          networkId: NETWORK_ID,
        }),
    ).toThrow(ConnectorAccountAddressError)
  })

  it('signs a transaction through the connector', async () => {
    const connector = createConnector()
    const account = createAccount(connector)

    const signed = await account.signTransaction(UNSIGNED, {
      networkId: 'ae_mainnet',
      innerTx: true,
    })

    expect(signed).toBe(SIGNED)
    expect(connector.signTransaction).toHaveBeenCalledWith({
      tx: UNSIGNED,
      networkId: 'ae_mainnet',
      innerTx: true,
      onAccount: ADDRESS,
    })
  })

  it('signs against the connection network id when the caller names none', async () => {
    const connector = createConnector()

    await createAccount(connector).signTransaction(UNSIGNED, {})

    expect(connector.signTransaction).toHaveBeenCalledWith({
      tx: UNSIGNED,
      networkId: NETWORK_ID,
      onAccount: ADDRESS,
    })
  })

  it('pins the account it was built for, as signMessage already does', async () => {
    // The adapter carries an address and, before `onAccount` existed on
    // `signTransaction`, could not honour it on the one method that moves
    // funds: the sdk built the transaction against `this.address` while the
    // connector signed with an account of its own choosing.
    const connector = createConnector()
    const account = new ConnectorAccount({
      address: OTHER_ADDRESS,
      connector,
      networkId: NETWORK_ID,
    })

    await account.signTransaction(UNSIGNED, {})

    expect(connector.signTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ onAccount: OTHER_ADDRESS }),
    )
  })

  it('reports a connector that cannot sign transactions', async () => {
    const account = createAccount(
      createConnector({ signTransaction: undefined }),
    )
    await expect(account.signTransaction(UNSIGNED, {})).rejects.toThrow(
      ConnectorSigningUnsupportedError,
    )
  })

  it('reports a connector that returns something other than a transaction', async () => {
    const connector = createConnector({
      signTransaction: vi.fn().mockResolvedValue('signed_tx_whatever'),
    } as unknown as Partial<Connector>)

    await expect(
      createAccount(connector).signTransaction(UNSIGNED, {}),
    ).rejects.toThrow(ConnectorSignatureError)
  })

  it('returns the message signature as bytes', async () => {
    const connector = createConnector()

    const signature = await createAccount(connector).signMessage('hello')

    expect(signature).toEqual(new Uint8Array([10, 11, 12]))
    expect(connector.signMessage).toHaveBeenCalledWith({
      message: 'hello',
      onAccount: ADDRESS,
    })
  })

  it('reports a message signature that is not hex', async () => {
    const connector = createConnector({
      signMessage: vi.fn().mockResolvedValue('signed_hello'),
    } as unknown as Partial<Connector>)

    await expect(createAccount(connector).signMessage('hello')).rejects.toThrow(
      ConnectorSignatureError,
    )
  })

  it('reports a connector that cannot sign messages', async () => {
    const account = createAccount(createConnector({ signMessage: undefined }))
    await expect(account.signMessage('hello')).rejects.toThrow(
      ConnectorSigningUnsupportedError,
    )
  })

  it('signs a delegation through a connector that supports it', async () => {
    const signDelegation = vi.fn().mockResolvedValue(SIGNATURE)
    const connector = createConnector({
      signDelegation,
    } as unknown as Partial<Connector>)
    const delegation = encode(new Uint8Array([9]), Encoding.Bytearray)

    const signature = await createAccount(connector).signDelegation(
      delegation,
      {},
    )

    expect(signature).toBe(SIGNATURE)
    expect(signDelegation).toHaveBeenCalledWith(delegation, {
      networkId: NETWORK_ID,
      onAccount: ADDRESS,
    })
  })

  it('reports a connector that cannot sign delegations', async () => {
    const delegation = encode(new Uint8Array([9]), Encoding.Bytearray)
    await expect(
      createAccount().signDelegation(delegation, {}),
    ).rejects.toThrow(ConnectorSigningUnsupportedError)
  })

  it('refuses to approximate typed-data and raw-blob signing', async () => {
    const account = createAccount()
    const data = encode(new Uint8Array([9]), Encoding.ContractBytearray)

    await expect(account.signTypedData(data, 'int' as never)).rejects.toThrow(
      ConnectorSigningUnsupportedError,
    )
    await expect(account.unsafeSign('data')).rejects.toThrow(
      ConnectorSigningUnsupportedError,
    )
    await expect(account.sign('data')).rejects.toThrow(
      ConnectorSigningUnsupportedError,
    )
  })
})

describe('connectorAccount', () => {
  it('takes the address, connector and network id off the connection', async () => {
    const connector = createConnector()
    const connection = {
      accounts: [ADDRESS],
      activeAccount: ADDRESS,
      networkId: NETWORK_ID,
      connector,
    } as unknown as Connection

    const account = connectorAccount(connection)

    expect(account.address).toBe(ADDRESS)
    await account.signTransaction(UNSIGNED as Encoded.Transaction, {})
    expect(connector.signTransaction).toHaveBeenCalledWith({
      tx: UNSIGNED,
      networkId: NETWORK_ID,
      onAccount: ADDRESS,
    })
  })
})
