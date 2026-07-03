import AIExecution from "../models/AIExecution.js";

export const AIExecutionService = {
  record: async ({ conversationId, graph, durationMs }) => {
    if (!graph?.steps?.length) return null;

    const failures = graph.steps
      .filter((step) => step.status === "failed")
      .map((step) => `${step.label || step.tool}: ${step.error || "failed"}`);
    const toolsUsed = [...new Set(graph.steps.filter((step) => step.tool).map((step) => step.tool))];

    return AIExecution.create({
      conversationId,
      goal: graph.goal,
      profile: graph.profile,
      status: failures.length === 0 ? "completed" : toolsUsed.length > failures.length ? "partial" : "failed",
      toolsUsed,
      failures,
      durationMs,
      steps: graph.steps.map((step) => ({
        stepId: step.id,
        label: step.label,
        tool: step.tool,
        dependencies: step.dependencies,
        status: step.status,
        durationMs: step.durationMs,
        error: step.error || ""
      }))
    });
  }
};
