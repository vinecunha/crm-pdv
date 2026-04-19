import React from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Phone } from '../../lib/icons'

const IdentifyCustomerModal = ({ 
  isOpen, 
  onClose, 
  phone, 
  onPhoneChange,
  onSearch,
  isLoading 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      onSearch()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Identificar Cliente" size="sm">
      <div className="space-y-4">
        {/* Ilustração */}
        <div className="text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <Phone size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
            Digite o telefone do cliente
          </p>
        </div>

        {/* Input de telefone */}
        <input
          type="tel"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full px-4 py-2.5 sm:py-3 text-base sm:text-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-center placeholder-gray-400 dark:placeholder-gray-500"
          autoFocus
          disabled={isLoading}
        />

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 order-2 sm:order-1"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onSearch} 
            loading={isLoading} 
            className="flex-1 order-1 sm:order-2"
          >
            Buscar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default IdentifyCustomerModal