// src/components/sales/pdv/ReceiptPrint.jsx
import React, { useEffect, useState } from 'react'
import { formatCurrency, formatDateTime } from '@utils/formatters'
import { fetchCompanySettings } from '@services/companyService'

const ReceiptPrint = ({ sale, customer, cart, paymentMethod, discount, profile }) => {
  const [company, setCompany] = useState(null)
  
  const receiptNumber = sale?.sale_number || `SALE-${Date.now()}`
  const subtotal = cart?.reduce((sum, item) => sum + (item.total || 0), 0) || 0
  const total = subtotal - (discount || 0)
  const date = new Date()

  useEffect(() => {
    const loadCompany = async () => {
      const settings = await fetchCompanySettings()
      console.log('🏢 Configurações da empresa carregadas:', settings)
      setCompany(settings)
    }
    loadCompany()
  }, [])

  // Valores da empresa (com fallback)
  const companyName = company?.company_name || 'LOJA PDV'
  const companyCnpj = company?.cnpj || '00.000.000/0001-00'
  const companyPhone = company?.phone || '(11) 99999-9999'
  const companyAddress = company?.address || 'Rua Exemplo, 123'
  const companyCityState = company?.city && company?.state 
    ? `${company.city}/${company.state}` 
    : 'Centro - SP'
  const companyZip = company?.zip_code || '00000-000'

  // Debug para verificar os dados recebidos
  console.log('📋 ReceiptPrint - Dados recebidos:', {
    sale,
    customer,
    cart,
    cartLength: cart?.length,
    paymentMethod,
    discount,
    profile
  })

  return (
    <div className="receipt-container">
      <style>{`
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
      `}</style>
      
      <div className="receipt-header">
        <div className="receipt-title">{companyName}</div>
        <div className="receipt-subtitle">CNPJ: {companyCnpj}</div>
        <div className="receipt-subtitle">{companyAddress}</div>
        <div className="receipt-subtitle">{companyCityState} - CEP: {companyZip}</div>
        <div className="receipt-subtitle">Tel: {companyPhone}</div>
      </div>
      
      <div className="receipt-divider"></div>
      
      <div className="receipt-info">
        <div className="receipt-row">
          <span>CUPOM:</span>
          <span className="font-bold">{receiptNumber}</span>
        </div>
        <div className="receipt-row">
          <span>DATA:</span>
          <span>{formatDateTime(date)}</span>
        </div>
        <div className="receipt-row">
          <span>VENDEDOR:</span>
          <span>{profile?.full_name || profile?.email || 'Sistema'}</span>
        </div>
        {customer && (
          <div className="receipt-row">
            <span>CLIENTE:</span>
            <span>{customer.name}</span>
          </div>
        )}
        {customer?.phone && (
          <div className="receipt-row">
            <span>CPF/TEL:</span>
            <span>{customer.phone}</span>
          </div>
        )}
      </div>
      
      <div className="receipt-divider"></div>
      
      <div className="receipt-items">
        <div className="receipt-item font-bold">
          <span className="receipt-item-name">ITEM</span>
          <span className="receipt-item-qty">QTD</span>
          <span className="receipt-item-price">VALOR</span>
        </div>
        
        {cart && cart.length > 0 ? (
          cart.map((item, index) => (
            <div key={index} className="receipt-item">
              <span className="receipt-item-name">
                {item.name}
                <br />
                <span className="text-sm">
                  {item.code || item.id} - {formatCurrency(item.price)} un
                </span>
              </span>
              <span className="receipt-item-qty">{item.quantity}x</span>
              <span className="receipt-item-price">{formatCurrency(item.total)}</span>
            </div>
          ))
        ) : (
          <div className="receipt-item text-center" style={{ justifyContent: 'center', padding: '10px 0' }}>
            <span style={{ color: '#999' }}>Nenhum item</span>
          </div>
        )}
      </div>
      
      <div className="receipt-divider"></div>
      
      <div className="receipt-total">
        <div className="receipt-row">
          <span>SUBTOTAL:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        
        {discount > 0 && (
          <div className="receipt-row">
            <span>DESCONTO:</span>
            <span>- {formatCurrency(discount)}</span>
          </div>
        )}
        
        <div className="receipt-row font-bold" style={{ fontSize: '14px', marginTop: '5px' }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      
      <div className="receipt-info" style={{ marginTop: '8px' }}>
        <div className="receipt-row">
          <span>PAGAMENTO:</span>
          <span>
            {paymentMethod === 'cash' ? 'DINHEIRO' : 
             paymentMethod === 'credit_card' ? 'CARTÃO DE CRÉDITO' : 
             paymentMethod === 'debit_card' ? 'CARTÃO DE DÉBITO' : 
             paymentMethod === 'pix' ? 'PIX' : 
             paymentMethod?.toUpperCase() || 'DINHEIRO'}
          </span>
        </div>
      </div>
      
      <div className="receipt-divider"></div>
      
      <div className="receipt-barcode">
        *{String(receiptNumber).replace(/\D/g, '')}*
      </div>
      
      <div className="receipt-footer">
        <div>Obrigado pela preferência!</div>
        <div>Volte sempre!</div>
        <div style={{ marginTop: '5px' }} className="text-sm">
          {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR')}
        </div>
      </div>
    </div>
  )
}

export default ReceiptPrint