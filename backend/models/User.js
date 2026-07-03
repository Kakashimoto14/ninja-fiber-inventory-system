import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    role: {
      type: String,
      enum: ["admin", "superadmin"],
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    password: {
      type: String,
      default: "1234"
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
