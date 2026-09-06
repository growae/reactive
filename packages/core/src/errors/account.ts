import { BaseError } from './base.js'

export type AccountNotFoundErrorType = AccountNotFoundError & {
  name: 'AccountNotFoundError'
}
export class AccountNotFoundError extends BaseError {
  override name = 'AccountNotFoundError'
  constructor() {
    super('Account not found.', {
      metaMessages: [
        'Ensure a connector is connected with at least one account.',
      ],
    })
  }
}

export type AccountNotConnectedErrorType = AccountNotConnectedError & {
  name: 'AccountNotConnectedError'
}
export class AccountNotConnectedError extends BaseError {
  override name = 'AccountNotConnectedError'
  constructor() {
    super('Account not connected.')
  }
}
