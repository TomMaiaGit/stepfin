import { supabase } from "../lib/supabase";
export async function loadFinanceOptions(groupId:string){
  const [accounts,cards,categories]=await Promise.all([
    supabase.from("financial_accounts").select("id,name,account_type,is_active").eq("group_id",groupId).eq("is_active",true).order("name"),
    supabase.from("cards").select("id,name,card_type,is_active").eq("group_id",groupId).eq("is_active",true).order("name"),
    supabase.from("categories").select("id,name,kind").or(`group_id.is.null,group_id.eq.${groupId}`).order("name")
  ]);
  return {accounts:accounts.data??[],cards:cards.data??[],categories:categories.data??[]};
}

