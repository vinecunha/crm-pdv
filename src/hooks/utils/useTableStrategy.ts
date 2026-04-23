import { useMemo, ComponentType } from 'react'
import DataTable from '@components/ui/DataTable'
import VirtualTable from '@components/ui/VirtualTable'

interface TableProps {
  data: unknown[]
  [key: string]: unknown
}

type TableComponent = ComponentType<TableProps>

export const useTableStrategy = (
  data: unknown[],
  threshold: number = 100
): TableComponent => {
  const TableComponent = useMemo((): TableComponent => {
    return data.length > threshold ? VirtualTable : DataTable
  }, [data.length, threshold])

  return TableComponent
}

export const useVirtualTable = (): TableComponent => {
  return VirtualTable
}

export const useDataTable = (): TableComponent => {
  return DataTable
}