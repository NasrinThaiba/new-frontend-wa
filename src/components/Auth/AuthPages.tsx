import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { loginUser, registerUser, clearError } from '../../store/slices/authSlice';

// Shared Input = label + input (reusable)
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({
  label, ...props
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[#8696a0] text-xs font-medium uppercase tracking-widest">{label}</label>
    <input
      {...props}
      className="bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] rounded-xl px-4 py-3 text-sm outline-none
        border border-transparent focus:border-[#00a884] transition-colors"
    />
  </div>
);

// Login Page 
export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({ phone: '', password: '' });

  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to WhatsApp">

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <Input label="Mobile Number" type="tel" value={form.phone} placeholder="1234567890"
          onChange={(e) => setForm((form) => ({ ...form, phone: e.target.value }))} required />

        <Input label="Password" type="password" value={form.password} placeholder="••••••••"
          onChange={(e) => setForm((form) => ({ ...form, password: e.target.value }))} required />

        {error && <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-xl px-4 py-2">{error}</p>} 
        {/* show if error */}

        <SubmitButton loading={isLoading} label="Sign In" />
        {/* loading = spinner svg : label = Sign In */}

        <p className="text-[#8696a0] text-sm text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#00a884] hover:underline font-medium">Create one</Link>
        </p>

      </form>
    </AuthLayout>
  );
};

// Register Page

export const RegisterPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); //avoid page reload
    dispatch(registerUser(form));
  };

  return (
    <AuthLayout title="Create account" subtitle="Join WhatsApp Web today">

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <Input label="Full Name" type="text" value={form.name} placeholder="John Doe"
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />

        <Input label="Email" type="email" value={form.email} placeholder="you@example.com"
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />

        <Input label="Password" type="password" value={form.password} placeholder="Min. 6 characters"
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />

        <Input label="Phone (optional)" type="tel" value={form.phone} placeholder="+1 555 000 0000"
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />

        {error && <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-xl px-4 py-2">{error}</p>}

        <SubmitButton loading={isLoading} label="Create Account" />

        <p className="text-[#8696a0] text-sm text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-[#00a884] hover:underline font-medium">Sign in</Link>
        </p>

      </form>
      
    </AuthLayout>
  );
};

//  Shared layout - layout for register and login page
const AuthLayout: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children}) => (
  <div className="min-h-screen bg-[#111b21] flex items-center justify-center p-4">
    <div className="w-full max-w-sm">
      
      <div className="flex flex-col items-center mb-8 gap-3">
        <div className="w-16 h-16 rounded-full bg-[#00a884] flex items-center justify-center shadow-lg shadow-[#00a884]/30">
          <svg viewBox="0 0 24 24" fill="white" className="w-9 h-9">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.05-1.35C8.46 21.52 10.2 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.64 13.23c-.19.52-1.09.97-1.5 1.03-.38.06-.85.08-1.37-.09-.32-.1-.72-.24-1.24-.47-2.16-.95-3.57-3.14-3.68-3.29-.11-.14-.87-1.16-.87-2.22 0-1.05.55-1.57.75-1.79.19-.21.42-.26.56-.26.14 0 .28 0 .4.01.13.01.3-.05.47.36.18.43.6 1.47.65 1.58.05.11.08.24.02.37-.07.14-.1.22-.21.34-.1.12-.22.26-.31.35-.11.1-.22.21-.1.41.13.2.57.94 1.22 1.52.84.74 1.54.97 1.76 1.08.21.11.34.09.46-.05.13-.15.55-.64.69-.86.14-.21.28-.18.47-.11.19.07 1.22.58 1.43.68.21.1.35.15.4.24.05.09.05.51-.14 1.03z"/>
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-[#e9edef] text-2xl font-semibold">{title}</h1>
          <p className="text-[#8696a0] text-sm mt-1">{subtitle}</p>
        </div>
      </div>

     
      <div className="bg-[#202c33] rounded-2xl p-6 shadow-2xl">
        {children}
      </div>
    </div>
  </div>
);

// submit button - loding = svg, otherwise submit button
const SubmitButton: React.FC<{ loading: boolean; label: string }> = ({ loading, label }) => (
  <button type="submit" disabled={loading}
    className="mt-2 bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-50 text-white font-semibold
      py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
    {loading ? (
      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    ) : label}
  </button>
);
