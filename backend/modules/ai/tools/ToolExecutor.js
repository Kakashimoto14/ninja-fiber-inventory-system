export class ToolExecutor {
  constructor(registry) {
    this.registry = registry;
  }

  async execute(call, context = {}) {
    const tool = this.registry.get(call.name);

    if (!tool) {
      const error = new Error(`AI tool is not registered: ${call.name}`);
      error.code = "AI_TOOL_NOT_FOUND";
      throw error;
    }

    const startedAt = Date.now();

    try {
      const data = await tool.execute(call.parameters || {}, context);

      return {
        name: tool.name,
        label: tool.label,
        category: tool.category,
        status: "success",
        data,
        durationMs: Date.now() - startedAt
      };
    } catch (error) {
      return {
        name: tool.name,
        label: tool.label,
        category: tool.category,
        status: "error",
        error: error.message || "Tool execution failed",
        code: error.code || "AI_TOOL_ERROR",
        durationMs: Date.now() - startedAt
      };
    }
  }
}
