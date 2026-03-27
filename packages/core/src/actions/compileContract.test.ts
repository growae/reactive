import { describe, expect, it, vi } from 'vitest'
import {
  CompileContractNoCompilerError,
  compileContract,
} from './compileContract.js'

describe('compileContract', () => {
  it('should be a function', () => {
    expect(typeof compileContract).toBe('function')
  })

  it('should require config and parameters', () => {
    expect(compileContract.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw CompileContractNoCompilerError when no compiler configured', async () => {
    const mockConfig = {
      getCompiler: vi.fn(() => undefined),
    }

    await expect(
      compileContract(mockConfig as any, { sourceCode: 'contract Test = ...' }),
    ).rejects.toThrow(CompileContractNoCompilerError)
  })

  it('should compile source code and return bytecode and aci', async () => {
    const mockCompiler = {
      compileBySourceCode: vi.fn().mockResolvedValue({
        bytecode: 'cb_bytecode',
        aci: { functions: [] },
      }),
    }
    const mockConfig = {
      getCompiler: vi.fn(() => mockCompiler),
    }

    const result = await compileContract(mockConfig as any, {
      sourceCode: 'contract Test = let greet() = "hello"',
    })
    expect(result.bytecode).toBe('cb_bytecode')
    expect(result.aci).toEqual({ functions: [] })
    expect(mockCompiler.compileBySourceCode).toHaveBeenCalledWith(
      'contract Test = let greet() = "hello"',
      undefined,
    )
  })

  it('should pass fileSystem to compiler', async () => {
    const mockCompiler = {
      compileBySourceCode: vi.fn().mockResolvedValue({
        bytecode: 'cb_bytecode',
        aci: {},
      }),
    }
    const mockConfig = {
      getCompiler: vi.fn(() => mockCompiler),
    }
    const files = { 'lib.aes': 'namespace Lib = ...' }

    await compileContract(mockConfig as any, {
      sourceCode: 'include "lib.aes"',
      fileSystem: files,
    })
    expect(mockCompiler.compileBySourceCode).toHaveBeenCalledWith(
      'include "lib.aes"',
      files,
    )
  })
})
