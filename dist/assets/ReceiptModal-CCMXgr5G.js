import{r as L}from"./rolldown-runtime-Bnw7wDfq.js";import{M as I}from"./vendor-BpO4XCYx.js";import{Hn as M,b as z,en as $,l as V,o as A,rt as k}from"./vendor-react-RNFk1jVI.js";import{t as v}from"./supabase-DKQd0410.js";import{t as a}from"./logger-CHh1fvD2.js";import{t as D}from"./Button-CTaP4D6B.js";import{t as B}from"./Modal-CMQOGk4u.js";import{p as U}from"./index-GJqrySk3.js";import{r as F,t as N}from"./formatters-BK1OIcRT.js";import{t as H}from"./useSystemLogs-Dj4rCZgt.js";import{r as Q}from"./notificationService-R4oNMCaZ.js";import{i as J}from"./goalService-rYUv6GIJ.js";var G=()=>"create_sale",de=async()=>{a.log("🔥 fetchProducts chamado");const{data:s,error:n}=await v.from("products").select("*").eq("is_active",!0).gt("stock_quantity",0).order("name");if(a.log("📦 fetchProducts resultado:",{data:s,error:n}),n)throw a.error("❌ Erro fetchProducts:",n),n;return s||[]},pe=async s=>{if(!s)return a.log("❌ fetchAvailableCoupons: customerId não fornecido"),[];const n=new Date().toISOString();a.log("🔍 Buscando cupons disponíveis para:",{customerId:s,today:n});try{const[t,r]=await Promise.all([v.from("coupons").select("*").eq("is_active",!0).eq("is_global",!0).lte("valid_from",n).or(`valid_to.is.null,valid_to.gte.${n}`),v.from("coupon_allowed_customers").select("coupon_id").eq("customer_id",s)]);t.error&&a.error("❌ Erro ao buscar cupons globais:",t.error),r.error&&a.error("❌ Erro ao buscar permissões de cupons:",r.error);let c=[];if(r.data?.length){const i=r.data.map(g=>g.coupon_id),{data:u,error:h}=await v.from("coupons").select("*").eq("is_active",!0).in("id",i).lte("valid_from",n).or(`valid_to.is.null,valid_to.gte.${n}`);h?a.error("❌ Erro ao buscar cupons específicos:",h):c=u||[]}const o=[...t.data||[],...c];return a.log(`✅ ${o.length} cupons encontrados:`,{globais:t.data?.length||0,especificos:c.length}),o}catch(t){return a.error("❌ Erro inesperado em fetchAvailableCoupons:",t),[]}},me=async s=>{const{data:n,error:t}=await v.from("customers").select("*").eq("phone",s.replace(/\D/g,"")).maybeSingle();if(t)throw t;return n},ue=async s=>{const n=U(s),{data:t,error:r}=await v.from("customers").insert([{...n,phone:n.phone.replace(/\D/g,""),status:"active",total_purchases:0}]).select().single();if(r)throw r;return t},he=async(s,n,t)=>{const{data:r,error:c}=await v.from("coupons").select("*").eq("code",s.toUpperCase()).eq("is_active",!0).single();if(c)throw new Error("Cupom inválido");const o=new Date;if(r.valid_from&&o<new Date(r.valid_from))throw new Error("Cupom ainda não está válido");if(r.valid_to&&o>new Date(r.valid_to))throw new Error("Cupom expirado");if(r.usage_limit&&r.used_count>=r.usage_limit)throw new Error("Cupom esgotado");if(t<(r.min_purchase||0))throw new Error(`Valor mínimo: ${N(r.min_purchase)}`);if(!r.is_global){const{data:u}=await v.from("coupon_allowed_customers").select("*").eq("coupon_id",r.id).eq("customer_id",n).maybeSingle();if(!u)throw new Error("Cupom não disponível para este cliente")}let i=r.discount_type==="percent"?t*r.discount_value/100:r.discount_value;return r.discount_type==="percent"&&r.max_discount&&(i=Math.min(i,r.max_discount)),i=Math.min(i,t),{coupon:r,discountValue:i}},K=async(s,n,t,r,c,o)=>{try{const i=G();a.log(`
=== SALESERVICE - DADOS RECEBIDOS ===`),a.log("customer?.id:",n?.id),a.log("profile?.id:",o?.id),a.log("RPC_NAME:",i),a.log("Ambiente:","production");const u=s.reduce((_,b)=>_+b.total,0),h=u-r,g=s.map(_=>({product_id:_.id,quantity:_.quantity,unit_price:_.price})),l={p_customer_id:n?.id||null,p_created_by:o?.id,p_items:g,p_payment_method:c,p_discount_amount:r,p_coupon_code:t?.code||null,p_notes:null};a.log("rpcParams:",JSON.stringify(l,null,2)),a.log(`=====================================
`);const{data:d,error:x}=await v.rpc(i,l);if(a.log("RPC data:",d),a.log("RPC error:",x),x)throw a.error("❌ Erro na RPC:",x),x;if(!d)throw a.error("❌ RPC retornou null/undefined"),new Error("Erro ao criar venda: resposta vazia");if(d.error)throw a.error("❌ RPC retornou erro:",d),new Error(d.error);a.log("✅ Venda criada com sucesso:",d),d&&o?.id&&await J(o.id,d.final_amount);const p=d,f={id:p.id,sale_number:p.sale_number,total_amount:p.total_amount||u,discount_amount:p.discount_amount||r,final_amount:p.final_amount||h};if(f.final_amount>=500)try{await Q(f,o?.full_name||"Vendedor")}catch(_){a.warn("⚠️ Erro ao notificar venda:",_)}return f}catch(i){throw a.error("❌ Erro em createSale:",i),i}},ge=(s,n={})=>{const t=V(),{logCreate:r,logError:c}=H(),{onSaleCreated:o,onSaleError:i,onOfflineSale:u}=n,h=A({mutationFn:({cart:l,customer:d,coupon:x,discount:p,paymentMethod:f})=>K(l,d,x,p,f,s),onSuccess:async l=>{await r("sale",l.id.toString(),{sale_number:l.sale_number,total_amount:l.total_amount,discount:l.discount_amount,final_amount:l.final_amount,mode:"online"}),t.invalidateQueries({queryKey:["products-active"]}),t.invalidateQueries({queryKey:["sales"]}),o?.(l)},onError:async l=>{await c("sale",l,{action:"create_sale"}),i?.(l)}}),g=A({mutationFn:({saleNumber:l,cancelledBy:d,approvedBy:x,reason:p,notes:f})=>(void 0)(l,d,x,p,f),onSuccess:async()=>{t.invalidateQueries({queryKey:["sales"]})}});return{createSaleMutation:h,cancelMutation:g,isPending:h.isPending||g.isPending}},P=L(I(),1),X=async()=>{const{data:s,error:n}=await v.from("company_settings").select("*").limit(1).single();return n?(a.error("❌ Erro ao buscar configurações da empresa:",n),null):s},e=M(),W=({sale:s,customer:n,cart:t,paymentMethod:r,discount:c,profile:o})=>{const[i,u]=(0,P.useState)(null),h=s?.sale_number||`SALE-${Date.now()}`,g=t?.reduce((y,w)=>y+(w.total||0),0)||0,l=g-(c||0),d=new Date;(0,P.useEffect)(()=>{(async()=>{const w=await X();a.log("🏢 Configurações da empresa carregadas:",w),u(w)})()},[]);const x=i?.company_name||"LOJA PDV",p=i?.cnpj||"00.000.000/0001-00",f=i?.phone||"(11) 99999-9999",_=i?.address||"Rua Exemplo, 123",b=i?.city&&i?.state?`${i.city}/${i.state}`:"Centro - SP",C=i?.zip_code||"00000-000";return a.log("📋 ReceiptPrint - Dados recebidos:",{sale:s,customer:n,cart:t,cartLength:t?.length,paymentMethod:r,discount:c,profile:o}),(0,e.jsxs)("div",{className:"receipt-container",children:[(0,e.jsx)("style",{children:`
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
      `}),(0,e.jsxs)("div",{className:"receipt-header",children:[(0,e.jsx)("div",{className:"receipt-title",children:x}),(0,e.jsxs)("div",{className:"receipt-subtitle",children:["CNPJ: ",p]}),(0,e.jsx)("div",{className:"receipt-subtitle",children:_}),(0,e.jsxs)("div",{className:"receipt-subtitle",children:[b," - CEP: ",C]}),(0,e.jsxs)("div",{className:"receipt-subtitle",children:["Tel: ",f]})]}),(0,e.jsx)("div",{className:"receipt-divider"}),(0,e.jsxs)("div",{className:"receipt-info",children:[(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"CUPOM:"}),(0,e.jsx)("span",{className:"font-bold",children:h})]}),(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"DATA:"}),(0,e.jsx)("span",{children:F(d)})]}),(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"VENDEDOR:"}),(0,e.jsx)("span",{children:o?.full_name||o?.email||"Sistema"})]}),n&&(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"CLIENTE:"}),(0,e.jsx)("span",{children:n.name})]}),n?.phone&&(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"CPF/TEL:"}),(0,e.jsx)("span",{children:n.phone})]})]}),(0,e.jsx)("div",{className:"receipt-divider"}),(0,e.jsxs)("div",{className:"receipt-items",children:[(0,e.jsxs)("div",{className:"receipt-item font-bold",children:[(0,e.jsx)("span",{className:"receipt-item-name",children:"ITEM"}),(0,e.jsx)("span",{className:"receipt-item-qty",children:"QTD"}),(0,e.jsx)("span",{className:"receipt-item-price",children:"VALOR"})]}),t&&t.length>0?t.map((y,w)=>(0,e.jsxs)("div",{className:"receipt-item",children:[(0,e.jsxs)("span",{className:"receipt-item-name",children:[y.name,(0,e.jsx)("br",{}),(0,e.jsxs)("span",{className:"text-sm",children:[y.code||y.id," - ",N(y.price)," un"]})]}),(0,e.jsxs)("span",{className:"receipt-item-qty",children:[y.quantity,"x"]}),(0,e.jsx)("span",{className:"receipt-item-price",children:N(y.total)})]},w)):(0,e.jsx)("div",{className:"receipt-item text-center",style:{justifyContent:"center",padding:"10px 0"},children:(0,e.jsx)("span",{style:{color:"#999"},children:"Nenhum item"})})]}),(0,e.jsx)("div",{className:"receipt-divider"}),(0,e.jsxs)("div",{className:"receipt-total",children:[(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"SUBTOTAL:"}),(0,e.jsx)("span",{children:N(g)})]}),c>0&&(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"DESCONTO:"}),(0,e.jsxs)("span",{children:["- ",N(c)]})]}),(0,e.jsxs)("div",{className:"receipt-row font-bold",style:{fontSize:"14px",marginTop:"5px"},children:[(0,e.jsx)("span",{children:"TOTAL:"}),(0,e.jsx)("span",{children:N(l)})]})]}),(0,e.jsx)("div",{className:"receipt-info",style:{marginTop:"8px"},children:(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"PAGAMENTO:"}),(0,e.jsx)("span",{children:r==="cash"?"DINHEIRO":r==="credit_card"?"CARTÃO DE CRÉDITO":r==="debit_card"?"CARTÃO DE DÉBITO":r==="pix"?"PIX":r?.toUpperCase()||"DINHEIRO"})]})}),(0,e.jsx)("div",{className:"receipt-divider"}),(0,e.jsxs)("div",{className:"receipt-barcode",children:["*",String(h).replace(/\D/g,""),"*"]}),(0,e.jsxs)("div",{className:"receipt-footer",children:[(0,e.jsx)("div",{children:"Obrigado pela preferência!"}),(0,e.jsx)("div",{children:"Volte sempre!"}),(0,e.jsxs)("div",{style:{marginTop:"5px"},className:"text-sm",children:[d.toLocaleDateString("pt-BR")," ",d.toLocaleTimeString("pt-BR")]})]})]})},xe=({isOpen:s,onClose:n,sale:t,customer:r,cart:c,items:o=[],paymentMethod:i,discount:u,profile:h,isLoading:g=!1,title:l="Recibo da Venda"})=>{const d=(0,P.useRef)(null);a.log("🔍 DEBUG COMPLETO:",{"cart (PDV)":c,"cart type":typeof c,"cart isArray":Array.isArray(c),"cart length":c?.length,"items (SalesList)":o,"items length":o?.length,sale:t});const p=c&&Array.isArray(c)&&c.length>0?(a.log("✅ PDV: Usando cart com",c.length,"itens"),c):o&&Array.isArray(o)&&o.length>0?(a.log("✅ SalesList: Convertendo",o.length,"itens"),o.map(m=>(a.log("   Convertendo item:",m),{id:m.product_id||m.id,name:m.product_name||m.name,code:m.product_code||m.code||m.product_id,price:Number(m.unit_price)||0,quantity:Number(m.quantity)||0,total:Number(m.total_price)||0}))):(a.warn("❌ NENHUM ITEM ENCONTRADO!"),[]);a.log("🛒 cartItems final:",p,"| length:",p.length);const f=r||(t?.customer_name?{name:t.customer_name,phone:t.customer_phone}:null),_=h||{full_name:t?.created_by_user?.full_name||t?.created_by_user?.email||t?.created_by||"Sistema"},b=t||{sale_number:`VENDA-${Date.now()}`,final_amount:p.reduce((m,E)=>m+(E.total||0),0),discount_amount:u||0,payment_method:i||"cash"},C=u!==void 0?u:t?.discount_amount||0,y=i||t?.payment_method||"cash",w=t?.status==="cancelled",S=()=>{const m=d.current,E=document.title;if(!m){a.error("❌ Conteúdo do recibo não encontrado");return}const j=window.open("","_blank","width=400,height=600");if(!j){a.error("❌ Popup bloqueado. Permita popups para imprimir."),alert("Popups bloqueados. Permita popups para este site.");return}const T=document.querySelectorAll('style, link[rel="stylesheet"]'),q=m.innerHTML;j.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - ${b.sale_number}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${Array.from(T).map(O=>O.outerHTML).join(`
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
          ${q}
          ${w?`
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
    `),j.document.close(),j.onload=()=>{j.focus(),j.print(),j.onafterprint=()=>{j.close(),document.title=E}}},R=()=>{S()};return(0,e.jsx)(B,{isOpen:s,onClose:n,title:l,size:"md",children:(0,e.jsxs)("div",{className:"space-y-4",children:[g?(0,e.jsxs)("div",{className:"text-center py-8",children:[(0,e.jsx)("div",{className:"w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"}),(0,e.jsx)("p",{className:"text-gray-500 dark:text-gray-400 mt-2",children:"Carregando itens..."})]}):(0,e.jsx)("div",{className:"bg-gray-100 dark:bg-gray-800 p-4 rounded-lg",children:(0,e.jsx)("div",{ref:d,children:(0,e.jsx)(W,{sale:b,customer:f,cart:p,paymentMethod:y,discount:C,profile:_})})}),(0,e.jsxs)("div",{className:"no-print flex gap-3 justify-end",children:[(0,e.jsx)(D,{variant:"outline",onClick:n,icon:z,children:"Fechar"}),(0,e.jsx)(D,{variant:"outline",onClick:R,icon:$,children:"Salvar PDF"}),(0,e.jsx)(D,{variant:"primary",onClick:S,icon:k,disabled:g,children:"Imprimir Recibo"})]})]})})};export{de as a,pe as i,ge as n,me as o,ue as r,he as s,xe as t};
