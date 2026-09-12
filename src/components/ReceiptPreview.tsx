import { Paperclip } from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export function ReceiptPreview({ path, label = "Evidência ou comprovante" }: { path: string; label?: string }) {
  const [url, setUrl] = useState("");
  async function load() {
    if (url) return url;
    const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 60);
    const signedUrl = data?.signedUrl ?? "";
    setUrl(signedUrl);
    return signedUrl;
  }
  async function openOnClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (url) return;
    event.preventDefault();
    const popup = window.open("about:blank", "_blank");
    const signedUrl = await load();
    if (signedUrl && popup) {
      popup.opener = null;
      popup.location.href = signedUrl;
    } else {
      popup?.close();
    }
  }
  return <a className="receipt-preview" href={url || undefined} target="_blank" rel="noreferrer"
    aria-label={label} title={label} onMouseEnter={() => void load()} onFocus={() => void load()}
    onClick={event => void openOnClick(event)}>
    <Paperclip />
    {url && /\.(png|jpe?g|webp)$/i.test(path) && <img src={url} alt={label} />}
  </a>;
}
