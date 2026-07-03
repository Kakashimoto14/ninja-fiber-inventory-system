export class ExecutionGraph {
  constructor({ goal, profile = "general", steps = [], expectedOutput = "" }) {
    this.goal = goal;
    this.profile = profile;
    this.steps = steps;
    this.expectedOutput = expectedOutput;
    this.createdAt = new Date();
  }

  get hasSteps() {
    return this.steps.length > 0;
  }

  get completedSteps() {
    return this.steps.filter((step) => step.status === "completed");
  }

  get failedSteps() {
    return this.steps.filter((step) => step.status === "failed");
  }

  readySteps(completedIds = new Set()) {
    return this.steps.filter(
      (step) =>
        step.status === "pending" &&
        step.dependencies.every((dependency) => completedIds.has(dependency))
    );
  }

  toClientPlan() {
    return {
      goal: this.goal,
      profile: this.profile,
      expectedOutput: this.expectedOutput,
      steps: this.steps.map((step) => ({
        id: step.id,
        tool: step.tool,
        label: step.label,
        dependencies: step.dependencies,
        status: step.status,
        expectedOutput: step.expectedOutput
      }))
    };
  }
}
