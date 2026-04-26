// src/components/sales/common/ReceiptModal.jsx
import React, { useRef } from 'react'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import { Printer, Download, X } from '@lib/icons'
import ReceiptPrint from '@components/sales/common/ReceiptPrint'
import { logger } from '@utils/logger'

/**
 * Modal de Recibo Unificado
 * Funciona tanto para PDV (cart no formato do carrinho) 
 * quanto para SalesList (items no formato da API)
 */
const ReceiptModal = ({ isOpen, onClose, sale, customer, cart, items = [], paymentMethod, discount, profile, isLoading = false, title = 'Recibo da Venda' }) => {
  
  const receiptRef = useRef(null)
  
  logger.log('🔍 DEBUG COMPLETO:', {
    'cart (PDV)': cart,
    'cart type': typeof cart,
    'cart isArray': Array.isArray(cart),
    'cart length': cart?.length,
    'items (SalesList)': items,
    'items length': items?.length,
    'sale': sale,
  })

  // Força uma verificação mais detalhada
  const getCartItems = () => {
    // Verificação explícita para PDV
    if (cart && Array.isArray(cart) && cart.length > 0) {
      logger.log('✅ PDV: Usando cart com', cart.length, 'itens')
      return cart
    }
    
    // Verificação explícita para SalesList
    if (items && Array.isArray(items) && items.length > 0) {
      logger.log('✅ SalesList: Convertendo', items.length, 'itens')
      return items.map(item => {
        logger.log('   Convertendo item:', item)
        return {
          id: item.product_id || item.id,
          name: item.product_name || item.name,
          code: item.product_code || item.code || item.product_id,
          price: Number(item.unit_price) || 0,
          quantity: Number(item.quantity) || 0,
          total: Number(item.total_price) || 0
        }
      })
    }
    
    logger.warn('❌ NENHUM ITEM ENCONTRADO!')
    return []
  }

  const cartItems = getCartItems()
  logger.log('🛒 cartItems final:', cartItems, '| length:', cartItems.length)
  
  // Constrói o objeto customer
  const customerData = customer || (sale?.customer_name ? {
    name: sale.customer_name,
    phone: sale.customer_phone
  } : null)

  // Constrói o objeto profile
  const profileData = profile || {
    full_name: sale?.created_by_user?.full_name || 
               sale?.created_by_user?.email || 
               sale?.created_by || 
               'Sistema'
  }

  // Constrói o objeto sale
  const saleData = sale || {
    sale_number: `VENDA-${Date.now()}`,
    final_amount: cartItems.reduce((sum, item) => sum + (item.total || 0), 0),
    discount_amount: discount || 0,
    payment_method: paymentMethod || 'cash'
  }

  const finalDiscount = discount !== undefined ? discount : (sale?.discount_amount || 0)
  const finalPaymentMethod = paymentMethod || sale?.payment_method || 'cash'
  
  // Verifica se a venda está cancelada
  const isCancelled = sale?.status === 'cancelled'

  const handlePrint = () => {
    const printContent = receiptRef.current
    const originalTitle = document.title
    
    if (!printContent) {
      logger.error('❌ Conteúdo do recibo não encontrado')
      return
    }

    const printWindow = window.open('', '_blank', 'width=400,height=600')
    
    if (!printWindow) {
      logger.error('❌ Popup bloqueado. Permita popups para imprimir.')
      alert('Popups bloqueados. Permita popups para este site.')
      return
    }

    const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
    const receiptHTML = printContent.innerHTML

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - ${saleData.sale_number}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${Array.from(styles).map(style => style.outerHTML).join('\n')}
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
          ${receiptHTML}
          ${isCancelled ? `
            <div class="cancelled-stamp">
              ⚠️ VENDA CANCELADA
            </div>
            <div style="width:80mm; margin:8px auto; font-family:'Courier New',monospace; font-size:11px;">
              <div style="display:flex; justify-content:space-between;">
                <span>Cancelado em:</span>
                <span>${sale.cancelled_at ? new Date(sale.cancelled_at).toLocaleString('pt-BR') : '-'}</span>
              </div>
              ${sale.cancellation_reason ? `
                <div style="display:flex; justify-content:space-between; margin-top:3px;">
                  <span>Motivo:</span>
                  <span>${sale.cancellation_reason}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </body>
      </html>
    `)

    printWindow.document.close()
    
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
      printWindow.onafterprint = () => {
        printWindow.close()
        document.title = originalTitle
      }
    }
  }

  const handleDownloadPDF = () => {
    handlePrint() // O diálogo de impressão já permite "Salvar como PDF"
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 dark:text-gray-400 mt-2">Carregando itens...</p>
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <div ref={receiptRef}>
              <ReceiptPrint
                sale={saleData}
                customer={customerData}
                cart={cartItems}
                paymentMethod={finalPaymentMethod}
                discount={finalDiscount}
                profile={profileData}
              />
            </div>
          </div>
        )}

        <div className="no-print flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} icon={X}>
            Fechar
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} icon={Download}>
            Salvar PDF
          </Button>
          <Button variant="primary" onClick={handlePrint} icon={Printer} disabled={isLoading}>
            Imprimir Recibo
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ReceiptModal
