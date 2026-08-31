import { X } from "lucide-react";
export function Modal({title,description,onClose,children}:{title:string;description?:string;onClose:()=>void;children:React.ReactNode}){
  return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <header><div><h2>{title}</h2>{description&&<p>{description}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X/></button></header>
      {children}
    </section>
  </div>;
}
