import React from 'react';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook

export default function DashboardAdminView() {
  const { t } = useTranslation(); // <--- Init hook

  return (
    <div>
      <h1 style={{ color: '#1e293b' }}>{t('admin.dashboard_title')}</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
        
        {/* Total Users Card */}
        <div style={cardStyle}>
            <h3>{t('admin.total_users')}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>1,240</p>
        </div>
        
        {/* Monthly Sales Card */}
        <div style={cardStyle}>
            <h3>{t('admin.monthly_sales')}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>$45,300</p>
        </div>

        {/* Alerts Card */}
        <div style={cardStyle}>
            <h3>{t('admin.alerts')}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>3</p>
        </div>

      </div>
    </div>
  );
}

const cardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
};