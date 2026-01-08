import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { servicesService } from '../../services/servicesService';
import { useTenant } from '../../context/TenantContext';
import styles from './CreateServiceView.module.css';

export const CreateServiceView = () => {
  const { t } = useTranslation();
  const tenant = useTenant(); // Obtenemos el Tenant ID del contexto

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    duration: '30', // Valor por defecto
    price: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!tenant?.id) {
      setMessage({ type: 'error', text: t('error.generic') + ' Tenant ID missing' });
      setLoading(false);
      return;
    }

    // Llamada al servicio
    const result = await servicesService.createService(formData, tenant.id);

    if (result.success) {
      setMessage({ type: 'success', text: t('services.create_success') });
      // Limpiar formulario
      setFormData({ name: '', duration: '30', price: '' });
    } else {
      setMessage({ type: 'error', text: t('error.save') + result.error });
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('services.create_title')}</h2>
        </div>

        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Nombre del Servicio */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('services.name_label')}</label>
            <input
              type="text"
              name="name"
              className={styles.input}
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Corte Caballero"
              required
            />
          </div>

          {/* Duración */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('services.duration_label')}</label>
            <select
              name="duration"
              className={styles.select}
              value={formData.duration}
              onChange={handleChange}
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hora</option>
              <option value="90">1.5 horas</option>
            </select>
          </div>

          {/* Precio */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('services.price_label')}</label>
            <input
              type="number"
              name="price"
              className={styles.input}
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? t('common.loading') : t('common.save')}
          </button>
        </form>
      </div>
    </div>
  );
};