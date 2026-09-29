import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import {
  Lock,
  ArrowRight,
  User,
  ShieldCheck,
  GraduationCap,
  Building2,
  UserCheck,
  Zap,
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickLoginAccount {
  role: Role;
  label: string;
  name: string;
  email: string;
  badge: string;
  badgeColor: string;
  borderHover: string;
  bgHover: string;
  icon: LucideIcon;
  iconColor: string;
  description: string;
}

const QUICK_LOGIN_ACCOUNTS: QuickLoginAccount[] = [
  {
    role: 'applicant',
    label: 'Student',
    name: 'Priya Naik',
    email: 'student@demo.in',
    badge: 'ST Applicant',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    borderHover: 'hover:border-[#71816d] hover:shadow-md',
    bgHover: 'hover:bg-emerald-50/50',
    icon: GraduationCap,
    iconColor: 'text-[#71816d]',
    description: 'Student Portal & Applications'
  },
  {
    role: 'admin',
    label: 'MoTA Admin',
    name: 'Smt. Kavita Rao',
    email: 'admin@demo.in',
    badge: 'Ministry Admin',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    borderHover: 'hover:border-rose-500 hover:shadow-md',
    bgHover: 'hover:bg-rose-50/50',
    icon: ShieldCheck,
    iconColor: 'text-rose-600',
    description: 'Executive Control & Schemes'
  },
  {
    role: 'institute',
    label: 'Institute',
    name: 'Dr. Ramesh Kumar',
    email: 'institute@demo.in',
    badge: 'NIT Rourkela',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    borderHover: 'hover:border-purple-500 hover:shadow-md',
    bgHover: 'hover:bg-purple-50/50',
    icon: Building2,
    iconColor: 'text-purple-600',
    description: 'Institute Nodal Verification'
  },
  {
    role: 'officer',
    label: 'Nodal Officer',
    name: 'Shri Rajesh Kumar',
    email: 'officer@demo.in',
    badge: 'Welfare Dept',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    borderHover: 'hover:border-teal-500 hover:shadow-md',
    bgHover: 'hover:bg-teal-50/50',
    icon: UserCheck,
    iconColor: 'text-teal-600',
    description: 'Document OCR Scrutiny Queue'
  }
];

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoggingInRole, setQuickLoggingInRole] = useState<Role | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleQuickLogin = async (email: string, targetRole: Role, roleLabel: string) => {
    setLoading(true);
    setQuickLoggingInRole(targetRole);
    try {
      const user = await login(email, targetRole);
      toast.success(`Signed in as ${roleLabel} (${user.name})!`);
      const fromPath = (location.state as any)?.from?.pathname;
      if (fromPath) {
        navigate(fromPath, { replace: true });
      } else if (user.role === 'applicant') {
        navigate('/app');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      toast.error(err.message || 'Quick login failed. Please try again.');
    } finally {
      setLoading(false);
      setQuickLoggingInRole(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter your email or username');
      return;
    }
    setLoading(true);
    try {
      const user = await login(identifier.trim());
      toast.success(`Welcome back, ${user.name || 'User'}!`);
      const fromPath = (location.state as any)?.from?.pathname;
      if (fromPath) {
        navigate(fromPath, { replace: true });
      } else if (user.role === 'applicant') {
        navigate('/app');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1e0c5] flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        {/* Emblem */}
        <div className="w-16 h-16 bg-gradient-to-tr from-[#5b6a57] to-[#71816d] rounded-2xl shadow-md flex items-center justify-center mx-auto mb-4 border border-[#c9b79c]">
          <span className="font-serif font-extrabold text-2xl text-amber-200 tracking-wider">ST</span>
        </div>

        {/* Portal Pill */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#e8d6ba] text-[#5b6a57] border border-[#dfcdb1] mb-2 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#71816d]" />
          Ministry of Tribal Affairs • DBT Portal
        </span>

        <h2 className="text-3xl font-extrabold text-[#2c352a] tracking-tight">Welcome back</h2>
        <p className="mt-1 text-sm text-[#5a6857] font-medium">Sign in to the Vidya-Vrtti Fellowship & Scholarship Portal</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        {/* Quick 1-Click Login Card (No Password Required) */}
        <div className="mb-6 bg-[#fdfbf7] p-5 sm:p-6 rounded-3xl border border-[#c9b79c] shadow-md">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#2c352a] uppercase tracking-wider flex items-center gap-1.5">
                  Quick Login (No Password)
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </h3>
                <p className="text-[11px] text-[#5a6857]">
                  Instant 1-click access for evaluation, testing & demonstration
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[10px] bg-[#e8d6ba] text-[#5a6857] font-extrabold px-2 py-0.5 rounded-full border border-[#dfcdb1]">
              1-Click Demo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {QUICK_LOGIN_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              const isCurrentLoading = quickLoggingInRole === acc.role;
              return (
                <button
                  key={acc.role}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc.email, acc.role, acc.label)}
                  className={`flex items-start justify-between p-3.5 rounded-2xl bg-white border border-[#dfcdb1] transition-all text-left group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${acc.borderHover} ${acc.bgHover}`}
                >
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#f1e0c5]/80 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform border border-[#dfcdb1]">
                      <Icon className={`w-4 h-4 ${acc.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-slate-900 group-hover:text-[#2c352a]">
                          {acc.label}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-800 truncate mt-0.5">
                        {acc.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {acc.email}
                      </p>
                      <p className="text-[9px] text-[#5a6857] mt-0.5">
                        {acc.description}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-1.5 flex flex-col items-end justify-between self-stretch">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-xs border ${acc.badgeColor}`}>
                      {acc.badge}
                    </span>
                    {isCurrentLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-[#71816d]/30 border-t-[#71816d] rounded-full animate-spin mt-2"></div>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#71816d] group-hover:translate-x-0.5 transition-all mt-2" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Standard Manual Login Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-[#c9b79c]">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#dfcdb1]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[#5a6857] font-extrabold tracking-wider">
                Or Sign In With Custom Credentials
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2c352a] mb-1.5">
                Email address or Login ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-[#71816d]" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. student@demo.in or VV-2026-10001"
                  className="block w-full pl-10 pr-4 py-3 bg-[#fbf8f3] border border-[#c9b79c] rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:border-[#71816d] focus:bg-white transition-all outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2c352a] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#71816d]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (optional for demo)"
                  className="block w-full pl-10 pr-4 py-3 bg-[#fbf8f3] border border-[#c9b79c] rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#71816d] focus:border-[#71816d] focus:bg-white transition-all outline-hidden font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 mt-4 rounded-xl text-sm font-extrabold text-white bg-[#71816d] hover:bg-[#5b6a57] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#71816d] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md cursor-pointer"
            >
              {loading && !quickLoggingInRole ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center">
                  <span>Sign In with Credentials</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#dfcdb1] text-center">
            <p className="text-xs text-[#5a6857]">
              Don't have an account?{' '}
              <Link to="/register" className="font-extrabold text-[#71816d] hover:text-[#5b6a57] hover:underline transition-colors ml-1">
                New Registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
