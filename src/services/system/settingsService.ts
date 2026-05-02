// src/services/settingsService.js
import { supabase } from "@lib/supabase";
import { sanitizeObject } from "@utils/sanitize";

export const fetchCompanySettings = async () => {
  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  return (
    data || {
      company_name: "",
      company_logo: "/brasalino-pollo.png",
      domain: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      cnpj: "",
      primary_color: "#2563eb",
      secondary_color: "#7c3aed",
    }
  );
};

export const saveCompanySettings = async (settings) => {
  const safeData = sanitizeObject(settings);

  const { error } = await supabase.from("company_settings").upsert({
    ...safeData,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return safeData;
};
