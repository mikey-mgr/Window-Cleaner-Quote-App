import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  CapApp.addListener('backButton', () => {
    const evt = new Event('app:before-back', { cancelable: true });
    const shouldContinue = window.dispatchEvent(evt);
    if (!shouldContinue) return;
    window.dispatchEvent(new Event('app:navigate-back'));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
