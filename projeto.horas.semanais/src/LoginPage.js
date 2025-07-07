import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './supabaseClient';
import './LoginPage.css';

export default function LoginPage({ onLoginSuccess }) {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Bem-vindo ao Deo Cave</h1>
          <p>Faça login para gerenciar suas horas semanais</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#3b82f6',
                  brandAccent: '#1d4ed8',
                },
              },
            },
          }}
          providers={['google']}
          redirectTo={window.location.origin}
          onAuthStateChange={(event, session) => {
            if (event === 'SIGNED_IN' && session) {
              onLoginSuccess(session.user);
            }
          }}
        />
        
        <div className="login-footer">
          <p>Seus dados serão sincronizados em todos os dispositivos</p>
        </div>
      </div>
    </div>
  );
} 