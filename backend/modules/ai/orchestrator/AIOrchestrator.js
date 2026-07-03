import { ExecutionContext } from "../planner/ExecutionContext.js";
import { ExecutionPlanner } from "../planner/ExecutionPlanner.js";
import { ReasoningEngine } from "../planner/ReasoningEngine.js";
import { ResultMerger } from "../planner/ResultMerger.js";
import { ToolExecutor } from "../tools/ToolExecutor.js";
import { createDefaultToolRegistry } from "../tools/ToolRegistry.js";

export class AIOrchestrator {
  constructor({
    registry = createDefaultToolRegistry(),
    planner = new ExecutionPlanner(),
    merger = new ResultMerger(),
    reasoningEngine = new ReasoningEngine()
  } = {}) {
    this.registry = registry;
    this.planner = planner;
    this.merger = merger;
    this.reasoningEngine = reasoningEngine;
    this.executor = new ToolExecutor(registry);
  }

  getToolDefinitions(context) {
    return this.registry.definitions(context);
  }

  async runReadySteps({ graph, context, completedIds, emitEvent }) {
    const readySteps = graph.readySteps(completedIds);

    if (readySteps.length === 0) {
      return;
    }

    await Promise.all(
      readySteps.map(async (step) => {
        step.markRunning();
        await emitEvent("step_started", {
          id: step.id,
          label: step.label,
          tool: step.tool,
          dependencies: step.dependencies
        });
        const tool = this.registry.get(step.tool);
        await emitEvent("tool_start", {
          name: step.tool,
          label: tool?.label || step.label,
          category: tool?.category || "system"
        });

        const result = await this.executor.execute(
          { name: step.tool, parameters: step.parameters },
          context
        );

        if (result.status === "success") {
          step.markCompleted(result, result.durationMs);
          completedIds.add(step.id);
          await emitEvent("step_completed", {
            id: step.id,
            label: step.label,
            tool: step.tool,
            durationMs: step.durationMs
          });
          await emitEvent("tool_done", {
            name: result.name,
            label: result.label,
            category: result.category,
            status: result.status,
            durationMs: result.durationMs
          });
          return;
        }

        step.markFailed(result);
        completedIds.add(step.id);
        await emitEvent("step_failed", {
          id: step.id,
          label: step.label,
          tool: step.tool,
          durationMs: step.durationMs,
          error: step.error
        });
        await emitEvent("tool_error", {
          name: result.name,
          label: result.label,
          category: result.category,
          status: result.status,
          durationMs: result.durationMs,
          error: result.error
        });
      })
    );

    await this.runReadySteps({ graph, context, completedIds, emitEvent });
  }

  async prepare({ message, identity, conversationId = null, emitToolEvent = async () => {} }) {
    const startedAt = Date.now();
    const context = new ExecutionContext({
      identity,
      conversationId,
      availableTools: this.getToolDefinitions({ identity })
    });
    context.toolLabelFor = (toolName) => this.registry.get(toolName)?.label || toolName;

    await emitToolEvent("planning_started", {
      label: "Planning Request"
    });

    const graph = this.planner.createPlan({ message, context });

    await emitToolEvent("planning_completed", graph.toClientPlan());

    if (!graph.hasSteps) {
      return {
        graph,
        merged: null,
        reasoning: null,
        results: [],
        durationMs: Date.now() - startedAt,
        providerMessages: []
      };
    }

    await this.runReadySteps({
      graph,
      context,
      completedIds: new Set(),
      emitEvent: emitToolEvent
    });

    await emitToolEvent("reasoning_started", {
      label: "Generating Recommendations"
    });
    const merged = this.merger.merge(graph);
    const reasoning = this.reasoningEngine.reason(merged);
    await emitToolEvent("reasoning_completed", {
      label: "Preparing Response",
      status: reasoning.status,
      findings: reasoning.findings.length,
      recommendations: reasoning.recommendations.length
    });

    return {
      graph,
      merged,
      reasoning,
      results: graph.steps.map((step) => step.result).filter(Boolean),
      durationMs: Date.now() - startedAt,
      providerMessages: [
        {
          role: "user",
          content: [
            "READ-ONLY BUSINESS EXECUTION CONTEXT:",
            "Use only this execution context for inventory, payroll, analytics, activity, date, or company facts.",
            "Do not invent trends, quantities, values, people, records, or activity that are absent from this context.",
            "Explain what the retrieved data means and provide recommendations only when supported by retrieved data.",
            reasoning.providerContext
          ].join("\n\n")
        }
      ]
    };
  }
}

export const aiOrchestrator = new AIOrchestrator();
