import styles from '../GroupManager.module.css';

export default function PageContainer({ title, subtitle, children }) {
  return (
    <div className={styles.container}>
      {(title || subtitle) && (
        <div className={`${styles.welcome} text-center mb-4`}>
          {subtitle && <h2 className="text-lg font-bold mb-1 text-white">{subtitle}</h2>}
          {title && (
            <h1 className="text-2xl font-bold text-[#00E5FF] drop-shadow-[0_0_10px_#00E5FF99]">
              {title}
            </h1>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
