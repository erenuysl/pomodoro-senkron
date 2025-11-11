import { Link, useLocation } from "react-router-dom";

export default function MobileNav() {
  const { pathname } = useLocation();
  const isActive = (p) => pathname === p;
  
  const navItems = [
    { path: '/', icon: 'home', label: 'Anasayfa', ariaLabel: 'Anasayfa' },
    { path: '/stats', icon: 'analytics', label: 'İstatistik', ariaLabel: 'İstatistik' },
    { path: '/history', icon: 'schedule', label: 'Geçmiş', ariaLabel: 'Geçmiş' },
    { path: '/settings', icon: 'settings', label: 'Ayarlar', ariaLabel: 'Ayarlar' }
  ];

  return (
    <nav 
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md" 
      role="navigation" 
      aria-label="Alt menü"
    >
      <div 
        className="rounded-2xl px-4 py-3 border border-white/10 flex items-center justify-around gap-2"
        style={{
          background: 'rgba(42, 43, 47, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
        }}
      >
        {navItems.map(({ path, icon, label, ariaLabel }) => (
          <Link
            key={path}
            to={path}
            aria-label={ariaLabel}
            aria-current={isActive(path) ? "page" : undefined}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[48px] min-h-[48px] transition-all duration-200 ${
              isActive(path) 
                ? "bg-white/10 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.2)]" 
                : "text-[#e0e0e0] hover:bg-white/10"
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{icon}</span>
            <span className="text-xs">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}