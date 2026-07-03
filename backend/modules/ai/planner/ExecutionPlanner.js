import { ExecutionGraph } from "./ExecutionGraph.js";
import { buildProfileSteps, detectPlanningProfile } from "./PlannerRules.js";

export class ExecutionPlanner {
  createPlan({ message, context }) {
    const profile = detectPlanningProfile(message);
    const steps = buildProfileSteps({ profile, message, context });
    const goal = String(message || "").trim().slice(0, 180) || "Business assistant request";

    return new ExecutionGraph({
      goal,
      profile,
      steps,
      expectedOutput:
        profile === "general"
          ? "Direct business answer grounded in retrieved data"
          : "Professional business conclusion with findings and recommendations"
    });
  }
}
