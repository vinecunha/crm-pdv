import { useMutation, useQueryClient } from "@tanstack/react-query";
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

interface SettingsCallbacks {
  onSettingsSaved?: (data: CompanySettings) => void;
  onError?: (error: Error) => void;
}

interface UseSettingsMutationsReturn {
  saveMutation: ReturnType<typeof useMutation>;
  isPending: boolean;
}

export const useSettingsMutations = (
  callbacks: SettingsCallbacks = {},
): UseSettingsMutationsReturn => {
  const queryClient = useQueryClient();

  const { onSettingsSaved, onError } = callbacks;

  const saveMutation = useMutation({
    mutationFn: (data: CompanySettings) =>
      settingsService.saveCompanySettings(data),
    onSuccess: (data: CompanySettings) => {
      queryClient.setQueryData(["company-settings"], data);
      onSettingsSaved?.(data);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    saveMutation,
    isPending: saveMutation.isPending,
  };
};
