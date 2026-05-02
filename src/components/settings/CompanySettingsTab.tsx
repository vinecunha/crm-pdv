import React, { useState } from "react";
import { Image as ImageIcon, Save } from "@lib/icons";
import LogoUploader from "@components/settings/LogoUploader";
import Button from "@components/ui/Button";
import LazyImage from "@components/ui/LazyImage";

const CompanySettingsTab = ({ settings, setSettings, onSave, saving }) => {
  const [availableLogos] = useState([
    { name: "Logo Padrão", path: "/brasalino-pollo.png" },
    { name: "Logo Dark", path: "/logo-dark.png" },
    { name: "Logo Light", path: "/logo-light.png" },
    { name: "Logo Branca", path: "/logo-white.png" },
    { name: "Logo Azul", path: "/logo-blue.png" },
  ]);

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 dark:text-white">
        Informações da Empresa
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Logo da Empresa
          </label>

          <LogoUploader
            currentLogo={settings.company_logo}
            onLogoChange={(url) => handleChange("company_logo", url)}
            disabled={saving}
          />

          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-2 dark:text-gray-400">
              Ou escolha uma logo pré-definida:
            </label>
            <select
              value={settings.company_logo}
              onChange={(e) => handleChange("company_logo", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
              disabled={saving}
            >
              <option value="">Selecione uma logo</option>
              {availableLogos.map((logo) => (
                <option key={logo.path} value={logo.path}>
                  {logo.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
            Nome da Empresa *
          </label>
          <input
            type="text"
            value={settings.company_name || ""}
            onChange={(e) => handleChange("company_name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
            placeholder="Nome da sua empresa"
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              CNPJ
            </label>
            <input
              type="text"
              value={settings.cnpj || ""}
              onChange={(e) => handleChange("cnpj", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="00.000.000/0001-00"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={settings.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="contato@empresa.com"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Telefone
            </label>
            <input
              type="text"
              value={settings.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="(00) 0000-0000"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Domínio
            </label>
            <input
              type="text"
              value={settings.domain || ""}
              onChange={(e) => handleChange("domain", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="www.empresa.com.br"
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Endereço
            </label>
            <input
              type="text"
              value={settings.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="Rua, número"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Cidade
            </label>
            <input
              type="text"
              value={settings.city || ""}
              onChange={(e) => handleChange("city", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="Cidade"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Estado
            </label>
            <input
              type="text"
              value={settings.state || ""}
              onChange={(e) => handleChange("state", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="UF"
              maxLength={2}
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
            CEP
          </label>
          <input
            type="text"
            value={settings.zip_code || ""}
            onChange={(e) => handleChange("zip_code", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="00000-000"
            disabled={saving}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 mt-6 pt-6 dark:border-gray-700">
        <Button onClick={onSave} loading={saving} icon={Save}>
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default CompanySettingsTab;
