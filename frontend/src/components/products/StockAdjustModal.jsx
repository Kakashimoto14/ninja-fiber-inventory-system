import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import Modal from "../common/Modal.jsx";

export default function StockAdjustModal({ product, onClose, onSave }) {
  const [delta, setDelta] = useState(1);
  const [note, setNote] = useState("");

  const submit = (event) => {
    event.preventDefault();
    onSave({
      stockAdjustment: {
        delta: Number(delta),
        note
      }
    });
  };

  return (
    <Modal title={`Adjust Stock: ${product.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-lg bg-soft p-4">
          <p className="text-sm font-semibold text-slate-500">Current Quantity</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-950">{product.quantity}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto]">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setDelta((value) => Number(value) - 1)}
            aria-label="Decrease adjustment"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            className="input text-center text-lg font-bold"
            type="number"
            value={delta}
            onChange={(event) => setDelta(event.target.value)}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setDelta((value) => Number(value) + 1)}
            aria-label="Increase adjustment"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="label">Reason or note</span>
          <textarea
            className="input min-h-28 resize-y"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Cycle count correction, damaged item, customer return..."
          />
        </label>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Apply Adjustment
          </button>
        </div>
      </form>
    </Modal>
  );
}

