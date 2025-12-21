import React from 'react';
import {  Clock, DollarSign } from 'lucide-react';
import styles from './ServiceCard.module.css'; // Asumimos que creas el CSS

const ServiceCard = ({ title, details, duration, price, onClick, selected }) => {
  return (
    <div 
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.details}>{details}</p>
        
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Clock size={14} /> {duration}
          </span>
          <span className={styles.metaItemHighlight}>
            <DollarSign size={14} /> {price}
          </span>
        </div>
      </div>
      
      <div className={styles.iconBox}>
        
      </div>
    </div>
  );
};

export default ServiceCard;