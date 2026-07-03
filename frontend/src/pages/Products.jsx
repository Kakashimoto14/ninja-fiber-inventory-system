import { useEffect, useMemo, useState } from "react";
import { Edit3, PackagePlus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import ProductModal from "../components/products/ProductModal.jsx";
import StockAdjustModal from "../components/products/StockAdjustModal.jsx";
import { mockProducts } from "../data/mockData.js";
import { productsApi } from "../services/api.js";
import { getId } from "../utils/format.js";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))],
    [products]
  );

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.sku.toLowerCase().includes(normalizedSearch) ||
        product.supplier.toLowerCase().includes(normalizedSearch);
      const matchesCategory = category === "All" || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, products, search]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await productsApi.list();
        setProducts(data);
      } catch {
        setDemoMode(true);
        setProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const saveProduct = async (payload) => {
    if (editingProduct) {
      const id = getId(editingProduct);
      try {
        const updated = await productsApi.update(id, payload);
        setProducts((current) => current.map((item) => (getId(item) === id ? updated : item)));
      } catch {
        setDemoMode(true);
        setProducts((current) => current.map((item) => (getId(item) === id ? { ...item, ...payload } : item)));
      }
    } else {
      try {
        const created = await productsApi.create(payload);
        setProducts((current) => [created, ...current]);
      } catch {
        setDemoMode(true);
        setProducts((current) => [{ ...payload, _id: `demo-${Date.now()}` }, ...current]);
      }
    }
    setEditingProduct(null);
  };

  const deleteProduct = async (product) => {
    const id = getId(product);
    try {
      await productsApi.remove(id);
    } catch {
      setDemoMode(true);
    }
    setProducts((current) => current.filter((item) => getId(item) !== id));
  };

  const adjustStock = async (payload) => {
    const id = getId(adjustingProduct);
    try {
      const updated = await productsApi.update(id, payload);
      setProducts((current) => current.map((item) => (getId(item) === id ? updated : item)));
    } catch {
      setDemoMode(true);
      setProducts((current) =>
        current.map((item) =>
          getId(item) === id
            ? { ...item, quantity: Math.max(Number(item.quantity) + Number(payload.stockAdjustment.delta), 0) }
            : item
        )
      );
    }
    setAdjustingProduct(null);
  };

  if (loading) {
    return <LoadingSpinner label="Loading products..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Products</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Inventory Management</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {demoMode && (
            <span className="rounded-md bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
              Using local demo data
            </span>
          )}
          <button type="button" className="btn-primary" onClick={() => setEditingProduct({})}>
            <PackagePlus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      <section className="card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, SKU, or supplier"
            />
          </label>
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select className="input pl-9" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Image", "SKU", "Name", "Category", "Current Quantity", "Reorder Point", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleProducts.map((product) => {
                const lowStock = product.quantity <= product.reorderPoint;

                return (
                  <tr key={getId(product)} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-sm font-extrabold text-primary">
                        {product.name.slice(0, 2).toUpperCase()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-700">{product.sku}</td>
                    <td className="min-w-56 px-4 py-4">
                      <p className="text-sm font-bold text-slate-950">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.supplier}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{product.category}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className={`rounded-md px-2.5 py-1 text-sm font-bold ${lowStock ? "bg-orange-50 text-orange-700" : "bg-teal/10 text-teal"}`}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{product.reorderPoint}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex gap-2">
                        <button type="button" className="btn-secondary px-3 py-2" onClick={() => setAdjustingProduct(product)}>
                          Adjust
                        </button>
                        <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-teal hover:text-primary" onClick={() => setEditingProduct(product)} aria-label={`Edit ${product.name}`}>
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-red-200 hover:text-red-600" onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {editingProduct && (
        <ProductModal
          product={Object.keys(editingProduct).length ? editingProduct : null}
          onClose={() => setEditingProduct(null)}
          onSave={saveProduct}
        />
      )}
      {adjustingProduct && (
        <StockAdjustModal product={adjustingProduct} onClose={() => setAdjustingProduct(null)} onSave={adjustStock} />
      )}
    </div>
  );
}
