import { memo } from 'react';
import styles from '../GroupManager.module.css';

function Card({ title, children, className = '' }) {
  return (
    <div className={`${styles.card} ${className}`}>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
}

export default memo(Card);
