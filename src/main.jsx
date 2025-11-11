import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register the service worker with lifecycle callbacks
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('🔄 New content available, updating...')
  },
  onOfflineReady() {
    console.log('✅ App ready to work offline')
  },
  onRegistered(registration) {
    console.log('✅ Service Worker registered:', registration)
  },
  onRegisterError(error) {
    console.error('❌ Service Worker registration failed:', error)
  }
})

// Bildirim izni (opsiyonel ama önerilir)
if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
  try {
    Notification.requestPermission();
  } catch {}
}
