import { useQuery } from '@tanstack/react-query'
import { fetchSellerDetails } from '../services/sellerService'

export const useSellerData = (sellerId, viewerRole, viewerId) => {
  return useQuery({
    queryKey: ['seller', sellerId],
    queryFn: () => fetchSellerDetails(sellerId, viewerRole, viewerId),
    enabled: !!sellerId && !!viewerRole && !!viewerId,
    staleTime: 5 * 60 * 1000
  })
}