import React from 'react'
import { Package, TrendingUp, TrendingDown } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

const SellerTopProducts = ({ products }) => {
  const maxRevenue = Math.max(...products.map(p => p.revenue), 1)
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Package size={20} />
        Produtos Mais Vendidos
      </h2>
      
      {products.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
          Nenhum produto vendido ainda
        </p>
      ) : (
        <div className="space-y-4">
          {products.slice(0, 5).map((product, index) => {
            const revenuePercentage = (product.revenue / maxRevenue) * 100
            
            return (
              <div key={product.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium w-6 ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-orange-400' :
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.salesCount} {product.salesCount === 1 ? 'venda' : 'vendas'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {product.quantity} un
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
                
                {/* Barra de proporção */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${revenuePercentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Resumo */}
      {products.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Total de produtos:</span>
            <span className="font-medium text-gray-900 dark:text-white">{products.length}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500 dark:text-gray-400">Quantidade total:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {products.reduce((sum, p) => sum + p.quantity, 0)} un
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerTopProducts
