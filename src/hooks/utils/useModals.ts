import { useState, useCallback, useMemo } from 'react'

export interface ModalConfig {
  name: string
  defaultValue?: boolean
}

export interface UseModalsOptions {
  modals: ModalConfig[]
}

export interface UseModalsReturn {
  states: Record<string, boolean>
  setters: Record<string, React.Dispatch<React.SetStateAction<boolean>>>
  openers: Record<string, () => void>
  closers: Record<string, () => void>
  openAll: () => void
  closeAll: () => void
  isAnyOpen: () => boolean
}

export const useModals = (options: UseModalsOptions): UseModalsReturn => {
  const { modals } = options

  const initialStates = useMemo(() => {
    const states: Record<string, boolean> = {}
    modals.forEach(m => {
      states[m.name] = m.defaultValue ?? false
    })
    return states
  }, [modals])

  const [states, setStates] = useState<Record<string, boolean>>(initialStates)

  const setters = useMemo(() => {
    const result: Record<string, React.Dispatch<React.SetStateAction<boolean>>> = {}
    modals.forEach(m => {
      result[m.name] = (value: boolean | ((prev: boolean) => boolean)) => {
        setStates(prev => ({ ...prev, [m.name]: typeof value === 'function' ? value(prev[m.name]) : value }))
      }
    })
    return result
  }, [modals])

  const openers = useMemo(() => {
    const result: Record<string, () => void> = {}
    modals.forEach(m => {
      result[m.name] = () => setStates(prev => ({ ...prev, [m.name]: true }))
    })
    return result
  }, [modals])

  const closers = useMemo(() => {
    const result: Record<string, () => void> = {}
    modals.forEach(m => {
      result[m.name] = () => setStates(prev => ({ ...prev, [m.name]: false }))
    })
    return result
  }, [modals])

  const openAll = useCallback(() => {
    const allTrue: Record<string, boolean> = {}
    modals.forEach(m => { allTrue[m.name] = true })
    setStates(allTrue)
  }, [modals])

  const closeAll = useCallback(() => {
    const allFalse: Record<string, boolean> = {}
    modals.forEach(m => { allFalse[m.name] = false })
    setStates(allFalse)
  }, [modals])

  const isAnyOpen = useCallback(() => {
    return Object.values(states).some(v => v)
  }, [states])

  return { states, setters, openers, closers, openAll, closeAll, isAnyOpen }
}

export default useModals
