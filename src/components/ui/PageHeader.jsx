// src/components/ui/PageHeader.jsx
import React from 'react'
import Button from './Button'

const PageHeader = ({
  title,
  description,
  icon: Icon,
  actions = [],
  extraContent,
  mode,
  setMode,
  isMutating = false
}) => {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {Icon && <Icon className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={22} />}
              <span className="truncate">{title}</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 line-clamp-2">
              {typeof description === 'function' ? description() : description}
            </p>
          </div>
          
          {/* Container dos botões - com flex-wrap para mobile */}
          <div className="flex flex-wrap items-center gap-2">
            {extraContent}
            {actions.map((action, index) => {
              // Se for um link, renderiza diferente
              if (action.asLink) {
                return action.render ? action.render() : null
              }
              
              // Renderização condicional baseada no modo
              if (action.showInMode && !action.showInMode.includes(mode)) {
                return null
              }
              
              return (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm" // ← SEMPRE usar size="sm" para mobile
                  onClick={action.onClick}
                  loading={action.loading}
                  icon={action.icon}
                  disabled={action.disabled || action.loading}
                  className={`${action.className || ''} whitespace-nowrap`}
                >
                  {/* No mobile muito pequeno, mostra só ícone; no sm+ mostra texto */}
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PageHeader