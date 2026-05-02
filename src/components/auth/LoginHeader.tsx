// src/components/auth/LoginHeader.tsx
import React, { useState } from "react";
import { Building } from "@lib/icons";
import { useCompanyContext } from "@/contexts/CompanyContext";

const LoginHeader: React.FC = () => {
  const { company } = useCompanyContext();
  const [imageError, setImageError] = useState<boolean>(false);

  // Valores com fallback seguro
  const primaryColor: string = company?.primary_color || "#2563eb";
  const logoUrl: string | null =
    company?.company_logo || company?.company_logo || null;
  const companyName: string = company?.company_name || "EveIT";
  const showLogo: boolean = !!(logoUrl && !imageError);

  return (
    <div className="text-center mb-8">
      {showLogo ? (
        <img
          src={logoUrl as string}
          alt={`Logo ${companyName}`}
          className="h-20 mx-auto mb-4 object-contain"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
          style={{ backgroundColor: `${primaryColor}20` }}
          aria-label={`Logo ${companyName}`}
        >
          <Building size={40} style={{ color: primaryColor }} />
        </div>
      )}

      <h2 className="text-3xl font-bold" style={{ color: primaryColor }}>
        {companyName}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mt-2">
        Faça login para acessar o sistema
      </p>
    </div>
  );
};

export default LoginHeader;
