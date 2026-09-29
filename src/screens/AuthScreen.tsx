import React, { useState, useEffect, useRef } from 'react';
import { useCricket } from '../context/CricketContext';
import {
  generateRegistrationOtp,
  verifyAndRegisterOtp,
} from '../utils/authAccounts';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Lock,
  User,
  KeyRound,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signIn, navigateTo } = useCricket();

  // Tab State: 'signin' | 'register'
  const [isLogin, setIsLogin] = useState(true);

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Common UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // OTP Verification Modal States
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [latestGeneratedOtp, setLatestGeneratedOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for OTP resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpModalOpen && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpModalOpen, resendCooldown]);

  // Focus first input when OTP modal opens
  useEffect(() => {
    if (otpModalOpen) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [otpModalOpen]);

  // Handle Sign In submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (signInPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await signIn(signInEmail.trim(), signInPassword);
      navigateTo('home');
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration Step 1: Generate & Send OTP
  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const normalizedEmail = regEmail.trim().toLowerCase();

    if (!regName.trim()) {
      setError('Please enter your full name');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      setError('Please enter a valid Gmail / email address');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const code = generateRegistrationOtp(normalizedEmail, regName.trim(), regPassword);
      setLatestGeneratedOtp(code);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError('');
      setResendCooldown(30);
      setOtpModalOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setOtpError('');

    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasteData[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIdx = Math.min(pasteData.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  // Auto-fill OTP convenience button
  const handleAutoFillOtp = () => {
    if (latestGeneratedOtp && latestGeneratedOtp.length === 6) {
      setOtpDigits(latestGeneratedOtp.split(''));
      setOtpError('');
    }
  };

  // Resend OTP handler
  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    const code = generateRegistrationOtp(regEmail, regName, regPassword);
    setLatestGeneratedOtp(code);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setResendCooldown(30);
  };

  // Verify OTP and Complete Registration
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      setOtpError('Please enter all 6 digits of your verification code');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const result = verifyAndRegisterOtp(regEmail, fullOtp);
      if (!result.success || !result.account) {
        setOtpError(result.error || 'Verification failed. Invalid or expired code.');
        return;
      }

      setOtpModalOpen(false);
      setIsLogin(true);
      setSignInEmail(result.account.email);
      setSignInPassword('');
      setSuccessMessage(
        `✅ Email verified successfully for ${result.account.name}! Please sign in with your password to continue.`
      );
    } catch (err: any) {
      setOtpError(err?.message || 'Verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#06120E] via-[#0B3D2E] to-[#0F5238] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-[#00C853]/15 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-[#FFB300]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl z-10 border border-white/20">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B3D2E] to-[#00A94D] flex items-center justify-center shadow-lg mb-3">
            <span className="text-2xl font-black text-white tracking-widest">BTG</span>
          </div>
          <h1 className="text-2xl font-black text-[#13201B] tracking-tight">BTG CRICKET</h1>
          <p className="text-xs text-[#5B6B63] mt-1 font-medium">Live Scoring & Tournament Platform</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#EFF3F0] p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
              isLogin ? 'bg-[#0B3D2E] text-white shadow-sm' : 'text-[#5B6B63] hover:text-[#13201B]'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
              !isLogin ? 'bg-[#0B3D2E] text-white shadow-sm' : 'text-[#5B6B63] hover:text-[#13201B]'
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Global Notifications */}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-[#E7F7EE] border border-[#00A94D]/30 text-[#00873D] text-xs font-bold rounded-2xl flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-[#00A94D] shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3.5 bg-[#E53935]/10 border border-[#E53935]/30 text-[#E53935] text-xs font-semibold rounded-2xl">
            {error}
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {isLogin ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="e.g. admin@gmail.com or registered email"
                  className="w-full pl-10 pr-4 py-3 bg-[#EFF3F0] border border-transparent rounded-xl text-sm focus:bg-white focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 outline-none transition-all font-medium"
                  required
                />
                <Mail className="w-4 h-4 text-[#8A978F] absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showSignInPassword ? 'text' : 'password'}
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-[#EFF3F0] border border-transparent rounded-xl text-sm focus:bg-white focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 outline-none transition-all font-medium"
                  required
                />
                <Lock className="w-4 h-4 text-[#8A978F] absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3.5 top-3.5 text-[#8A978F] hover:text-[#13201B] cursor-pointer"
                >
                  {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#00C853] hover:bg-[#00A94D] active:scale-[0.99] text-white font-black rounded-xl shadow-md transition-all text-sm mt-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Verifying Credentials...' : 'SIGN IN'}
            </button>

            {/* Note for Authorized Admin & User Registration */}
            <div className="mt-5 p-3.5 bg-[#EFF3F0] rounded-2xl border border-[#E4EAE6] text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#0B3D2E]">
                <ShieldCheck className="w-4 h-4 text-[#FFB300] shrink-0" />
                <span>Administrator & Player Access</span>
              </div>
              <p className="text-[11px] text-[#5B6B63] leading-relaxed">
                • <strong>Tournament Admins</strong>: Sign in with registered administrator credentials (<span className="font-semibold text-[#13201B]">admin@gmail.com</span>).
              </p>
              <p className="text-[11px] text-[#5B6B63] leading-relaxed">
                • <strong>New Players</strong>: Click the <button type="button" onClick={() => setIsLogin(false)} className="text-[#00A94D] font-bold underline cursor-pointer">REGISTER</button> tab to verify your real Gmail account via OTP.
              </p>
            </div>
          </form>
        ) : (
          /* TAB 2: REGISTER WITH REAL GMAIL & OTP */
          <form onSubmit={handleInitiateRegistration} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Veeru"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#EFF3F0] border border-transparent rounded-xl text-xs font-medium focus:bg-white focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 outline-none transition-all"
                  required
                />
                <User className="w-4 h-4 text-[#8A978F] absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1">
                Gmail / Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. bpveeru2003@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#EFF3F0] border border-transparent rounded-xl text-xs font-medium focus:bg-white focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 outline-none transition-all"
                  required
                />
                <Mail className="w-4 h-4 text-[#8A978F] absolute left-3.5 top-3" />
              </div>
              <p className="text-[10px] text-[#8A978F] mt-1">
                A 6-digit OTP verification code will be generated for this email.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#EFF3F0] border border-transparent rounded-xl text-xs font-medium focus:bg-white focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 outline-none transition-all"
                  required
                />
                <Lock className="w-4 h-4 text-[#8A978F] absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-3 text-[#8A978F] hover:text-[#13201B] cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#EFF3F0] border border-transparent rounded-xl text-xs font-medium focus:bg-white focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 outline-none transition-all"
                  required
                />
                <KeyRound className="w-4 h-4 text-[#8A978F] absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00C853] hover:bg-[#00A94D] active:scale-[0.99] text-[#0B3D2E] font-black rounded-xl shadow-md transition-all text-xs tracking-wider mt-3 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'GENERATING OTP...' : 'SEND OTP & VERIFY EMAIL'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. OTP EMAIL VERIFICATION MODAL                                           */}
      {/* ========================================================================= */}
      {otpModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E4EAE6] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#00C853]/15 text-[#00C853] flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Mail className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-[#13201B]">Verify Your Email</h3>
              <p className="text-xs text-[#5B6B63] mt-1">
                Enter the 6-digit OTP code sent to:
                <br />
                <span className="font-extrabold text-[#0B3D2E]">{regEmail}</span>
              </p>
            </div>

            {/* Simulated Live Delivery Toast / Banner */}
            {latestGeneratedOtp && (
              <div className="mb-4 p-3.5 bg-gradient-to-r from-[#0B3D2E] to-[#14764E] text-white rounded-2xl shadow-sm text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#00C853]">
                    <span className="w-2 h-2 rounded-full bg-[#00C853] animate-ping" />
                    <span>📩 Verification Code Dispatch</span>
                  </div>
                  <span className="text-[10px] text-white/70">Just now</span>
                </div>
                <p className="mt-1 text-white/90 text-xs">
                  Your registration security OTP is{' '}
                  <span className="font-mono font-black text-sm tracking-widest text-[#FFD54F] bg-black/20 px-2 py-0.5 rounded-md">
                    {latestGeneratedOtp}
                  </span>
                </p>
                <div className="mt-2.5 pt-2 border-t border-white/15 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAutoFillOtp}
                    className="text-[11px] font-black bg-[#00C853] hover:bg-[#00A94D] text-[#0B3D2E] px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    1-Tap Auto-Fill Code
                  </button>
                </div>
              </div>
            )}

            {otpError && (
              <div className="mb-3 p-3 bg-[#E53935]/10 border border-[#E53935]/25 rounded-xl text-xs font-bold text-[#E53935] text-center">
                {otpError}
              </div>
            )}

            {/* 6-Digit OTP Inputs */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono font-black text-xl rounded-xl border transition-all outline-none ${
                      digit
                        ? 'border-[#00C853] bg-[#00C853]/10 text-[#0B3D2E] ring-2 ring-[#00C853]/20'
                        : 'border-[#E4EAE6] bg-[#F4F7F5] text-[#13201B] focus:border-[#00C853] focus:bg-white'
                    }`}
                  />
                ))}
              </div>

              {/* Resend Actions */}
              <div className="flex items-center justify-between text-xs text-[#5B6B63] px-1">
                <span>Didn't receive code?</span>
                {resendCooldown > 0 ? (
                  <span className="font-semibold text-[#8A978F]">
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-bold text-[#00A94D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Resend New OTP
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={otpLoading || otpDigits.join('').length !== 6}
                  className="w-full py-3.5 bg-[#00C853] hover:bg-[#00A94D] active:scale-[0.99] text-[#0B3D2E] font-black rounded-xl shadow-md transition-all text-xs tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {otpLoading ? 'VERIFYING...' : 'VERIFY & COMPLETE REGISTRATION'}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpModalOpen(false)}
                  className="w-full py-2.5 text-xs font-bold text-[#8A978F] hover:text-[#13201B] transition-colors cursor-pointer text-center"
                >
                  Change Email / Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
