import { useMemo } from 'react'
import DataTable from '../components/ui/DataTable'
import VirtualTable from '../components/ui/VirtualTable'

/**
 * Hook que decide automaticamente se usa DataTable ou VirtualTable
 * baseado na quantidade de dados
 */
export const useTableStrategy = (data, threshold = 100) => {
  const TableComponent = useMemo(() => {
    return data.length > threshold ? VirtualTable : DataTable
  }, [data.length, threshold])

  return TableComponent
}

/**
 * Hook para forçar uso de VirtualTable (para listas muito grandes)
 */
export const useVirtualTable = () => {
  return VirtualTable
}

/**
 * Hook para forçar uso de DataTable (para listas pequenas com paginação)
 */
export const useDataTable = () => {
  return DataTable
}