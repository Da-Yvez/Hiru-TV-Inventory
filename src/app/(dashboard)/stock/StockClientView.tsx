"use client";

import { useState } from "react";
import { processStockTransaction } from "./actions";
import styles from "./page.module.css";

interface InventoryItem {
  id: string;
  part_name: string;
  category: string;
  reorder_threshold: number;
  count: number;
}

export default function StockClientView({ items }: { items: InventoryItem[] }) {
  const [txType, setTxType] = useState<"IN" | "OUT">("IN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    formData.append("txType", txType); // Add the tab state manually

    const res = await processStockTransaction(formData);
    
    if (res?.error) {
      setError(res.error);
    } else {
      (e.target as HTMLFormElement).reset(); // clear form
    }
    
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title gold-gradient-text">Item / In and Out</h1>
          <p className="page-subtitle">Track general inventory items using a simple IN/OUT transaction ledger.</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Main Table */}
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div>Part Name</div>
            <div>Category</div>
            <div>Current Stock</div>
            <div>Status</div>
          </div>
          
          <div className="tableBody">
            {items.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No items in the database. (Need to add items directly to 'inventory_items' table).
              </div>
            )}
            {items.map((item) => {
              const isLow = item.count <= item.reorder_threshold;
              return (
                <div key={item.id} className={styles.tableRow}>
                  <div>
                    <div className={styles.itemName}>{item.part_name}</div>
                  </div>
                  <div className="text-muted text-sm">{item.category}</div>
                  <div>
                    <span className={`${styles.stockCount} ${isLow ? styles.stockLow : ""}`}>
                      {item.count}
                    </span>
                  </div>
                  <div>
                    {isLow ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-active">In Stock</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Tool */}
        <div className={styles.toolPanel}>
          <h2 className={styles.toolTitle}>Record Transaction</h2>
          
          <div className={styles.transactionTabs}>
            <div 
              className={`${styles.tab} ${txType === "IN" ? styles.tabActiveIn : ""}`}
              onClick={() => setTxType("IN")}
            >
              ITEM IN
            </div>
            <div 
              className={`${styles.tab} ${txType === "OUT" ? styles.tabActiveOut : ""}`}
              onClick={() => setTxType("OUT")}
            >
              ITEM OUT
            </div>
          </div>
          
          {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

          <form className="flex flex-col gap-4" onSubmit={handleTransaction}>
            <div className="form-group">
              <label className="form-label">Item / Part</label>
              <select name="item_id" className="form-select form-input" required>
                <option value="">Select item...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.part_name} ({item.count} in stock)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input name="quantity" type="number" min="1" className="form-input" required placeholder="0" />
            </div>

            <div className="form-group">
              <label className="form-label">Note / Reference</label>
              <input name="notes" type="text" className="form-input" placeholder={txType === "IN" ? "e.g. Invoice #1234" : "e.g. Given to John D."} />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`btn w-full ${txType === "IN" ? styles.submitBtnIn : styles.submitBtnOut}`}
              style={{ color: "white", marginTop: "1rem" }}
            >
              {loading ? "Processing..." : (txType === "IN" ? "Add to Stock" : "Remove from Stock")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
