export class ResultMerger {
  merge(graph) {
    const merged = {
      goal: graph.goal,
      profile: graph.profile,
      status: graph.failedSteps.length > 0 ? "partial" : "completed",
      toolsUsed: [],
      sections: {},
      failures: []
    };

    graph.steps.forEach((step) => {
      if (step.status === "completed" && step.result?.data) {
        merged.toolsUsed.push(step.tool);
        merged.sections[step.id] = {
          tool: step.tool,
          label: step.label,
          data: step.result.data
        };
      }

      if (step.status === "failed") {
        merged.failures.push({
          stepId: step.id,
          tool: step.tool,
          label: step.label,
          error: step.error
        });
      }
    });

    merged.toolsUsed = [...new Set(merged.toolsUsed)];
    return merged;
  }
}
