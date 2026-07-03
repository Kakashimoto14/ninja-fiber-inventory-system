import Product from "../../../models/Product.js";
import { aiConfig } from "../config/aiConfig.js";
import { getOrSetCachedValue } from "../utils/cache.js";
import { createTool } from "./ToolDefinition.js";
import { escapeRegex, requireSuperAdminToolAccess, sanitizeText, toPositiveInteger } from "./toolValidation.js";

const productProjection = "name sku category supplier quantity reorderPoint updatedAt createdAt";

const serializeProduct = (product) => ({
  id: String(product._id),
  name: product.name,
  sku: product.sku,
  category: product.category,
  supplier: product.supplier,
  quantity: product.quantity,
  reorderPoint: product.reorderPoint,
  isLowStock: product.quantity <= product.reorderPoint,
  updatedAt: product.updatedAt
});

const productSearchQuery = (query) => ({
  $or: [
    { name: { $regex: escapeRegex(query), $options: "i" } },
    { sku: { $regex: escapeRegex(query), $options: "i" } },
    { supplier: { $regex: escapeRegex(query), $options: "i" } },
    { category: { $regex: escapeRegex(query), $options: "i" } }
  ]
});

export const getInventoryTools = () => [
  createTool({
    name: "searchProducts",
    label: "Searching Inventory",
    category: "inventory",
    description: "Search products by name, SKU, supplier, or category.",
    parameters: {
      query: { type: "string", required: true },
      limit: { type: "number", default: 8 }
    },
    execute: async (params, context) => {
      requireSuperAdminToolAccess(context);
      const query = sanitizeText(params.query, 80);
      const limit = toPositiveInteger(params.limit, 8, 25);

      if (!query) {
        return { products: [], totalMatched: 0, note: "No search term provided." };
      }

      const products = await Product.find(productSearchQuery(query))
        .select(productProjection)
        .sort({ quantity: 1, name: 1 })
        .limit(limit)
        .lean();

      return {
        query,
        totalMatched: products.length,
        products: products.map(serializeProduct)
      };
    }
  }),

  createTool({
    name: "lowStockProducts",
    label: "Reading Low Stock",
    category: "inventory",
    description: "List products with quantity at or below reorder point.",
    parameters: {
      limit: { type: "number", default: 20 }
    },
    execute: async (params, context) => {
      requireSuperAdminToolAccess(context);
      const limit = toPositiveInteger(params.limit, 20, 100);
      const products = await Product.find({ $expr: { $lte: ["$quantity", "$reorderPoint"] } })
        .select(productProjection)
        .sort({ quantity: 1, name: 1 })
        .limit(limit)
        .lean();

      return {
        count: products.length,
        products: products.map(serializeProduct)
      };
    }
  }),

  createTool({
    name: "inventorySummary",
    label: "Summarizing Inventory",
    category: "inventory",
    description: "Summarize inventory counts, quantities, categories, and low-stock status.",
    parameters: {},
    execute: async (_params, context) => {
      requireSuperAdminToolAccess(context);

      const { value } = await getOrSetCachedValue("ai:inventorySummary", aiConfig.summaryCacheTtlMs, async () => {
        const products = await Product.find().select(productProjection).lean();
        const categoryCounts = products.reduce((acc, product) => {
          acc[product.category] = (acc[product.category] || 0) + 1;
          return acc;
        }, {});
        const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
        const lowStockProducts = products.filter((product) => product.quantity <= product.reorderPoint);

        return {
          totalProducts: products.length,
          totalQuantity,
          lowStockCount: lowStockProducts.length,
          categories: categoryCounts,
          lowestStock: [...products]
            .sort((a, b) => a.quantity - b.quantity)
            .slice(0, 8)
            .map(serializeProduct)
        };
      });

      return value;
    }
  }),

  createTool({
    name: "productByName",
    label: "Reading Product",
    category: "inventory",
    description: "Find the best product match by name or SKU and report current quantity.",
    parameters: {
      query: { type: "string", required: true }
    },
    execute: async (params, context) => {
      requireSuperAdminToolAccess(context);
      const query = sanitizeText(params.query, 80);

      if (!query) {
        return { product: null, note: "No product name or SKU provided." };
      }

      const exact = await Product.findOne({
        $or: [
          { name: { $regex: `^${escapeRegex(query)}$`, $options: "i" } },
          { sku: query.toUpperCase() }
        ]
      })
        .select(productProjection)
        .lean();

      const product =
        exact ||
        (await Product.findOne(productSearchQuery(query))
          .select(productProjection)
          .sort({ name: 1 })
          .lean());

      return {
        query,
        product: product ? serializeProduct(product) : null,
        note: product ? "" : "No matching product exists in the database."
      };
    }
  }),

  createTool({
    name: "totalInventoryValue",
    label: "Checking Inventory Value",
    category: "inventory",
    description: "Report whether inventory value can be calculated from stored data.",
    parameters: {},
    execute: async (_params, context) => {
      requireSuperAdminToolAccess(context);
      const [totalProducts, totalQuantity] = await Promise.all([
        Product.countDocuments(),
        Product.aggregate([{ $group: { _id: null, totalQuantity: { $sum: "$quantity" } } }])
      ]);

      return {
        available: false,
        totalProducts,
        totalQuantity: totalQuantity[0]?.totalQuantity || 0,
        reason:
          "The current Product schema stores quantity and reorder point but does not store unit cost or selling price, so total inventory value cannot be calculated without guessing."
      };
    }
  })
];
