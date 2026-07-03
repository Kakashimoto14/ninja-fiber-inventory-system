import Product from "../models/Product.js";
import Activity from "../models/Activity.js";

const createActivity = (message, type, entityId) =>
  Activity.create({ message, type, entityId }).catch(() => null);

const normalizeProductPayload = (body) => ({
  name: body.name,
  sku: body.sku,
  category: body.category,
  supplier: body.supplier,
  quantity: Number(body.quantity ?? 0),
  reorderPoint: Number(body.reorderPoint ?? 0),
  imageUrl: body.imageUrl || ""
});

export const getProducts = async (req, res, next) => {
  try {
    const { search = "", category = "" } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { supplier: { $regex: search, $options: "i" } }
      ];
    }

    if (category && category !== "All") {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(normalizeProductPayload(req.body));
    await createActivity(`Added product ${product.name}`, "product", product._id);
    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      return next(new Error("A product with this SKU already exists"));
    }
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    if (req.body.stockAdjustment) {
      const delta = Number(req.body.stockAdjustment.delta || 0);
      const nextQuantity = product.quantity + delta;

      if (nextQuantity < 0) {
        res.status(400);
        throw new Error("Stock adjustment cannot make quantity negative");
      }

      product.quantity = nextQuantity;
      product.stockAdjustments.push({
        delta,
        note: req.body.stockAdjustment.note || ""
      });

      await product.save();
      await createActivity(
        `Stock adjusted for ${product.name} (${delta > 0 ? "+" : ""}${delta})`,
        "stock",
        product._id
      );

      return res.json(product);
    }

    Object.assign(product, normalizeProductPayload({ ...product.toObject(), ...req.body }));
    const updatedProduct = await product.save();
    await createActivity(`Updated product ${updatedProduct.name}`, "product", updatedProduct._id);

    res.json(updatedProduct);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      return next(new Error("A product with this SKU already exists"));
    }
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    await product.deleteOne();
    await createActivity(`Deleted product ${product.name}`, "product", product._id);

    res.json({ message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};
