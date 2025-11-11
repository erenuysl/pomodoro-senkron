import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useAuth } from "./hooks/useAuth";
import { useNavigate } from "react-router-dom";

// Lazy load components
const GoogleLogin = lazy(() => import("./components/GoogleLogin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MobileNav = lazy(() => import("./components/MobileNav"));
const InstallPrompt = lazy(() => import("./components/InstallPrompt"));

// Loading component
function LoadingSpinner() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      color: '#00E5FF',
      fontSize: '18px',
      fontWeight: '600'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid rgba(0, 229, 255, 0.2)',
          borderTop: '4px solid #00E5FF',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        Yükleniyor...
      </div>
    </div>
  );
}

function GoogleLoginRoute() {
  const navigate = useNavigate();
  return <GoogleLogin onComplete={() => navigate("/")} />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0A1A1F',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {!user && (
              <>
                <Route path="/" element={<GoogleLoginRoute />} />
                {/* tüm diğer yönlendirmeler */}
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}

            {user && (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
          {user && <MobileNav />}
          <InstallPrompt />
        </Suspense>
      </BrowserRouter>
    </div>
  );
}
