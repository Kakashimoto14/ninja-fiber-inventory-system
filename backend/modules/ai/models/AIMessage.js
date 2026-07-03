import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIConversation",
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ["system", "user", "assistant"],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdBy: {
      accountId: {
        type: String,
        trim: true,
        default: ""
      },
      name: {
        type: String,
        trim: true,
        default: ""
      }
    },
    status: {
      type: String,
      enum: ["completed", "streaming", "error"],
      default: "completed"
    },
    metadata: {
      provider: {
        type: String,
        trim: true,
        default: ""
      },
      model: {
        type: String,
        trim: true,
        default: ""
      },
      retryOfMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      errorCode: {
        type: String,
        trim: true,
        default: ""
      }
    }
  },
  { timestamps: true }
);

aiMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model("AIMessage", aiMessageSchema);
