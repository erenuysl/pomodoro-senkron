import { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function InstallPrompt() {
  const { showInstallButton, handleInstallClick, handleDismiss } = useInstallPrompt();
  const [showToast, setShowToast] = useState(false);

  const handleInstall = async () => {
    await handleInstallClick();
    
    // Show success toast
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <>
      {/* Install Prompt Banner */}
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-[#0A1A1F] to-[#1a2f38] border border-[#00E5FF]/30 rounded-2xl shadow-2xl p-4 backdrop-blur-lg">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00E5FF] to-[#00a8cc] rounded-xl flex items-center justify-center text-2xl">
              📱
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm mb-1">
                Uygulamayı Yükle
              </h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                AMTM-SENKRON'u ana ekranınıza ekleyin ve daha hızlı erişin!
              </p>
              
              {/* Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-gradient-to-r from-[#00E5FF] to-[#00a8cc] text-[#0A1A1F] px-4 py-2 rounded-lg text-xs font-semibold hover:shadow-lg hover:shadow-[#00E5FF]/30 transition-all duration-300 hover:scale-105"
                >
                  Yükle
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  Daha Sonra
                </button>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
              aria-label="Kapat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-slide-down">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
            <span className="text-xl">🎉</span>
            <span className="font-semibold text-sm">Teşekkürler! Uygulama eklendi</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slide-down {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.4s ease-out;
        }
      `}</style>
    </>
  );
}
