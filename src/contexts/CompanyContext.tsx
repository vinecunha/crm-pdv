// src/contexts/CompanyContext.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { useCompany } from "@hooks/system/useCompany";

// Interface baseada no retorno real do useCompany
interface CompanyContextType {
  company: CompanySettings | null;
  loading: boolean;
  error: string | null;
  getCompanyColor: (type?: "primary" | "secondary") => string;
  updateCompanySettings: (
    settings: Partial<CompanySettings>,
  ) => Promise<UpdateCompanyResult>;
  fetchCompanySettings: () => Promise<void>;
}

// Interface importada do hook (você pode mover para um arquivo de tipos se preferir)
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

interface UpdateCompanyResult {
  success: boolean;
  data?: CompanySettings;
  error?: string;
}

// Criar contexto com valor padrão
const CompanyContext = createContext<CompanyContextType | null>(null);

// Hook personalizado para usar o contexto
export const useCompanyContext = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompanyContext must be used within CompanyProvider");
  }
  return context;
};

// Props do Provider
interface CompanyProviderProps {
  children: ReactNode;
}

// Provider component - AGORA CORRETO
export const CompanyProvider: React.FC<CompanyProviderProps> = ({
  children,
}) => {
  // useCompany retorna diretamente todas as propriedades
  const companyData = useCompany();

  // Passar diretamente o retorno do hook como valor do contexto
  return (
    <CompanyContext.Provider value={companyData}>
      {children}
    </CompanyContext.Provider>
  );
};
