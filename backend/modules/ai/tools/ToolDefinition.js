export class ToolDefinition {
  constructor({ name, description, parameters = {}, category = "system", label = "", execute }) {
    if (!name || typeof execute !== "function") {
      throw new Error("ToolDefinition requires a name and execute function");
    }

    this.name = name;
    this.description = description || "";
    this.parameters = parameters;
    this.category = category;
    this.label = label || name;
    this.execute = execute;
  }
}

export const createTool = (definition) => new ToolDefinition(definition);
