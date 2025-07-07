import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './LoginPage.css';

export default function LoginPage({ onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        setError('Erro ao fazer login com Google. Tente novamente.');
        console.error('Google login error:', error);
      }
      // If successful, the user will be redirected back to the app
      // and the auth state change will be handled in App.js
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Bem-vindo ao Deo Cave</h1>
          <p>Faça login para gerenciar suas horas semanais</p>
        </div>
        
        <div className="login-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="google-login-btn"
          >
            {isLoading ? (
              <div className="loading-spinner-small"></div>
            ) : (
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>
              {isLoading ? 'Entrando...' : 'Entrar com Google'}
            </span>
          </button>
          
          <div className="login-info">
            <p>✨ Seus dados serão sincronizados em todos os dispositivos</p>
            <p>🔒 Login seguro com sua conta Google</p>
          </div>
        </div>
        
        <div className="login-footer">
          <p>Gerencie suas horas semanais de forma simples e eficiente</p>
        </div>
      </div>
    </div>
  );
} 