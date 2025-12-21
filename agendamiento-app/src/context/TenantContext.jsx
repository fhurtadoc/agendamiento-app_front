import { createContext, useContext, useEffect, useState } from 'react';
import { tenantService } from '../services/tenantService';
import { tenantAdapter } from '../adapters/tenantAdapter';

// ID TEMPORAL: Reemplaza esto con el UUID de tu Tenant creado en Supabase
// (Lo obtienes de tu tabla 'tenants')
const TENANT_ID = import.meta.env.VITE_KEY_TENANTS; 
//console.log("Tenant ID cargado:", TENANT_ID);

const TenantContext = createContext();

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    const loadTenant = async () => {
      // 1. Llamamos a la Capa 1 (Servicio)
      const { data, error } = await tenantService.getTenantConfig(TENANT_ID);
      
      if (error) {
        console.error("Error cargando tenant:", error);
        return;
      }

      // 2. Pasamos por la Capa 2 (Adaptador)
      const themeConfig = tenantAdapter.toThemeConfig(data);
      
      setTenant(themeConfig);
      
      // 3. Magia: Inyectar variables CSS al navegador
      if (themeConfig) {
        document.documentElement.style.setProperty('--primary-color', themeConfig.theme.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', themeConfig.theme.secondaryColor);
      }
    };

    loadTenant();
  }, []);

  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);