import { supabase } from "./supabase";

export const receiptAccept = "image/jpeg,image/png,image/webp,application/pdf";
const allowedReceiptTypes = new Set(receiptAccept.split(","));
const maxReceiptSize = 10 * 1024 * 1024;

export function receiptValidation(file: File) {
  if (file.size > maxReceiptSize) return "O arquivo deve ter no máximo 10 MB.";
  if (!allowedReceiptTypes.has(file.type)) return "Envie JPG, PNG, WebP ou PDF.";
  return "";
}

export async function uploadReceipt(groupId: string, entity: "transactions" | "bills", entityId: string, file: File) {
  const validation = receiptValidation(file);
  if (validation) return { path: null, error: validation };
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${groupId}/${entity}/${entityId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("receipts").upload(path, file);
  return error ? { path: null, error: error.message } : { path, error: "" };
}

export async function removeReceipt(path: string) {
  return supabase.storage.from("receipts").remove([path]);
}
