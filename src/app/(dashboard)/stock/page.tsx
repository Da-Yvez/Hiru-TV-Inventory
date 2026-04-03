import { createClient } from "@/lib/supabase/server";
import StockClientView from "./StockClientView";

export default async function StockPage() {
  const supabase = await createClient();

  // 1. Fetch all Inventory Items
  const { data: items } = await supabase.from("inventory_items").select("*").order("part_name");

  // 2. Fetch all Transactions to calculate current sums
  const { data: transactions } = await supabase.from("stock_transactions").select("item_id, quantity, transaction_type");

  // Since we use the Ledger pattern, we compute the total stock on the server:
  // Current Stock = Sum(IN) - Sum(OUT)
  
  const computedItems = (items || []).map((item) => {
    let currentStock = 0;
    
    if (transactions) {
      transactions.forEach((tx) => {
        if (tx.item_id === item.id) {
          if (tx.transaction_type === "IN") currentStock += tx.quantity;
          if (tx.transaction_type === "OUT") currentStock -= tx.quantity;
        }
      });
    }

    return {
      ...item,
      count: currentStock, // dynamically computed sum for perfect accuracy
    };
  });

  return <StockClientView items={computedItems} />;
}
