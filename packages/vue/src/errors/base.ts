import { BaseError as CoreError } from '@reactive/core'

export type BaseErrorType = BaseError & { name: 'ReactiveVueError' }
export class BaseError extends CoreError {
  override name = 'ReactiveVueError'
}
