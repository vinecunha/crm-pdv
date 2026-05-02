import { useEffect } from "react";
import { useCompany } from "@hooks/system/useCompany";

const DynamicHead = () => {
  const { company, loading } = useCompany();

  useEffect(() => {
    if (loading || !company) return;

    // Atualizar título
    const title = company.company_name
      ? `${company.company_name} - Sistema de Gestão`
      : "Sistema de Gestão";

    document.title = title;

    // Atualizar meta tags
    updateMetaTag(
      "description",
      `Sistema de gestão integrada ${company.company_name}`,
    );
    updateMetaTag("author", company.company_name);
    updateMetaTag("theme-color", company.primary_color || "#2563eb");

    // Atualizar favicon se existir
    if (company.favicon) {
      // Favicon dedicado configurado → usa ele
      updateFavicon(company.favicon);
    } else if (company.company_logo) {
      // Sem favicon, mas tem logo → usa a logo como favicon
      updateFavicon(company.company_logo);
    } else {
      // Sem favicon nem logo → gera SVG inline com iniciais da empresa
      const name = company.company_name || 'CRM';
      const color = company.primary_color || '#2563eb';
      const words = name.trim().split(/\s+/).filter(Boolean);
      const initials = words.length === 1
        ? words[0].slice(0, 2).toUpperCase()
        : (words[0][0] + words[words.length - 1][0]).toUpperCase();

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <rect width="32" height="32" rx="6" fill="${color}"/>
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
          font-size="${initials.length === 1 ? '18' : '14'}" font-weight="700"
          font-family="system-ui,sans-serif" fill="#fff">${initials}</text>
      </svg>`;

      const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      updateFavicon(dataUrl);
    }
  }, [company, loading]);

  const updateMetaTag = (name, content) => {
    if (!content) return;

    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", name);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  };

  const updateFavicon = (url: string) => {
    const configs = [
      { rel: 'icon', type: 'image/svg+xml' },
      { rel: 'shortcut icon' },
      { rel: 'apple-touch-icon' },
    ];
    configs.forEach(({ rel, type }) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = url;
      if (type) link.type = type;
    });
  };

  return null;
};

export default DynamicHead;
