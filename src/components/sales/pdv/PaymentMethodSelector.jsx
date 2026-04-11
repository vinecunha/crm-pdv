import React from 'react'
import { Banknote } from 'lucide-react'

// Ícone de Cartão de Crédito (SVG customizado)
const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
)

// Ícones customizados para bandeiras de cartão
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

const PixIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="8" fill="#32BCAD" />
    <path d="M9.5 8.5L7 15h2.5l1.5-6.5H9.5zM14.5 8.5L12 15h2.5l1.5-6.5h-1.5z" fill="white" />
  </svg>
)

const PaymentMethodSelector = ({ selected, onSelect }) => {
  const methods = [
    { 
      id: 'cash', 
      label: 'Dinheiro', 
      icon: Banknote,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-700'
    },
    { 
      id: 'credit', 
      label: 'Crédito', 
      icon: CreditCardIcon,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700',
      badges: [VisaIcon, MastercardIcon, EloIcon]
    },
    { 
      id: 'debit', 
      label: 'Débito', 
      icon: CreditCardIcon,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-700',
      badges: [VisaIcon, MastercardIcon, EloIcon]
    },
    { 
      id: 'pix', 
      label: 'PIX', 
      icon: PixIcon,
      color: 'teal',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-500',
      textColor: 'text-teal-700'
    }
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Forma de Pagamento
      </label>
      <div className="grid grid-cols-2 gap-3">
        {methods.map(({ id, label, icon: Icon, color, bgColor, borderColor, textColor, badges }) => {
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
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  ${isSelected ? bgColor : 'bg-gray-100'}
                  transition-colors
                `}>
                  <Icon size={24} className={isSelected ? textColor : 'text-gray-600'} />
                </div>
                
                <span className={`font-medium ${isSelected ? textColor : 'text-gray-700'}`}>
                  {label}
                </span>
                
                {/* Bandeiras de cartão */}
                {badges && (
                  <div className="flex items-center gap-1 mt-1">
                    {badges.map((BadgeIcon, idx) => (
                      <div 
                        key={idx} 
                        className={`w-6 h-4 flex items-center justify-center ${isSelected ? textColor : 'text-gray-400'}`}
                      >
                        <BadgeIcon />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Indicador de selecionado */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Legendas de bandeiras */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
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
          <PixIcon />
          <span>PIX</span>
        </div>
      </div>
    </div>
  )
}

export default PaymentMethodSelector