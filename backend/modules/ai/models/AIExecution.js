import mongoose from "mongoose";

const aiExecutionStepSchema = new mongoose.Schema(
  {
    stepId: {
      type: String,
      required: true,
      trim: true
    },
    label: {
      type: String,
      trim: true,
      default: ""
    },
    tool: {
      type: String,
      trim: true,
      default: ""
    },
    dependencies: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed", "skipped"],
      default: "pending"
    },
    durationMs: {
      type: Number,
      default: 0
    },
    error: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

const aiExecutionSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIConversation",
      required: true,
      index: true
    },
    goal: {
      type: String,
      trim: true,
      default: ""
    },
    profile: {
      type: String,
      trim: true,
      default: "general"
    },
    status: {
      type: String,
      enum: ["completed", "partial", "failed"],
      default: "completed"
    },
    toolsUsed: {
      type: [String],
      default: []
    },
    failures: {
      type: [String],
      default: []
    },
    durationMs: {
      type: Number,
      default: 0
    },
    steps: {
      type: [aiExecutionStepSchema],
      default: []
    }
  },
  { timestamps: true }
);

aiExecutionSchema.index({ conversationId: 1, createdAt: -1 });
aiExecutionSchema.index({ profile: 1, createdAt: -1 });

export default mongoose.model("AIExecution", aiExecutionSchema);
