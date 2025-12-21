import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { bookingService } from '../services/booking.service';
import ServiceCard from '../components/cards/ServiceCard';
import styles from './css/Steps.module.css';

const ServiceSelection = ({ onSelectService }) => {
  const { t } = useTranslation(); // <--- Init hook
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Business Logic (Smart)
  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await bookingService.getCatalog();
        setServices(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  if (loading) return <div>{t('common.loading')}</div>;

  return (
    <div className={styles.stepContainer}>
      <h2>{t('booking.select_service_title')}</h2>
      
      <div className={styles.grid}>
        {services.map((service) => (
          // We use the "dumb" component passing data to it
          <ServiceCard
            key={service.id}
            title={service.title}
            details={service.details}
            duration={service.duration}
            price={service.price}
            onClick={() => onSelectService(service)}
          />
        ))}
      </div>
    </div>
  );
};

export default ServiceSelection;