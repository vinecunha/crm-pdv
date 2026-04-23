import { useState, useEffect, useRef } from 'react'

/**
 * Hook que debounce (atrasa) a atualização de um valor.
 * Útil para inputs de busca, redimensionamento de janela, etc.
 * 
 * @param value - Valor a ser debounced
 * @param delay - Tempo de atraso em ms (default: 500)
 * @returns O valor após o delay sem alterações
 * 
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook que throttle (limita) a frequência de atualização de um valor.
 * Útil para eventos de scroll, mousemove, etc.
 * 
 * @param value - Valor a ser throttled
 * @param limit - Intervalo mínimo entre atualizações em ms (default: 300)
 * @returns O valor atualizado respeitando o limit
 * 
 * @example
 * const throttledPosition = useThrottle(mousePosition, 100)
 */
export function useThrottle<T>(value: T, limit: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

export default useDebounce