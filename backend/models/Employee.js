import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true
    },
    dailyRate: {
      type: Number,
      required: [true, "Daily rate is required"],
      min: [0, "Daily rate cannot be negative"]
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

employeeSchema.index({ fullName: 1, position: 1 });

export default mongoose.model("Employee", employeeSchema);
