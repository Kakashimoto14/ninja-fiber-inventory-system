const asNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const addFinding = (items, title, detail, severity = "info") => {
  if (detail) {
    items.push({ title, detail, severity });
  }
};

export class ReasoningEngine {
  reason(merged) {
    const findings = [];
    const recommendations = [];
    const unavailable = [];

    Object.values(merged.sections).forEach((section) => {
      const data = section.data;

      if (section.tool === "inventorySummary") {
        addFinding(
          findings,
          "Inventory position",
          `${asNumber(data.totalProducts)} products with ${asNumber(data.totalQuantity)} total units are recorded. ${asNumber(data.lowStockCount)} products are at or below reorder point.`,
          data.lowStockCount > 0 ? "warning" : "info"
        );

        if (data.lowStockCount > 0) {
          recommendations.push("Review low-stock products and prepare replenishment based on actual demand before stockouts occur.");
        }
      }

      if (section.tool === "lowStockProducts") {
        addFinding(
          findings,
          "Low-stock exposure",
          `${asNumber(data.count)} products are currently at or below reorder point.`,
          data.count > 0 ? "warning" : "info"
        );
      }

      if (section.tool === "dashboardSummary") {
        addFinding(
          findings,
          "Operations dashboard",
          `${asNumber(data.openTasks)} open tasks, ${asNumber(data.completedTasks)} completed tasks, and ${asNumber(data.lowStockCount)} low-stock products are currently visible.`,
          data.openTasks > 0 || data.lowStockCount > 0 ? "warning" : "info"
        );

        if (data.openTasks > 0) {
          recommendations.push("Prioritize open operational tasks by urgency and owner to reduce follow-up risk.");
        }
      }

      if (section.tool === "payrollSummary") {
        addFinding(
          findings,
          "Payroll load",
          `${asNumber(data.payrollRecords)} payroll records total ${asNumber(data.totalNetPay).toLocaleString()} net pay.`,
          "info"
        );
      }

      if (section.tool === "recentActivities") {
        addFinding(
          findings,
          "Recent activity",
          `${asNumber(data.count)} recent activity log entries were reviewed.`,
          "info"
        );
      }

      if (section.tool === "taskSummary") {
        addFinding(
          findings,
          "Task workload",
          `${asNumber(data.openTasks)} open tasks, ${asNumber(data.completedTasks)} completed tasks, and ${asNumber(data.urgentOpenTasks)} urgent open tasks are recorded.`,
          data.openTasks > 0 || data.urgentOpenTasks > 0 ? "warning" : "info"
        );

        if (data.urgentOpenTasks > 0) {
          recommendations.push("Review urgent open tasks first and assign clear owners before lower-priority work.");
        }
      }

      if (section.tool === "tasksByDate") {
        addFinding(
          findings,
          "Scheduled task lookup",
          `${asNumber(data.count)} matching scheduled tasks were found for ${data.date}${data.dueDate ? ` with deadline ${data.dueDate}` : ""}.`,
          data.count > 0 ? "info" : "warning"
        );
      }

      if (section.tool === "totalInventoryValue" && data.available === false) {
        unavailable.push(data.reason);
      }
    });

    merged.failures.forEach((failure) => {
      unavailable.push(`${failure.label} was unavailable: ${failure.error}`);
    });

    if (recommendations.length === 0 && findings.length > 0) {
      recommendations.push("Continue monitoring the retrieved metrics and ask for a module-specific drill-down if a decision is needed.");
    }

    return {
      profile: merged.profile,
      status: merged.status,
      findings,
      recommendations,
      unavailable,
      providerContext: [
        "STRUCTURED BUSINESS REASONING CONTEXT:",
        `Goal: ${merged.goal}`,
        `Profile: ${merged.profile}`,
        `Status: ${merged.status}`,
        `Tools used: ${merged.toolsUsed.join(", ") || "none"}`,
        `Findings: ${JSON.stringify(findings, null, 2)}`,
        `Recommendations: ${JSON.stringify(recommendations, null, 2)}`,
        `Unavailable information: ${JSON.stringify(unavailable, null, 2)}`,
        "Merged tool context:",
        JSON.stringify(merged.sections, null, 2)
      ].join("\n\n")
    };
  }
}
