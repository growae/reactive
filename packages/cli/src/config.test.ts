import { describe, expect, it } from 'vitest'

import { defaultConfig, defineConfig } from './config.js'

describe('defineConfig', () => {
  it('should return the same config object', () => {
    const config = {
      out: 'src/generated.ts',
      contracts: [{ name: 'Token', address: 'ct_test123' }],
    }
    expect(defineConfig(config)).toBe(config)
  })

  it('should accept config with plugins', () => {
    const config = defineConfig({
      out: 'src/generated.ts',
      contracts: [],
      plugins: [
        {
          name: 'test-plugin',
          async contracts() {
            return []
          },
        },
      ],
    })
    expect(config.plugins).toHaveLength(1)
    expect(config.plugins![0]!.name).toBe('test-plugin')
  })

  it('should accept contracts with ACI object', () => {
    const config = defineConfig({
      out: 'src/generated.ts',
      contracts: [
        {
          name: 'Token',
          aci: { contract: { functions: [] } },
        },
      ],
    })
    expect(config.contracts).toHaveLength(1)
    expect(config.contracts[0]!.aci).toEqual({ contract: { functions: [] } })
  })

  it('should accept contracts with ACI file path', () => {
    const config = defineConfig({
      out: 'src/generated.ts',
      contracts: [
        {
          name: 'Token',
          aci: './contracts/Token.json',
        },
      ],
    })
    expect(config.contracts[0]!.aci).toBe('./contracts/Token.json')
  })

  it('should accept contracts with source code path', () => {
    const config = defineConfig({
      out: 'src/generated.ts',
      contracts: [
        {
          name: 'Token',
          sourceCode: './contracts/Token.aes',
        },
      ],
    })
    expect(config.contracts[0]!.sourceCode).toBe('./contracts/Token.aes')
  })
})

describe('defaultConfig', () => {
  it('should have expected defaults', () => {
    expect(defaultConfig.out).toBe('src/generated.ts')
    expect(defaultConfig.contracts).toEqual([])
    expect(defaultConfig.plugins).toEqual([])
  })
})
