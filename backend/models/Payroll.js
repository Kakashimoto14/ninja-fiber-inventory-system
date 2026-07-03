import mongoose from "mongoose";

const nonNegative = [0, "Value cannot be negative"];

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"]
    },
    employeeName: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true
    },
    position: {
      type: String,
      trim: true,
      default: ""
    },
    month: {
      type: Number,
      required: [true, "Payroll month is required"],
      min: [1, "Payroll month is invalid"],
      max: [12, "Payroll month is invalid"]
    },
    year: {
      type: Number,
      required: [true, "Payroll year is required"],
      min: [2000, "Payroll year is invalid"]
    },
    daysWorked: {
      type: Number,
      required: [true, "Days worked is required"],
      min: [0, "Days worked cannot be negative"]
    },
    dailyRate: {
      type: Number,
      required: [true, "Daily rate is required"],
      min: [0, "Daily rate cannot be negative"]
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: nonNegative
    },
    otHours: {
      type: Number,
      default: 0,
      min: [0, "OT hours cannot be negative"]
    },
    otMultiplier: {
      type: Number,
      default: 1.25,
      min: [0, "OT multiplier cannot be negative"]
    },
    otPay: {
      type: Number,
      default: 0,
      min: nonNegative
    },
    allowance: {
      type: Number,
      default: 0,
      min: [0, "Allowance cannot be negative"]
    },
    bonus: {
      type: Number,
      default: 0,
      min: [0, "Bonus cannot be negative"]
    },
    cashAdvance: {
      type: Number,
      default: 0,
      min: [0, "Cash advance cannot be negative"]
    },
    otherDeductions: {
      type: Number,
      default: 0,
      min: [0, "Other deductions cannot be negative"]
    },
    grossPay: {
      type: Number,
      required: true,
      min: nonNegative
    },
    netPay: {
      type: Number,
      required: true
    },
    remarks: {
      type: String,
      trim: true,
      default: ""
    },
    createdBy: {
      type: String,
      required: [true, "Prepared by is required"],
      trim: true
    }
  },
  { timestamps: true }
);

payrollSchema.index({ year: -1, month: -1, createdAt: -1 });
payrollSchema.index({ employeeName: "text", remarks: "text" });

export default mongoose.model("Payroll", payrollSchema);
