import React from 'react'
import { Package, Search } from 'lucide-react'
import LazyImage from '../../ui/LazyImage'
import { formatCurrency } from '../../../utils/formatters'

const ProductGrid = ({ 
  products, 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory, 
  categories, 
  onAddToCart,
  searchInputRef 
}) => {
  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar produto por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto">
        {products.map(product => (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="bg-white rounded-lg shadow-sm p-4 text-left hover:shadow-md transition-all hover:scale-105"
          >
            {/* Imagem do produto com LazyImage */}
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 overflow-hidden">
              {product.image_url ? (
                <LazyImage
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full"
                  fallback={
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                      <Package size={24} className="text-blue-600" />
                    </div>
                  }
                />
              ) : (
                <Package size={24} className="text-blue-600" />
              )}
            </div>
            
            <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{product.code || 'Sem código'}</p>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-lg font-bold text-green-600">{formatCurrency(product.price)}</span>
              <span className="text-xs text-gray-500">
                Estoque: {product.stock_quantity} {product.unit}
              </span>
            </div>
          </button>
        ))}
        
        {products.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum produto encontrado</p>
          </div>
        )}
      </div>
    </>
  )
}

export default ProductGrid