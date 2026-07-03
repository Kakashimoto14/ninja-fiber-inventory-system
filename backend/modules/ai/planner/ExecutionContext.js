export class ExecutionContext {
  constructor({ identity, availableTools = [], conversationId = null }) {
    this.identity = identity;
    this.availableTools = availableTools;
    this.conversationId = conversationId;
    this.startedAt = Date.now();
  }

  elapsedMs() {
    return Date.now() - this.startedAt;
  }
}
