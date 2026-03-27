import type { CompilerBase } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'
import { BaseError } from '../errors/base'

export type CompileContractParameters = {
  sourceCode: string
  fileSystem?: Record<string, string>
  onCompiler: CompilerBase
}

export type CompileContractReturnType = {
  bytecode: string
  aci: unknown
}

export type CompileContractErrorType =
  | CompileContractNoCompilerError
  | BaseError

export class CompileContractNoCompilerError extends BaseError {
  override name = 'CompileContractNoCompilerError'
  constructor() {
    super('No compiler provided. Pass onCompiler in parameters.')
  }
}

export async function compileContract(
  _config: Config,
  parameters: CompileContractParameters,
): Promise<CompileContractReturnType> {
  const { sourceCode, fileSystem, onCompiler } = parameters

  if (!onCompiler) {
    throw new CompileContractNoCompilerError()
  }

  const result = await onCompiler.compileBySourceCode(sourceCode, fileSystem)

  return {
    bytecode: result.bytecode,
    aci: result.aci,
  }
}
