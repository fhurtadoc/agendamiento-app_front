import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import { TenantProvider } from './context/TenantContext'
import { BrowserRouter } from 'react-router-dom'
import { AlertProvider } from './context/AlertContext';
// --- INICIO DEPURACIÓN ANDROID ---
import VConsole from 'vconsole';
const vConsole = new VConsole();

import App from './App.jsx'
import './index.css'
import './i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Necesario para las rutas */}
      <TenantProvider>
        <AuthProvider>
          <AlertProvider>
            <App />
          </AlertProvider>          
        </AuthProvider>
      </TenantProvider>
    </BrowserRouter>
  </React.StrictMode>,
)