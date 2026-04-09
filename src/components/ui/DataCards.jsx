import React from 'react'

const DataCards = ({
  data,
  renderCard,        // Função que renderiza o card
  keyExtractor,      // Função para extrair a key única
  columns = 1,       // Número de colunas (1, 2, 3, 4)
  gap = 4,           // Gap entre cards (1-8)
  onCardClick,
  emptyMessage = "Nenhum dado encontrado",
  className = ""
}) => {
  const gaps = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    7: 'gap-7',
    8: 'gap-8'
  }

  const columnsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`grid ${columnsClasses[columns]} ${gaps[gap]} ${className}`}>
      {data.map((item, index) => (
        <div
          key={keyExtractor?.(item, index) || index}
          onClick={() => onCardClick?.(item, index)}
          className={onCardClick ? 'cursor-pointer' : ''}
        >
          {renderCard(item, index)}
        </div>
      ))}
    </div>
  )
}

export default DataCards