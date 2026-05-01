import{r as L}from"./rolldown-runtime-Bnw7wDfq.js";import{M as q}from"./vendor-BpO4XCYx.js";import{Gn as I,b as z,it as M,l as k,nn as $,o as S}from"./vendor-react-C3n18kU3.js";import{t as l}from"./logger-Dmg4UtDp.js";import{t as D}from"./Button-CDtDLvJk.js";import{t as V}from"./Modal-DUXkZ5eb.js";import{m as B}from"./index-DGUSvZcF.js";import{r as F,t as b}from"./formatters-DEjn6nlV.js";import{t as U}from"./useSystemLogs-TzNPnnHx.js";import{n as H}from"./saleService-CudQ8XFB.js";var ae=(x,s={})=>{const t=k(),{logCreate:d,logError:i}=U(),{onSaleCreated:c,onSaleError:r,onOfflineSale:j}=s,y=S({mutationFn:({cart:n,customer:p,coupon:v,discount:m,paymentMethod:f})=>H(n,p,v,m,f,x),onSuccess:async n=>{await d("sale",n.id.toString(),{sale_number:n.sale_number,total_amount:n.total_amount,discount:n.discount_amount,final_amount:n.final_amount,mode:"online"}),t.invalidateQueries({queryKey:["products-active"]}),t.invalidateQueries({queryKey:["sales"]}),c?.(n)},onError:async n=>{await i("sale",n,{action:"create_sale"}),r?.(n)}}),u=S({mutationFn:({saleNumber:n,cancelledBy:p,approvedBy:v,reason:m,notes:f})=>(void 0)(n,p,v,m,f),onSuccess:async()=>{t.invalidateQueries({queryKey:["sales"]})}});return{createSaleMutation:y,cancelMutation:u,isPending:y.isPending||u.isPending}},E=L(q(),1),Q=async()=>{const{data:x,error:s}=await B.from("company_settings").select("*").limit(1).single();return s?(l.error("❌ Erro ao buscar configurações da empresa:",s),null):x},e=I(),G=({sale:x,customer:s,cart:t,paymentMethod:d,discount:i,profile:c})=>{const[r,j]=(0,E.useState)(null),y=x?.sale_number||`SALE-${Date.now()}`,u=t?.reduce((o,h)=>o+(h.total||0),0)||0,n=u-(i||0),p=new Date;(0,E.useEffect)(()=>{(async()=>{const h=await Q();l.log("🏢 Configurações da empresa carregadas:",h),j(h)})()},[]);const v=r?.company_name||"LOJA PDV",m=r?.cnpj||"00.000.000/0001-00",f=r?.phone||"(11) 99999-9999",w=r?.address||"Rua Exemplo, 123",N=r?.city&&r?.state?`${r.city}/${r.state}`:"Centro - SP",_=r?.zip_code||"00000-000";return l.log("📋 ReceiptPrint - Dados recebidos:",{sale:x,customer:s,cart:t,cartLength:t?.length,paymentMethod:d,discount:i,profile:c}),(0,e.jsxs)("div",{className:"receipt-container",children:[(0,e.jsx)("style",{children:`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .receipt-container {
            width: 80mm;
            padding: 5mm;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #000;
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        @media screen {
          .receipt-container {
            width: 80mm;
            padding: 5mm;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            background: white;
            color: #000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin: 0 auto;
          }
        }
        
        .receipt-header {
          text-align: center;
          margin-bottom: 10px;
        }
        
        .receipt-title {
          font-size: 16px;
          font-weight: bold;
          margin: 5px 0;
        }
        
        .receipt-subtitle {
          font-size: 11px;
          margin: 2px 0;
        }
        
        .receipt-divider {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        
        .receipt-info {
          margin: 8px 0;
        }
        
        .receipt-row {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }
        
        .receipt-items {
          margin: 8px 0;
          width: 100%;
        }
        
        .receipt-item {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
          font-size: 11px;
        }
        
        .receipt-item-name {
          flex: 2;
        }
        
        .receipt-item-qty {
          width: 30px;
          text-align: right;
        }
        
        .receipt-item-price {
          width: 70px;
          text-align: right;
        }
        
        .receipt-total {
          margin-top: 8px;
          font-weight: bold;
        }
        
        .receipt-footer {
          text-align: center;
          margin-top: 15px;
          font-size: 11px;
        }
        
        .receipt-barcode {
          text-align: center;
          margin: 10px 0;
          font-size: 20px;
          letter-spacing: 2px;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        .font-bold {
          font-weight: bold;
        }
        
        .text-sm {
          font-size: 10px;
        }
      `}),(0,e.jsxs)("div",{className:"receipt-header",children:[(0,e.jsx)("div",{className:"receipt-title",children:v}),(0,e.jsxs)("div",{className:"receipt-subtitle",children:["CNPJ: ",m]}),(0,e.jsx)("div",{className:"receipt-subtitle",children:w}),(0,e.jsxs)("div",{className:"receipt-subtitle",children:[N," - CEP: ",_]}),(0,e.jsxs)("div",{className:"receipt-subtitle",children:["Tel: ",f]})]}),(0,e.jsx)("div",{className:"receipt-divider"}),(0,e.jsxs)("div",{className:"receipt-info",children:[(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"CUPOM:"}),(0,e.jsx)("span",{className:"font-bold",children:y})]}),(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"DATA:"}),(0,e.jsx)("span",{children:F(p)})]}),(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"VENDEDOR:"}),(0,e.jsx)("span",{children:c?.full_name||c?.email||"Sistema"})]}),s&&(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"CLIENTE:"}),(0,e.jsx)("span",{children:s.name})]}),s?.phone&&(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"CPF/TEL:"}),(0,e.jsx)("span",{children:s.phone})]})]}),(0,e.jsx)("div",{className:"receipt-divider"}),(0,e.jsxs)("div",{className:"receipt-items",children:[(0,e.jsxs)("div",{className:"receipt-item font-bold",children:[(0,e.jsx)("span",{className:"receipt-item-name",children:"ITEM"}),(0,e.jsx)("span",{className:"receipt-item-qty",children:"QTD"}),(0,e.jsx)("span",{className:"receipt-item-price",children:"VALOR"})]}),t&&t.length>0?t.map((o,h)=>(0,e.jsxs)("div",{className:"receipt-item",children:[(0,e.jsxs)("span",{className:"receipt-item-name",children:[o.name,(0,e.jsx)("br",{}),(0,e.jsxs)("span",{className:"text-sm",children:[o.code||o.id," - ",b(o.price)," un"]})]}),(0,e.jsxs)("span",{className:"receipt-item-qty",children:[o.quantity,"x"]}),(0,e.jsx)("span",{className:"receipt-item-price",children:b(o.total)})]},h)):(0,e.jsx)("div",{className:"receipt-item text-center",style:{justifyContent:"center",padding:"10px 0"},children:(0,e.jsx)("span",{style:{color:"#999"},children:"Nenhum item"})})]}),(0,e.jsx)("div",{className:"receipt-divider"}),(0,e.jsxs)("div",{className:"receipt-total",children:[(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"SUBTOTAL:"}),(0,e.jsx)("span",{children:b(u)})]}),i>0&&(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"DESCONTO:"}),(0,e.jsxs)("span",{children:["- ",b(i)]})]}),(0,e.jsxs)("div",{className:"receipt-row font-bold",style:{fontSize:"14px",marginTop:"5px"},children:[(0,e.jsx)("span",{children:"TOTAL:"}),(0,e.jsx)("span",{children:b(n)})]})]}),(0,e.jsx)("div",{className:"receipt-info",style:{marginTop:"8px"},children:(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"PAGAMENTO:"}),(0,e.jsx)("span",{children:d==="cash"?"DINHEIRO":d==="credit_card"?"CARTÃO DE CRÉDITO":d==="debit_card"?"CARTÃO DE DÉBITO":d==="pix"?"PIX":d?.toUpperCase()||"DINHEIRO"})]})}),(0,e.jsx)("div",{className:"receipt-divider"}),(0,e.jsxs)("div",{className:"receipt-barcode",children:["*",String(y).replace(/\D/g,""),"*"]}),(0,e.jsxs)("div",{className:"receipt-footer",children:[(0,e.jsx)("div",{children:"Obrigado pela preferência!"}),(0,e.jsx)("div",{children:"Volte sempre!"}),(0,e.jsxs)("div",{style:{marginTop:"5px"},className:"text-sm",children:[p.toLocaleDateString("pt-BR")," ",p.toLocaleTimeString("pt-BR")]})]})]})},re=({isOpen:x,onClose:s,sale:t,customer:d,cart:i,items:c=[],paymentMethod:r,discount:j,profile:y,isLoading:u=!1,title:n="Recibo da Venda"})=>{const p=(0,E.useRef)(null);l.log("🔍 DEBUG COMPLETO:",{"cart (PDV)":i,"cart type":typeof i,"cart isArray":Array.isArray(i),"cart length":i?.length,"items (SalesList)":c,"items length":c?.length,sale:t});const m=i&&Array.isArray(i)&&i.length>0?(l.log("✅ PDV: Usando cart com",i.length,"itens"),i):c&&Array.isArray(c)&&c.length>0?(l.log("✅ SalesList: Convertendo",c.length,"itens"),c.map(a=>(l.log("   Convertendo item:",a),{id:a.product_id||a.id,name:a.product_name||a.name,code:a.product_code||a.code||a.product_id,price:Number(a.unit_price)||0,quantity:Number(a.quantity)||0,total:Number(a.total_price)||0}))):(l.warn("❌ NENHUM ITEM ENCONTRADO!"),[]);l.log("🛒 cartItems final:",m,"| length:",m.length);const f=d||(t?.customer_name?{name:t.customer_name,phone:t.customer_phone}:null),w=y||{full_name:t?.created_by_user?.full_name||t?.created_by_user?.email||t?.created_by||"Sistema"},N=t||{sale_number:`VENDA-${Date.now()}`,final_amount:m.reduce((a,C)=>a+(C.total||0),0),discount_amount:j||0,payment_method:r||"cash"},_=j!==void 0?j:t?.discount_amount||0,o=r||t?.payment_method||"cash",h=t?.status==="cancelled",T=()=>{const a=p.current,C=document.title;if(!a){l.error("❌ Conteúdo do recibo não encontrado");return}const g=window.open("","_blank","width=400,height=600");if(!g){l.error("❌ Popup bloqueado. Permita popups para imprimir."),alert("Popups bloqueados. Permita popups para este site.");return}const P=document.querySelectorAll('style, link[rel="stylesheet"]'),O=a.innerHTML;g.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - ${N.sale_number}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${Array.from(P).map(R=>R.outerHTML).join(`
`)}
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
              background: white;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
            .cancelled-stamp {
              color: #dc2626;
              border: 2px solid #dc2626;
              padding: 5px 10px;
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              margin-top: 10px;
              width: 80mm;
              margin-left: auto;
              margin-right: auto;
            }
          </style>
        </head>
        <body>
          ${O}
          ${h?`
            <div class="cancelled-stamp">
              ⚠️ VENDA CANCELADA
            </div>
            <div style="width:80mm; margin:8px auto; font-family:'Courier New',monospace; font-size:11px;">
              <div style="display:flex; justify-content:space-between;">
                <span>Cancelado em:</span>
                <span>${t.cancelled_at?new Date(t.cancelled_at).toLocaleString("pt-BR"):"-"}</span>
              </div>
              ${t.cancellation_reason?`
                <div style="display:flex; justify-content:space-between; margin-top:3px;">
                  <span>Motivo:</span>
                  <span>${t.cancellation_reason}</span>
                </div>
              `:""}
            </div>
          `:""}
        </body>
      </html>
    `),g.document.close(),g.onload=()=>{g.focus(),g.print(),g.onafterprint=()=>{g.close(),document.title=C}}},A=()=>{T()};return(0,e.jsx)(V,{isOpen:x,onClose:s,title:n,size:"md",children:(0,e.jsxs)("div",{className:"space-y-4",children:[u?(0,e.jsxs)("div",{className:"text-center py-8",children:[(0,e.jsx)("div",{className:"w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"}),(0,e.jsx)("p",{className:"text-gray-500 dark:text-gray-400 mt-2",children:"Carregando itens..."})]}):(0,e.jsx)("div",{className:"bg-gray-100 dark:bg-gray-800 p-4 rounded-lg",children:(0,e.jsx)("div",{ref:p,children:(0,e.jsx)(G,{sale:N,customer:f,cart:m,paymentMethod:o,discount:_,profile:w})})}),(0,e.jsxs)("div",{className:"no-print flex gap-3 justify-end",children:[(0,e.jsx)(D,{variant:"outline",onClick:s,icon:z,children:"Fechar"}),(0,e.jsx)(D,{variant:"outline",onClick:A,icon:$,children:"Salvar PDF"}),(0,e.jsx)(D,{variant:"primary",onClick:T,icon:M,disabled:u,children:"Imprimir Recibo"})]})]})})};export{ae as n,re as t};
