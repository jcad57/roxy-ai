/**
 * Sign In / Sign Up Page
 * Unified authentication page with toggle
 */

'use client';

import { useState } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { useTheme } from '@/lib/providers/theme-provider';

export default function AuthPage() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.bg,
        padding: 20,
      }}
    >
      <AuthForm
        mode={mode}
        onToggleMode={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
      />
    </div>
  );
}
