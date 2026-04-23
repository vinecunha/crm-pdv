import { useQuery } from '@tanstack/react-query'
import { fetchSellerDetails } from '@services/seller/sellerService'

// Baseado em: public.profiles
interface SellerProfile {
  id: string
  email: string
  role: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  document: string | null
  birth_date: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  status: string | null
  registration_number: string | null
  created_at: string | null
  updated_at: string | null
  last_login: string | null
  login_count: number | null
  [key: string]: unknown
}

interface SellerDetails extends SellerProfile {
  sales?: unknown[]
  commissions?: unknown[]
  goals?: unknown[]
  total_sales?: number
  total_commissions?: number
  [key: string]: unknown
}

export const useSellerData = (
  sellerId: string | null,
  viewerRole: string | null,
  viewerId: string | null
) => {
  return useQuery<SellerDetails>({
    queryKey: ['seller', sellerId],
    queryFn: () => fetchSellerDetails(sellerId as string, viewerRole as string, viewerId as string),
    enabled: !!sellerId && !!viewerRole && !!viewerId,
    staleTime: 5 * 60 * 1000
  })
}