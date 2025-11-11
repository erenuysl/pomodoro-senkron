import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Check if this is the second visit
    const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0', 10);
    localStorage.setItem('pwa-visit-count', (visitCount + 1).toString());

    // Check if user already installed or dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const installed = localStorage.getItem('pwa-installed');

    // Show install button on second visit if not dismissed or installed
    const shouldShow = visitCount >= 1 && !dismissed && !installed;

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      
      // Show install button if conditions are met
      if (shouldShow) {
        setShowInstallButton(true);
      }
    };

    const handleAppInstalled = () => {
      // Hide the install button
      setShowInstallButton(false);
      setDeferredPrompt(null);
      
      // Mark as installed
      localStorage.setItem('pwa-installed', 'true');
      
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      localStorage.setItem('pwa-installed', 'true');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return {
    showInstallButton,
    handleInstallClick,
    handleDismiss
  };
}
