import { useQuery } from '@tanstack/react-query'
import { fetchSellerDetails } from '../services/sellerService'

export const useSellerData = (sellerId, viewerRole) => {
  return useQuery({
    queryKey: ['seller', sellerId],
    queryFn: () => fetchSellerDetails(sellerId, viewerRole),
    enabled: !!sellerId && !!viewerRole,
    staleTime: 5 * 60 * 1000
  })
}