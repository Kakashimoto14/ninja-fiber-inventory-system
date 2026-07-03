import { useEffect, useState } from "react";
import Modal from "../common/Modal.jsx";

const emptyProduct = {
  name: "",
  sku: "",
  category: "",
  supplier: "",
  quantity: 0,
  reorderPoint: 0
};

export default function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(emptyProduct);

  useEffect(() => {
    setForm(product ? { ...emptyProduct, ...product } : emptyProduct);
  }, [product]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      quantity: Number(form.quantity),
      reorderPoint: Number(form.reorderPoint)
    });
  };

  return (
    <Modal title={product ? "Edit Product" : "Add Product"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="label">Name</span>
          <input className="input" required value={form.name} onChange={(e) => updateField("name", e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="label">SKU</span>
          <input className="input" required value={form.sku} onChange={(e) => updateField("sku", e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="label">Category</span>
          <input className="input" required value={form.category} onChange={(e) => updateField("category", e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="label">Supplier</span>
          <input className="input" value={form.supplier} onChange={(e) => updateField("supplier", e.target.value)} />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="label">Quantity</span>
          <input className="input" min="0" type="number" value={form.quantity} onChange={(e) => updateField("quantity", e.target.value)} />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="label">Reorder Point</span>
          <input className="input" min="0" type="number" value={form.reorderPoint} onChange={(e) => updateField("reorderPoint", e.target.value)} />
        </label>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save Product
          </button>
        </div>
      </form>
    </Modal>
  );
}
