import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { aci } from './aci'

describe('aci plugin', () => {
  let tempDir: string
  let cwdSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    tempDir = join(tmpdir(), `reactive-aci-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir)
  })

  afterEach(async () => {
    cwdSpy.mockRestore()
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should have correct plugin name', () => {
    const plugin = aci({ directory: './aci' })
    expect(plugin.name).toBe('ACI')
  })

  it('should load ACI from JSON files', async () => {
    const aciDir = join(tempDir, 'aci')
    await mkdir(aciDir, { recursive: true })

    await writeFile(
      join(aciDir, 'Token.json'),
      JSON.stringify({
        contract_name: 'FungibleToken',
        contract: { functions: [] },
      }),
    )

    await writeFile(
      join(aciDir, 'DEX.json'),
      JSON.stringify({
        contract_name: 'DEX',
        contract: { functions: [] },
      }),
    )

    const plugin = aci({ directory: './aci' })
    const contracts = await plugin.contracts!()

    expect(contracts).toHaveLength(2)
    const names = contracts.map((c) => c.name)
    expect(names).toContain('FungibleToken')
    expect(names).toContain('DEX')
  })

  it('should use filename when contract_name is missing', async () => {
    const aciDir = join(tempDir, 'aci')
    await mkdir(aciDir, { recursive: true })

    await writeFile(
      join(aciDir, 'MyContract.json'),
      JSON.stringify({ contract: { functions: [] } }),
    )

    const plugin = aci({ directory: './aci' })
    const contracts = await plugin.contracts!()

    expect(contracts).toHaveLength(1)
    expect(contracts[0]!.name).toBe('MyContract')
  })

  it('should return empty array when directory does not exist', async () => {
    const plugin = aci({ directory: './nonexistent' })
    const contracts = await plugin.contracts!()
    expect(contracts).toEqual([])
  })

  it('should skip non-JSON files', async () => {
    const aciDir = join(tempDir, 'aci')
    await mkdir(aciDir, { recursive: true })

    await writeFile(join(aciDir, 'readme.txt'), 'not a json file')
    await writeFile(
      join(aciDir, 'Token.json'),
      JSON.stringify({ contract_name: 'Token' }),
    )

    const plugin = aci({ directory: './aci' })
    const contracts = await plugin.contracts!()

    expect(contracts).toHaveLength(1)
    expect(contracts[0]!.name).toBe('Token')
  })
})
