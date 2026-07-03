export class ExecutionStep {
  constructor({ id, tool, label, parameters = {}, dependencies = [], expectedOutput = "" }) {
    this.id = id;
    this.tool = tool;
    this.label = label || tool;
    this.parameters = parameters;
    this.dependencies = dependencies;
    this.expectedOutput = expectedOutput;
    this.status = "pending";
    this.result = null;
    this.error = "";
    this.durationMs = 0;
  }

  markRunning() {
    this.status = "running";
  }

  markCompleted(result, durationMs) {
    this.status = "completed";
    this.result = result;
    this.durationMs = durationMs || result?.durationMs || 0;
  }

  markFailed(result) {
    this.status = "failed";
    this.result = result;
    this.error = result?.error || "Execution step failed";
    this.durationMs = result?.durationMs || 0;
  }
}
