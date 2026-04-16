import React from 'react'

const TabButton = ({ active, onClick, icon: Icon, children, isAdvanced }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${active 
          ? isAdvanced 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md dark:from-purple-500 dark:to-pink-500' 
            : 'bg-blue-600 text-white shadow-md dark:bg-blue-500'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-200'
        }
      `}
    >
      <Icon size={16} />
      {children}
      {isAdvanced && (
        <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px] dark:bg-black/20">
          PRO
        </span>
      )}
    </button>
  )
}

export default TabButton