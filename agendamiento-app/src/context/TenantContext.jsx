import { createContext, useContext, useEffect, useState } from 'react';
import { tenantService } from '../services/tenantService';
import { tenantAdapter } from '../adapters/tenantAdapter';

// Retrieve Tenant ID ONLY from environment variables
const TENANT_ID = import.meta.env.VITE_KEY_TENANTS; 

const TenantContext = createContext();

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    const loadTenant = async () => {
      if (!TENANT_ID) {
        console.error("⚠️ VITE_KEY_TENANTS is not defined in environment variables.");
        return;
      }

      // 1. Service Layer
      const { data, error } = await tenantService.getTenantConfig(TENANT_ID);
      
      if (error) {
        console.error("Error loading tenant config:", error);
        return;
      }

      // 2. Adapter Layer
      const themeConfig = tenantAdapter.toThemeConfig(data);
      
      setTenant(themeConfig);
      
      // 3. Inject CSS Theme Variables
      if (themeConfig?.theme) {
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
