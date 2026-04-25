import{r as I}from"./rolldown-runtime-Bnw7wDfq.js";import{Ht as z,Pn as M,W as $,Wn as V,jn as A,qn as k,s as B}from"./vendor-react-BEGRcE8n.js";import{t as v}from"./supabase-Cf0crJYc.js";import{t as u}from"./logger-CHh1fvD2.js";import{t as D}from"./Button-DVDKwIl1.js";import{t as U}from"./Modal-BmHHn6Zk.js";import{p as F}from"./index-BzYUJKQ0.js";import{r as H,t as N}from"./formatters-BK1OIcRT.js";import{t as Q}from"./useSystemLogs-BMZjCV1s.js";import{r as J}from"./notificationService-vDtDwFHU.js";import{i as G}from"./goalService-B7QlHQRi.js";var K=!1,R=()=>"create_sale";console.log("🔥 saleService inicializado:",{mode:"production",isProd:!0,isDev:!1,USE_TEST_RPC:K,currentRPC:R()});var de=async()=>{console.log("🔥 fetchProducts chamado");const{data:i,error:a}=await v.from("products").select("*").eq("is_active",!0).gt("stock_quantity",0).order("name");if(console.log("📦 fetchProducts resultado:",{data:i,error:a}),a)throw console.error("❌ Erro fetchProducts:",a),a;return i||[]},pe=async i=>{if(!i)return console.log("❌ fetchAvailableCoupons: customerId não fornecido"),[];const a=new Date().toISOString();console.log("🔍 Buscando cupons disponíveis para:",{customerId:i,today:a});try{const[t,r]=await Promise.all([v.from("coupons").select("*").eq("is_active",!0).eq("is_global",!0).lte("valid_from",a).or(`valid_to.is.null,valid_to.gte.${a}`),v.from("coupon_allowed_customers").select("coupon_id").eq("customer_id",i)]);t.error&&console.error("❌ Erro ao buscar cupons globais:",t.error),r.error&&console.error("❌ Erro ao buscar permissões de cupons:",r.error);let s=[];if(r.data?.length){const n=r.data.map(g=>g.coupon_id),{data:m,error:h}=await v.from("coupons").select("*").eq("is_active",!0).in("id",n).lte("valid_from",a).or(`valid_to.is.null,valid_to.gte.${a}`);h?console.error("❌ Erro ao buscar cupons específicos:",h):s=m||[]}const o=[...t.data||[],...s];return console.log(`✅ ${o.length} cupons encontrados:`,{globais:t.data?.length||0,especificos:s.length}),o}catch(t){return console.error("❌ Erro inesperado em fetchAvailableCoupons:",t),[]}},me=async i=>{const{data:a,error:t}=await v.from("customers").select("*").eq("phone",i.replace(/\D/g,"")).maybeSingle();if(t)throw t;return a},ue=async i=>{const a=F(i),{data:t,error:r}=await v.from("customers").insert([{...a,phone:a.phone.replace(/\D/g,""),status:"active",total_purchases:0}]).select().single();if(r)throw r;return t},he=async(i,a,t)=>{const{data:r,error:s}=await v.from("coupons").select("*").eq("code",i.toUpperCase()).eq("is_active",!0).single();if(s)throw new Error("Cupom inválido");const o=new Date;if(r.valid_from&&o<new Date(r.valid_from))throw new Error("Cupom ainda não está válido");if(r.valid_to&&o>new Date(r.valid_to))throw new Error("Cupom expirado");if(r.usage_limit&&r.used_count>=r.usage_limit)throw new Error("Cupom esgotado");if(t<(r.min_purchase||0))throw new Error(`Valor mínimo: ${N(r.min_purchase)}`);if(!r.is_global){const{data:m}=await v.from("coupon_allowed_customers").select("*").eq("coupon_id",r.id).eq("customer_id",a).maybeSingle();if(!m)throw new Error("Cupom não disponível para este cliente")}let n=r.discount_type==="percent"?t*r.discount_value/100:r.discount_value;return r.discount_type==="percent"&&r.max_discount&&(n=Math.min(n,r.max_discount)),n=Math.min(n,t),{coupon:r,discountValue:n}},W=async(i,a,t,r,s,o)=>{try{const n=R();console.log(`
=== SALESERVICE - DADOS RECEBIDOS ===`),console.log("customer?.id:",a?.id),console.log("profile?.id:",o?.id),console.log("RPC_NAME:",n),console.log("Ambiente:","production");const m=i.reduce((_,b)=>_+b.total,0),h=m-r,g=i.map(_=>({product_id:_.id,quantity:_.quantity,unit_price:_.price})),c={p_customer_id:a?.id||null,p_created_by:o?.id,p_items:g,p_payment_method:s,p_discount_amount:r,p_coupon_code:t?.code||null,p_notes:null};console.log("rpcParams:",JSON.stringify(c,null,2)),console.log(`=====================================
`);const{data:l,error:x}=await v.rpc(n,c);if(console.log("RPC data:",l),console.log("RPC error:",x),x)throw u.error("❌ Erro na RPC:",x),x;if(!l)throw u.error("❌ RPC retornou null/undefined"),new Error("Erro ao criar venda: resposta vazia");if(l.error)throw u.error("❌ RPC retornou erro:",l),new Error(l.error);u.log("✅ Venda criada com sucesso:",l),l&&o?.id&&await G(o.id,l.final_amount);const d=l,f={id:d.id,sale_number:d.sale_number,total_amount:d.total_amount||m,discount_amount:d.discount_amount||r,final_amount:d.final_amount||h};if(f.final_amount>=500)try{await J(f,o?.full_name||"Vendedor")}catch(_){u.warn("⚠️ Erro ao notificar venda:",_)}return f}catch(n){throw u.error("❌ Erro em createSale:",n),n}},ge=(i,a={})=>{const t=M(),{logCreate:r,logError:s}=Q(),{onSaleCreated:o,onSaleError:n,onOfflineSale:m}=a,h=A({mutationFn:({cart:c,customer:l,coupon:x,discount:d,paymentMethod:f})=>W(c,l,x,d,f,i),onSuccess:async c=>{await r("sale",c.id.toString(),{sale_number:c.sale_number,total_amount:c.total_amount,discount:c.discount_amount,final_amount:c.final_amount,mode:"online"}),t.invalidateQueries({queryKey:["products-active"]}),t.invalidateQueries({queryKey:["sales"]}),o?.(c)},onError:async c=>{await s("sale",c,{action:"create_sale"}),n?.(c)}}),g=A({mutationFn:({saleNumber:c,cancelledBy:l,approvedBy:x,reason:d,notes:f})=>(void 0)(c,l,x,d,f),onSuccess:async()=>{t.invalidateQueries({queryKey:["sales"]})}});return{createSaleMutation:h,cancelMutation:g,isPending:h.isPending||g.isPending}},P=I(k(),1),X=async()=>{const{data:i,error:a}=await v.from("company_settings").select("*").limit(1).single();return a?(console.error("❌ Erro ao buscar configurações da empresa:",a),null):i},e=V(),Y=({sale:i,customer:a,cart:t,paymentMethod:r,discount:s,profile:o})=>{const[n,m]=(0,P.useState)(null),h=i?.sale_number||`SALE-${Date.now()}`,g=t?.reduce((y,w)=>y+(w.total||0),0)||0,c=g-(s||0),l=new Date;(0,P.useEffect)(()=>{(async()=>{const w=await X();console.log("🏢 Configurações da empresa carregadas:",w),m(w)})()},[]);const x=n?.company_name||"LOJA PDV",d=n?.cnpj||"00.000.000/0001-00",f=n?.phone||"(11) 99999-9999",_=n?.address||"Rua Exemplo, 123",b=n?.city&&n?.state?`${n.city}/${n.state}`:"Centro - SP",C=n?.zip_code||"00000-000";return console.log("📋 ReceiptPrint - Dados recebidos:",{sale:i,customer:a,cart:t,cartLength:t?.length,paymentMethod:r,discount:s,profile:o}),(0,e.jsxs)("div",{className:"receipt-container",children:[(0,e.jsx)("style",{children:`
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
      `}),(0,e.jsxs)("div",{className:"receipt-header",children:[(0,e.jsx)("div",{className:"receipt-title",children:x}),(0,e.jsxs)("div",{className:"receipt-subtitle",children:["CNPJ: ",d]}),(0,e.jsx)("div",{className:"receipt-subtitle",children:_}),(0,e.jsxs)("div",{className:"receipt-subtitle",children:[b," - CEP: ",C]}),(0,e.jsxs)("div",{className:"receipt-subtitle",children:["Tel: ",f]})]}),(0,e.jsx)("div",{className:"receipt-divider"}),(0,e.jsxs)("div",{className:"receipt-info",children:[(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"CUPOM:"}),(0,e.jsx)("span",{className:"font-bold",children:h})]}),(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"DATA:"}),(0,e.jsx)("span",{children:H(l)})]}),(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"VENDEDOR:"}),(0,e.jsx)("span",{children:o?.full_name||o?.email||"Sistema"})]}),a&&(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"CLIENTE:"}),(0,e.jsx)("span",{children:a.name})]}),a?.phone&&(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"CPF/TEL:"}),(0,e.jsx)("span",{children:a.phone})]})]}),(0,e.jsx)("div",{className:"receipt-divider"}),(0,e.jsxs)("div",{className:"receipt-items",children:[(0,e.jsxs)("div",{className:"receipt-item font-bold",children:[(0,e.jsx)("span",{className:"receipt-item-name",children:"ITEM"}),(0,e.jsx)("span",{className:"receipt-item-qty",children:"QTD"}),(0,e.jsx)("span",{className:"receipt-item-price",children:"VALOR"})]}),t&&t.length>0?t.map((y,w)=>(0,e.jsxs)("div",{className:"receipt-item",children:[(0,e.jsxs)("span",{className:"receipt-item-name",children:[y.name,(0,e.jsx)("br",{}),(0,e.jsxs)("span",{className:"text-sm",children:[y.code||y.id," - ",N(y.price)," un"]})]}),(0,e.jsxs)("span",{className:"receipt-item-qty",children:[y.quantity,"x"]}),(0,e.jsx)("span",{className:"receipt-item-price",children:N(y.total)})]},w)):(0,e.jsx)("div",{className:"receipt-item text-center",style:{justifyContent:"center",padding:"10px 0"},children:(0,e.jsx)("span",{style:{color:"#999"},children:"Nenhum item"})})]}),(0,e.jsx)("div",{className:"receipt-divider"}),(0,e.jsxs)("div",{className:"receipt-total",children:[(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"SUBTOTAL:"}),(0,e.jsx)("span",{children:N(g)})]}),s>0&&(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"DESCONTO:"}),(0,e.jsxs)("span",{children:["- ",N(s)]})]}),(0,e.jsxs)("div",{className:"receipt-row font-bold",style:{fontSize:"14px",marginTop:"5px"},children:[(0,e.jsx)("span",{children:"TOTAL:"}),(0,e.jsx)("span",{children:N(c)})]})]}),(0,e.jsx)("div",{className:"receipt-info",style:{marginTop:"8px"},children:(0,e.jsxs)("div",{className:"receipt-row",children:[(0,e.jsx)("span",{children:"PAGAMENTO:"}),(0,e.jsx)("span",{children:r==="cash"?"DINHEIRO":r==="credit_card"?"CARTÃO DE CRÉDITO":r==="debit_card"?"CARTÃO DE DÉBITO":r==="pix"?"PIX":r?.toUpperCase()||"DINHEIRO"})]})}),(0,e.jsx)("div",{className:"receipt-divider"}),(0,e.jsxs)("div",{className:"receipt-barcode",children:["*",String(h).replace(/\D/g,""),"*"]}),(0,e.jsxs)("div",{className:"receipt-footer",children:[(0,e.jsx)("div",{children:"Obrigado pela preferência!"}),(0,e.jsx)("div",{children:"Volte sempre!"}),(0,e.jsxs)("div",{style:{marginTop:"5px"},className:"text-sm",children:[l.toLocaleDateString("pt-BR")," ",l.toLocaleTimeString("pt-BR")]})]})]})},xe=({isOpen:i,onClose:a,sale:t,customer:r,cart:s,items:o=[],paymentMethod:n,discount:m,profile:h,isLoading:g=!1,title:c="Recibo da Venda"})=>{const l=(0,P.useRef)(null);u.log("🔍 DEBUG COMPLETO:",{"cart (PDV)":s,"cart type":typeof s,"cart isArray":Array.isArray(s),"cart length":s?.length,"items (SalesList)":o,"items length":o?.length,sale:t});const d=s&&Array.isArray(s)&&s.length>0?(u.log("✅ PDV: Usando cart com",s.length,"itens"),s):o&&Array.isArray(o)&&o.length>0?(u.log("✅ SalesList: Convertendo",o.length,"itens"),o.map(p=>(u.log("   Convertendo item:",p),{id:p.product_id||p.id,name:p.product_name||p.name,code:p.product_code||p.code||p.product_id,price:Number(p.unit_price)||0,quantity:Number(p.quantity)||0,total:Number(p.total_price)||0}))):(console.warn("❌ NENHUM ITEM ENCONTRADO!"),[]);u.log("🛒 cartItems final:",d,"| length:",d.length);const f=r||(t?.customer_name?{name:t.customer_name,phone:t.customer_phone}:null),_=h||{full_name:t?.created_by_user?.full_name||t?.created_by_user?.email||t?.created_by||"Sistema"},b=t||{sale_number:`VENDA-${Date.now()}`,final_amount:d.reduce((p,E)=>p+(E.total||0),0),discount_amount:m||0,payment_method:n||"cash"},C=m!==void 0?m:t?.discount_amount||0,y=n||t?.payment_method||"cash",w=t?.status==="cancelled",S=()=>{const p=l.current,E=document.title;if(!p){u.error("❌ Conteúdo do recibo não encontrado");return}const j=window.open("","_blank","width=400,height=600");if(!j){u.error("❌ Popup bloqueado. Permita popups para imprimir."),alert("Popups bloqueados. Permita popups para este site.");return}const q=document.querySelectorAll('style, link[rel="stylesheet"]'),O=p.innerHTML;j.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - ${b.sale_number}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${Array.from(q).map(L=>L.outerHTML).join(`
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
    `),j.document.close(),j.onload=()=>{j.focus(),j.print(),j.onafterprint=()=>{j.close(),document.title=E}}},T=()=>{S()};return(0,e.jsx)(U,{isOpen:i,onClose:a,title:c,size:"md",children:(0,e.jsxs)("div",{className:"space-y-4",children:[g?(0,e.jsxs)("div",{className:"text-center py-8",children:[(0,e.jsx)("div",{className:"w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"}),(0,e.jsx)("p",{className:"text-gray-500 dark:text-gray-400 mt-2",children:"Carregando itens..."})]}):(0,e.jsx)("div",{className:"bg-gray-100 dark:bg-gray-800 p-4 rounded-lg",children:(0,e.jsx)("div",{ref:l,children:(0,e.jsx)(Y,{sale:b,customer:f,cart:d,paymentMethod:y,discount:C,profile:_})})}),(0,e.jsxs)("div",{className:"no-print flex gap-3 justify-end",children:[(0,e.jsx)(D,{variant:"outline",onClick:a,icon:B,children:"Fechar"}),(0,e.jsx)(D,{variant:"outline",onClick:T,icon:z,children:"Salvar PDF"}),(0,e.jsx)(D,{variant:"primary",onClick:S,icon:$,disabled:g,children:"Imprimir Recibo"})]})]})})};export{de as a,pe as i,ge as n,me as o,ue as r,he as s,xe as t};
