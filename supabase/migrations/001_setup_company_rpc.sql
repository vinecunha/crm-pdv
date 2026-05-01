-- RPC para criar/atualizar configurações da empresa no primeiro acesso
-- Usa SECURITY DEFINER para contornar RLS na primeira configuração
CREATE OR REPLACE FUNCTION public.setup_company(
  p_company_name text,
  p_cnpj text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_zip_code text DEFAULT NULL,
  p_primary_color text DEFAULT '#2563eb',
  p_secondary_color text DEFAULT '#7c3aed',
  p_company_logo_url text DEFAULT NULL,
  p_favicon text DEFAULT NULL,
  p_domain text DEFAULT NULL,
  p_social_media jsonb DEFAULT '{}'::jsonb,
  p_custom_css text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
  v_result jsonb;
BEGIN
  -- Verifica se já existe uma configuração
  SELECT id INTO v_existing_id FROM company_settings LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Atualiza existente
    UPDATE company_settings SET
      company_name = p_company_name,
      cnpj = p_cnpj,
      email = p_email,
      phone = p_phone,
      address = p_address,
      city = p_city,
      state = p_state,
      zip_code = p_zip_code,
      primary_color = p_primary_color,
      secondary_color = p_secondary_color,
      company_logo_url = p_company_logo_url,
      favicon = p_favicon,
      domain = p_domain,
      social_media = p_social_media,
      custom_css = p_custom_css,
      updated_at = now()
    WHERE id = v_existing_id
    RETURNING to_jsonb(company_settings.*) INTO v_result;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'updated',
      'data', v_result
    );
  ELSE
    -- Cria nova configuração
    INSERT INTO company_settings (
      company_name,
      cnpj,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      primary_color,
      secondary_color,
      company_logo_url,
      favicon,
      domain,
      social_media,
      custom_css
    ) VALUES (
      p_company_name,
      p_cnpj,
      p_email,
      p_phone,
      p_address,
      p_city,
      p_state,
      p_zip_code,
      p_primary_color,
      p_secondary_color,
      p_company_logo_url,
      p_favicon,
      p_domain,
      p_social_media,
      p_custom_css
    )
    RETURNING to_jsonb(company_settings.*) INTO v_result;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'created',
      'data', v_result
    );
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Revogar acesso público e dar acesso apenas via service_role e authenticated
REVOKE ALL ON FUNCTION public.setup_company FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_company TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_company TO service_role;
