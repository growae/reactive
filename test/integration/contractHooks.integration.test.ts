import {
  buildTransaction,
  ContractConfirmationError,
  callContract,
  connect,
  decodeContractValue,
  deployContract,
  getGasPrice,
  getTransactionReceipt,
  readContract,
  readContracts,
  sendCallsSync,
  simulateContract,
} from '@growae/reactive'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestConfig, waitForNode } from '../setup/integration.js'
import fixture from './HookProbe.json'

describe.skipIf(!process.env.INTEGRATION)(
  'Rust-backed Sophia contract actions',
  () => {
    beforeAll(async () => {
      await waitForNode()
    })
    it('deploys, simulates, reads, writes and retrieves the mined execution', async () => {
      const config = createTestConfig()
      await connect(config, { connector: config.connectors[0]! })
      const deployed = await deployContract(config, {
        bytecode: fixture.bytecode,
        function: 'init',
        gasLimit: 100000,
        waitMined: true,
        timeout: 90_000,
      })
      expect(deployed.address).toMatch(/^ct_/)
      const call = {
        address: deployed.address,
        function: 'echo',
        args: [19n],
      } as const
      const dry = await simulateContract(config, call)
      expect(dry.returnType).toBe('ok')
      await expect(
        decodeContractValue(await readContract(config, call)),
      ).resolves.toBe(19n)
      const two = await readContracts(config, {
        contracts: [call, { ...call, args: [23n] }],
      })
      await expect(Promise.all(two.map(decodeContractValue))).resolves.toEqual([
        19n,
        23n,
      ])
      const unorderedMap = {
        map: [
          ['ä', 1n],
          ['xy', 2n],
        ],
      } as const
      const size = await readContract(config, {
        address: deployed.address,
        function: 'map_size',
        args: [unorderedMap],
      })
      await expect(decodeContractValue(size)).resolves.toBe(2n)
      await expect(
        readContract(config, { address: deployed.address, function: 'fail' }),
      ).rejects.toThrow(/revert|error/)
      const posted = await callContract(config, {
        ...call,
        gasLimit: 50000,
        waitMined: true,
        timeout: 90_000,
      })
      const receipt = await getTransactionReceipt(config, { hash: posted.hash })
      expect(receipt?.blockHeight).toBeGreaterThan(0)
      expect(receipt?.execution?.callInfo?.returnType).toBe('ok')
      await expect(
        callContract(config, {
          address: deployed.address,
          function: 'fail',
          gasLimit: 50000,
          waitMined: true,
          timeout: 90_000,
        }),
      ).rejects.toBeInstanceOf(ContractConfirmationError)
      expect(await getGasPrice(config)).toMatch(/^\d+$/)
    }, 210_000)
    it('signs, submits and confirms two independent AE transactions in order', async () => {
      const config = createTestConfig()
      const connection = await connect(config, {
        connector: config.connectors[0]!,
      })
      const address = connection.accounts[0]!
      const { nextNonce } = await config
        .getNodeClient({})
        .getAccountNextNonce(address)
      const calls = await Promise.all(
        [nextNonce, nextNonce + 1].map((nonce) =>
          buildTransaction(config, {
            tag: 'SpendTx',
            fields: [
              { key: 'senderId', value: { tag: 'encoded', val: address } },
              { key: 'recipientId', value: { tag: 'encoded', val: address } },
              { key: 'nonce', value: { tag: 'uint', val: String(nonce) } },
              { key: 'amount', value: { tag: 'uint', val: '1' } },
            ],
          }),
        ),
      )
      const status = await sendCallsSync(config, {
        calls,
        timeout: 90_000,
        interval: 500,
      })
      expect(status.included).toBe(true)
      expect(status.group.hashes).toHaveLength(2)
    }, 110_000)
  },
)
