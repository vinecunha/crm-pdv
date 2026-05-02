import { useQuery } from "@tanstack/react-query";
import * as settingsService from "@services/system/settingsService";

// Baseado em: public.company_settings
interface CompanySettings {
  id: string;
  company_name: string;
  company_logo: string | null;
  company_logo: string | null;
  favicon: string | null;
  domain: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  cnpj: string | null;
  social_media: Record<string, unknown> | null;
  primary_color: string | null;
  secondary_color: string | null;
  custom_css: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UseSettingsQueriesReturn {
  companySettings: CompanySettings | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export const useSettingsQueries = (
  isAdmin: boolean,
): UseSettingsQueriesReturn => {
  const {
    data: companySettings,
    isLoading,
    error,
    refetch,
  } = useQuery<CompanySettings>({
    queryKey: ["company-settings"],
    queryFn: settingsService.fetchCompanySettings,
    enabled: isAdmin,
    staleTime: 0,
  });

  return {
    companySettings,
    isLoading,
    error,
    refetch,
  };
};
