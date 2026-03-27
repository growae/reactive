import type { Config } from '../createConfig.js'
import { BaseError } from '../errors/base.js'

export type CompileContractParameters = {
  sourceCode: string
  fileSystem?: Record<string, string>
}

export type CompileContractReturnType = {
  bytecode: string
  aci: any
}

export type CompileContractErrorType =
  | CompileContractNoCompilerError
  | BaseError

export class CompileContractNoCompilerError extends BaseError {
  override name = 'CompileContractNoCompilerError'
  constructor() {
    super('No compiler configured. Set compilerUrl in config.')
  }
}

export async function compileContract(
  config: Config,
  parameters: CompileContractParameters,
): Promise<CompileContractReturnType> {
  const { sourceCode, fileSystem } = parameters

  const compiler = config.getCompiler()
  if (!compiler) {
    throw new CompileContractNoCompilerError()
  }

  const result = await compiler.compileBySourceCode(sourceCode, fileSystem)

  return {
    bytecode: result.bytecode,
    aci: result.aci,
  }
}
