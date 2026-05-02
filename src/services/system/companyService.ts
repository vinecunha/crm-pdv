// src/services/companyService.ts
import { supabase } from "@lib/supabase";
import { logger } from "@utils/logger";

export const fetchCompanySettings = async () => {
  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error("❌ Erro ao buscar configurações da empresa:", error);
    return null;
  }

  return data;
};

export const setupCompany = async (data: {
  company_name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  company_logo?: string | null; // ← NOME CORRETO
  favicon?: string | null;
  domain?: string | null;
  social_media?: object | null;
  custom_css?: string | null;
}) => {
  const { data: result, error } = await supabase.rpc("setup_company", {
    p_company_name: data.company_name,
    p_cnpj: data.cnpj || null,
    p_email: data.email || null,
    p_phone: data.phone || null,
    p_address: data.address || null,
    p_city: data.city || null,
    p_state: data.state || null,
    p_zip_code: data.zip_code || null,
    p_primary_color: data.primary_color || "#2563eb",
    p_secondary_color: data.secondary_color || "#7c3aed",
    p_company_logo: data.company_logo || null, // ← NOME CORRETO
    p_favicon: data.favicon || null,
    p_domain: data.domain || null,
    p_social_media: data.social_media || {},
    p_custom_css: data.custom_css || null,
  });

  return { data: result, error };
};
