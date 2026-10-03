import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { bookingService } from '../services/booking.service';
import { useTenant } from '../context/TenantContext';
import styles from './css/Steps.module.css';

const BranchSelection = ({ onSelectBranch }) => {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Branches are always scoped to the current tenant
  useEffect(() => {
    const loadBranches = async () => {
      setLoading(true);
      setBranches([]);

      if (!tenant?.id) {
        setLoading(false);
        return;
      }

      try {
        const data = await bookingService.getBranches(tenant.id);
        setBranches(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadBranches();
  }, [tenant?.id]);

  if (loading) return <div>{t('common.loading')}</div>;

  return (
    <div className={styles.stepContainer}>
      <h2>
        {t('booking.select_branch_title', {
          defaultValue: 'Selecciona tu sucursal',
        })}
      </h2>

      {branches.length === 0 ? (
        <p>
          {t('booking.no_branches', {
            defaultValue: 'No hay sucursales disponibles.',
          })}
        </p>
      ) : (
        <div className={styles.grid}>
          {branches.map((branch) => (
            <button
              key={branch.id}
              type="button"
              className={styles.branchCard}
              onClick={() => onSelectBranch(branch)}
            >
              <MapPin size={20} aria-hidden="true" />
              <h3 className={styles.branchName}>{branch.name}</h3>
              {branch.address && (
                <p className={styles.branchAddress}>{branch.address}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchSelection;
