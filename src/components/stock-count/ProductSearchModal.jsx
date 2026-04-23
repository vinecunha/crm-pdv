import React, { useState } from 'react'
import { Search, Package } from '@lib/icons'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'

const ProductSearchModal = ({
  isOpen,
  onClose,
  products,
  sessionItems,
  onAddProduct,
  searchTerm,
  setSearchTerm
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
    p.code?.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(localSearchTerm.toLowerCase())
  ).slice(0, 10)

  const handleClose = () => {
    setLocalSearchTerm('')
    setSearchTerm('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adicionar Produto à Contagem"
      size="lg"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, código ou código de barras..."
            value={localSearchTerm}
            onChange={(e) => {
              setLocalSearchTerm(e.target.value)
              setSearchTerm(e.target.value)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
            autoFocus
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredProducts.length === 0 && localSearchTerm ? (
            <p className="text-center text-gray-500 py-8 dark:text-gray-400">Nenhum produto encontrado</p>
          ) : filteredProducts.length > 0 ? (
            <div className="space-y-2">
              {filteredProducts.map(product => {
                const alreadyAdded = sessionItems.some(item => item.product_id === product.id)
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-900 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <Package size={20} className="text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="font-medium dark:text-white">{product.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {product.code} | Estoque: {product.stock_quantity} {product.unit}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={alreadyAdded ? 'outline' : 'primary'}
                      disabled={alreadyAdded}
                      onClick={() => onAddProduct(product)}
                    >
                      {alreadyAdded ? 'Já Adicionado' : 'Adicionar'}
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8 dark:text-gray-400">Digite para buscar produtos</p>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ProductSearchModal
