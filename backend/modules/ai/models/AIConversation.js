import mongoose from "mongoose";

const aiConversationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Conversation title is required"],
      trim: true,
      maxlength: 80
    },
    createdBy: {
      accountId: {
        type: String,
        required: true,
        trim: true
      },
      name: {
        type: String,
        required: true,
        trim: true
      },
      role: {
        type: String,
        enum: ["superadmin"],
        default: "superadmin"
      }
    },
    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active"
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
      lastError: {
        type: String,
        trim: true,
        default: ""
      }
    }
  },
  { timestamps: true }
);

aiConversationSchema.index({ "createdBy.accountId": 1, status: 1, updatedAt: -1 });

export default mongoose.model("AIConversation", aiConversationSchema);
