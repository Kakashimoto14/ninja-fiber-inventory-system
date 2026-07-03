import mongoose from "mongoose";

const stockAdjustmentSchema = new mongoose.Schema(
  {
    delta: {
      type: Number,
      required: true
    },
    note: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true
    },
    supplier: {
      type: String,
      trim: true,
      default: ""
    },
    quantity: {
      type: Number,
      min: [0, "Quantity cannot be negative"],
      default: 0
    },
    reorderPoint: {
      type: Number,
      min: [0, "Reorder point cannot be negative"],
      default: 0
    },
    imageUrl: {
      type: String,
      default: ""
    },
    stockAdjustments: [stockAdjustmentSchema]
  },
  { timestamps: true }
);

productSchema.virtual("isLowStock").get(function isLowStock() {
  return this.quantity <= this.reorderPoint;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default mongoose.model("Product", productSchema);
