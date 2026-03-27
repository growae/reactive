import { BaseError } from './base'

export type NodeNotFoundErrorType = NodeNotFoundError & {
  name: 'NodeNotFoundError'
}
export class NodeNotFoundError extends BaseError {
  override name = 'NodeNotFoundError'
  constructor({ networkId }: { networkId?: string } = {}) {
    super(
      networkId
        ? `Node not found for network "${networkId}".`
        : 'Node not found.',
    )
  }
}

export type NodeConnectionErrorType = NodeConnectionError & {
  name: 'NodeConnectionError'
}
export class NodeConnectionError extends BaseError {
  override name = 'NodeConnectionError'
  constructor({
    nodeUrl,
    cause,
  }: { nodeUrl: string; cause?: Error | undefined }) {
    super(`Failed to connect to node at "${nodeUrl}".`, {
      ...(cause ? { cause } : {}),
    })
  }
}
