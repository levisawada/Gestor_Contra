import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProfilesPage from './pages/ProfilesPage';
import AuthPage from './pages/AuthPage';
import VaultPage from './pages/VaultPage';

function App(): React.JSX.Element {
    return (
        <BrowserRouter>
            <Routes>
                {/* Pantalla principal — lista de perfiles (público) */}
                <Route path="/" element={<ProfilesPage />} />

                {/* Autenticación — full-login o keypad de PIN según ?mode= */}
                <Route path="/auth/:userId" element={<AuthPage />} />

                {/* Bóveda — dashboard de contraseñas (requiere sesión activa) */}
                <Route path="/vault" element={<VaultPage />} />

                {/* Ruta desconocida → inicio */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
