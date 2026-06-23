import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useData } from '../context/DataContext';
import Spinner from '../components/ui/Spinner';

export default function Login() {
  const navigate = useNavigate();
  const { settings, loading, configured } = useData();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    const correctPin = String(settings?.pin || '1234');
    if (pin === correctPin) {
      localStorage.setItem('tkr_auth', 'true');
      navigate('/');
    } else {
      setError('Incorrect PIN. Try again.');
      setShaking(true);
      setPin('');
      setTimeout(() => { setShaking(false); setError(''); }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm z-10">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Top band */}
          <div className="bg-slate-900 px-8 pt-8 pb-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <img src="/tkr.png" alt="Tahir Khan Restaurant" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <h1 className="text-xl font-bold text-white">
              Tahir Khan<span className="text-emerald-400">.</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Restaurant ERP System</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <div className="flex items-center gap-2 mb-6">
              <KeyRound className="w-4 h-4 text-slate-400" />
              <p className="text-sm text-slate-500 font-medium">Enter your access PIN</p>
            </div>

            {!configured && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                ⚙️ Google Sheets not configured yet. Go to{' '}
                <strong>Settings</strong> after login to add your Web App URL.
                Default PIN is <strong>1234</strong>.
              </div>
            )}

            {loading && configured && (
              <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm">
                <Spinner size="sm" /> Loading settings…
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className={`transition-all ${shaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className={`w-full text-center text-3xl tracking-[0.6em] px-4 py-4 border-2 rounded-2xl outline-none transition-all font-mono ${
                    error
                      ? 'border-red-300 bg-red-50 focus:border-red-400'
                      : 'border-slate-200 bg-slate-50 focus:border-emerald-400 focus:bg-white'
                  }`}
                  placeholder="••••"
                  maxLength={6}
                  autoFocus
                />
                {error && (
                  <p className="text-red-500 text-xs mt-2 text-center">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={pin.length < 4}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 active:scale-95"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Tahir Khan Restaurant · ERP v1.0
        </p>
      </div>
    </div>
  );
}
