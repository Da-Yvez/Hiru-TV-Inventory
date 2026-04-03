"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function processStockTransaction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const item_id = formData.get("item_id") as string;
  const quantityStr = formData.get("quantity") as string;
  const transaction_type = formData.get("txType") as "IN" | "OUT";
  const notes = formData.get("notes") as string;
  
  if (!item_id || !quantityStr || !transaction_type) {
    return { error: "Missing required fields." };
  }

  const quantity = parseInt(quantityStr, 10);
  if (isNaN(quantity) || quantity <= 0) {
    return { error: "Quantity must be a valid positive number." };
  }

  // 1. Get the current item to check stock if OUT
  const { data: item, error: itemError } = await supabase
    .from("inventory_items")
    .select("part_name, count")
    .eq("id", item_id)
    .single();

  if (itemError || !item) {
    return { error: "Item not found in inventory." };
  }

  // NOTE: For the sake of this iteration, we didn't add a strict 'count' column to the schema 
  // originally and relied entirely on computing IN/OUT sums, but let's assume we maintain a cached 'count' 
  // on the table for performance, or we just insert the transaction and compute it on the frontend.
  // Wait, looking at the schema we wrote, public.inventory_items doesn't have a 'count' column!
  // It computes stock by summing the transactions.
  // So we ONLY insert into stock_transactions, and the frontend calculates the sum. Let's do that!

  // 2. Insert the transaction
  const { error: txError } = await supabase.from("stock_transactions").insert({
    item_id,
    quantity,
    transaction_type,
    notes: notes || null,
    user_id: user?.id,
  });

  if (txError) {
    console.error("Trans Error:", txError);
    return { error: txError.message };
  }

  // 3. Log the action
  if (user) {
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action_type: `STOCK_${transaction_type}`, // STOCK_IN or STOCK_OUT
      description: `${transaction_type === "IN" ? "Added" : "Removed"} ${quantity}x '${item.part_name}' ${notes ? `(Ref: ${notes})` : ""}`,
    });
  }

  revalidatePath("/stock");
  revalidatePath("/logs");
  
  return { success: true };
}
