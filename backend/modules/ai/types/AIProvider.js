export class AIProvider {
  constructor(config) {
    this.config = config;
  }

  get name() {
    return "base";
  }

  async generateResponse() {
    throw new Error("generateResponse() must be implemented by an AI provider");
  }

  async *streamResponse() {
    throw new Error("streamResponse() must be implemented by an AI provider");
  }

  async generateEmbedding() {
    throw new Error("Embeddings are not enabled in Phase 1");
  }
}
