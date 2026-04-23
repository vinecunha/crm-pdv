import React from 'react'
import { Banknote, CreditCard, QrCode, CheckCircle } from '@lib/icons'

const VisaIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M9.5 8.5L7 15h2.5l1.5-6.5H9.5zM15 8.5c-.6 0-1.1.3-1.4.8l-.1-.8h-2.3l-1.5 6.5h2.4l.5-2c.3-.8 1-1.3 1.8-1.3.5 0 .7.1.7.3 0 .2-.1.5-.2.8l-.6 2.2H17l1.4-6.5H15zM20.5 8.5L19 15h2.5l1.5-6.5h-2.5zM4.5 8.5L2 15h2.5l1.5-6.5H4.5z" />
  </svg>
)

const MastercardIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <circle cx="9" cy="12" r="6" fill="#EB001B" />
    <circle cx="15" cy="12" r="6" fill="#F79E1B" />
    <circle cx="12" cy="12" r="3" fill="#FF5F00" />
  </svg>
)

const EloIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="#00A4E0"/>
    <path d="M9 9l-3 3 3 3 3-3-3-3z" fill="#FFCB05"/>
    <path d="M15 9l-3 3 3 3 3-3-3-3z" fill="#ED1C24"/>
  </svg>
)

const PaymentMethodSelector = ({ selected, onSelect }) => {
  const methods = [
    { 
      id: 'cash', 
      label: 'Dinheiro', 
      icon: Banknote,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      borderColor: 'border-green-500 dark:border-green-400',
      textColor: 'text-green-700 dark:text-green-300',
      iconColor: 'text-green-700 dark:text-green-400'
    },
    { 
      id: 'credit', 
      label: 'Crédito', 
      icon: CreditCard,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-500 dark:border-blue-400',
      textColor: 'text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-700 dark:text-blue-400',
      badges: [VisaIcon, MastercardIcon, EloIcon]
    },
    { 
      id: 'debit', 
      label: 'Débito', 
      icon: CreditCard,
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      borderColor: 'border-orange-500 dark:border-orange-400',
      textColor: 'text-orange-700 dark:text-orange-300',
      iconColor: 'text-orange-700 dark:text-orange-400',
      badges: [VisaIcon, MastercardIcon, EloIcon]
    },
    { 
      id: 'pix', 
      label: 'PIX', 
      icon: QrCode,
      color: 'teal',
      bgColor: 'bg-teal-50 dark:bg-teal-900/30',
      borderColor: 'border-teal-500 dark:border-teal-400',
      textColor: 'text-teal-700 dark:text-teal-300',
      iconColor: 'text-teal-700 dark:text-teal-400'
    }
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3 dark:text-gray-300">
        Forma de Pagamento
      </label>
      <div className="grid grid-cols-2 gap-3">
        {methods.map(({ id, label, icon: Icon, bgColor, borderColor, textColor, iconColor, badges }) => {
          const isSelected = selected === id
          
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`
                p-4 rounded-xl border-2 transition-all relative
                ${isSelected 
                  ? `${borderColor} ${bgColor} shadow-md` 
                  : 'border-gray-200 hover:border-gray-300 bg-white dark:border-gray-700 dark:hover:border-gray-600 dark:bg-gray-900'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  ${isSelected ? bgColor : 'bg-gray-100 dark:bg-gray-800'}
                  transition-colors
                `}>
                  <Icon size={24} className={isSelected ? iconColor : 'text-gray-600 dark:text-gray-400'} />
                </div>
                
                <span className={`font-medium ${isSelected ? textColor : 'text-gray-700 dark:text-gray-300'}`}>
                  {label}
                </span>
                
                {badges && (
                  <div className="flex items-center gap-1 mt-1">
                    {badges.map((BadgeIcon, idx) => (
                      <div 
                        key={idx} 
                        className={`w-6 h-4 flex items-center justify-center ${isSelected ? textColor : 'text-gray-400 dark:text-gray-500'}`}
                      >
                        <BadgeIcon />
                      </div>
                    ))}
                  </div>
                )}
                
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md dark:bg-green-600">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <VisaIcon />
          <span>Visa</span>
        </div>
        <div className="flex items-center gap-1">
          <MastercardIcon />
          <span>Mastercard</span>
        </div>
        <div className="flex items-center gap-1">
          <EloIcon />
          <span>Elo</span>
        </div>
        <div className="flex items-center gap-1">
          <QrCode size={14} />
          <span>PIX</span>
        </div>
      </div>
    </div>
  )
}

export default PaymentMethodSelector
