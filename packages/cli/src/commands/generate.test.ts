import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { generate } from './generate'

describe('generate', () => {
  let tempDir: string
  let cwdSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    tempDir = join(tmpdir(), `reactive-generate-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir)
  })

  afterEach(async () => {
    cwdSpy.mockRestore()
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should throw when config is not found', async () => {
    await expect(generate()).rejects.toThrow('Config not found')
  })

  it('should throw when specified config path does not exist', async () => {
    await expect(generate({ config: 'nonexistent.config.ts' })).rejects.toThrow(
      'Config not found at nonexistent.config.ts',
    )
  })

  it('should generate output from config with inline ACI', async () => {
    const aciData = [
      {
        contract: {
          functions: [
            {
              name: 'transfer',
              arguments: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'int' },
              ],
              returns: 'unit',
              stateful: true,
            },
            {
              name: 'balance',
              arguments: [{ name: 'owner', type: 'address' }],
              returns: 'int',
              stateful: false,
            },
          ],
          name: 'Token',
        },
      },
    ]

    const aciPath = join(tempDir, 'token-aci.json')
    await writeFile(aciPath, JSON.stringify(aciData))

    const configContent = JSON.stringify({
      out: 'src/generated.ts',
      contracts: [
        {
          name: 'Token',
          address: 'ct_testAddress123',
          aci: 'token-aci.json',
        },
      ],
    })
    const configPath = join(tempDir, 'reactive.config.json')
    await writeFile(configPath, configContent)

    await generate({ config: 'reactive.config.json' })

    const output = await readFile(join(tempDir, 'src/generated.ts'), 'utf-8')
    expect(output).toContain('Token')
    expect(output).toContain('tokenAddress')
    expect(output).toContain('ct_testAddress123')
    expect(output).toContain('transfer')
    expect(output).toContain('balance')
  })

  it('should throw on duplicate contract names', async () => {
    const configContent = JSON.stringify({
      out: 'src/generated.ts',
      contracts: [
        { name: 'Token', aci: {} },
        { name: 'Token', aci: {} },
      ],
    })
    const configPath = join(tempDir, 'reactive.config.json')
    await writeFile(configPath, configContent)

    await expect(generate({ config: 'reactive.config.json' })).rejects.toThrow(
      'Contract name "Token" must be unique.',
    )
  })

  it('should display message when no contracts found', async () => {
    const configContent = JSON.stringify({
      out: 'src/generated.ts',
      contracts: [],
    })
    const configPath = join(tempDir, 'reactive.config.json')
    await writeFile(configPath, configContent)

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await generate({ config: 'reactive.config.json' })

    expect(consoleSpy).toHaveBeenCalledWith('No contracts found.')
    consoleSpy.mockRestore()
  })
})
