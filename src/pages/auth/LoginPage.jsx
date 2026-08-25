import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';

export default function LoginPage({ onClose }) {
  const { t } = useTranslation();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const fn = mode === 'login' ? signInWithEmail : signUpWithEmail;
    const { error: err } = await fn(email, password);

    setLoading(false);
    if (err) {
      setError(err.message);
    } else if (mode === 'register') {
      setSuccessMsg(t('auth.checkEmail'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold">GymRat Notes</h2>
          {onClose && (
            <button onClick={onClose} className="text-text-secondary text-xl leading-none">&times;</button>
          )}
        </div>

        <div className="flex gap-1 bg-bg rounded-xl p-1 mb-5 border border-border">
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-primary text-white' : 'text-text-secondary'}`}
            >
              {t(`auth.${m}`)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm"
          />
          <input
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm"
          />

          {error && <p className="text-xs text-red-400">{error}</p>}
          {successMsg && <p className="text-xs text-green-400">{successMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {loading ? '...' : t(`auth.${mode}`)}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-surface px-2 text-xs text-text-secondary">{t('auth.or')}</span>
          </div>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full py-2.5 border border-border rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:border-primary/40 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('auth.google')}
        </button>

        {onClose && (
          <button onClick={onClose} className="w-full mt-3 py-2 text-text-secondary text-xs">
            {t('auth.continueGuest')}
          </button>
        )}
      </div>
    </div>
  );
}
