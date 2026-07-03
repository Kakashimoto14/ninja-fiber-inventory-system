import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["product", "task", "stock", "system", "employee", "payroll"],
      default: "system"
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);
