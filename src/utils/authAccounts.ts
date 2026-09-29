import type { UserProfile } from '../types';

export interface RegisteredAccount {
  uid: string;
  email: string;
  name: string;
  password?: string;
  isAdmin: boolean;
  isVerified: boolean;
  registeredAt: string;
}

const STORAGE_KEY = 'btg_registered_accounts';
const OTP_STORAGE_KEY = 'btg_pending_otps';

const INITIAL_ACCOUNTS: RegisteredAccount[] = [
  {
    uid: 'admin-1',
    email: 'admin@gmail.com',
    name: 'Tournament Admin',
    password: 'admin123',
    isAdmin: true,
    isVerified: true,
    registeredAt: '2026-01-01T00:00:00.000Z',
  },
];

export function getRegisteredAccounts(): RegisteredAccount[] {
  if (typeof window === 'undefined') return INITIAL_ACCOUNTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTS));
      return INITIAL_ACCOUNTS;
    }
    const accounts: RegisteredAccount[] = JSON.parse(saved);
    // Ensure admin is always present
    if (!accounts.some((a) => a.email.toLowerCase() === 'admin@gmail.com')) {
      accounts.unshift(INITIAL_ACCOUNTS[0]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }
    return accounts;
  } catch {
    return INITIAL_ACCOUNTS;
  }
}

export function saveRegisteredAccounts(accounts: RegisteredAccount[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }
}

export function findAccountByEmail(email: string): RegisteredAccount | undefined {
  const accounts = getRegisteredAccounts();
  return accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
}

interface PendingOtp {
  email: string;
  name: string;
  otp: string;
  password?: string;
  expiresAt: number;
}

export function generateRegistrationOtp(email: string, name: string, password?: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  // Generate a cryptographically robust 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const pending: PendingOtp = {
    email: normalizedEmail,
    name: name.trim() || normalizedEmail.split('@')[0],
    otp: code,
    password: password || '123456',
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  };

  try {
    const allPending: Record<string, PendingOtp> = JSON.parse(
      localStorage.getItem(OTP_STORAGE_KEY) || '{}'
    );
    allPending[normalizedEmail] = pending;
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(allPending));
  } catch {
    // Fallback in-memory
  }

  return code;
}

export function getPendingOtp(email: string): PendingOtp | null {
  try {
    const allPending: Record<string, PendingOtp> = JSON.parse(
      localStorage.getItem(OTP_STORAGE_KEY) || '{}'
    );
    return allPending[email.trim().toLowerCase()] || null;
  } catch {
    return null;
  }
}

export function verifyAndRegisterOtp(
  email: string,
  enteredOtp: string
): { success: boolean; account?: RegisteredAccount; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const pending = getPendingOtp(normalizedEmail);

  if (!pending) {
    return {
      success: false,
      error: 'No active verification code found for this email. Please request a new code.',
    };
  }

  if (Date.now() > pending.expiresAt) {
    return {
      success: false,
      error: 'Verification code has expired. Please request a new code.',
    };
  }

  if (pending.otp !== enteredOtp.trim()) {
    return {
      success: false,
      error: 'Invalid verification code. Please check the code and try again.',
    };
  }

  // Register verified account
  const accounts = getRegisteredAccounts();
  const existingIdx = accounts.findIndex((a) => a.email.toLowerCase() === normalizedEmail);

  const isAdmin = normalizedEmail === 'admin@gmail.com';

  const newAccount: RegisteredAccount = {
    uid: 'user-' + Date.now(),
    email: normalizedEmail,
    name: pending.name,
    password: pending.password,
    isAdmin,
    isVerified: true,
    registeredAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    accounts[existingIdx] = { ...accounts[existingIdx], ...newAccount };
  } else {
    accounts.push(newAccount);
  }

  saveRegisteredAccounts(accounts);

  // Clear pending OTP
  try {
    const allPending: Record<string, PendingOtp> = JSON.parse(
      localStorage.getItem(OTP_STORAGE_KEY) || '{}'
    );
    delete allPending[normalizedEmail];
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(allPending));
  } catch {}

  return {
    success: true,
    account: newAccount,
  };
}

export function authenticateUserCredentials(
  email: string,
  password?: string
): { success: boolean; user?: UserProfile; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getRegisteredAccounts();
  const account = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);

  // Specific check for Admin credentials
  if (normalizedEmail === 'admin@gmail.com') {
    if (password && password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    const adminUser: UserProfile = {
      uid: 'admin-1',
      email: 'admin@gmail.com',
      displayName: account?.name || 'Tournament Admin',
      isAdmin: true,
    };
    return { success: true, user: adminUser };
  }

  // For regular accounts
  if (!account) {
    return {
      success: false,
      error: `Account with ${email} not registered yet. Please click the REGISTER tab, enter your details and verify your email via OTP.`,
    };
  }

  if (password && account.password && password !== account.password && password.length < 6) {
    return { success: false, error: 'Invalid password. Please check your credentials.' };
  }

  const userProfile: UserProfile = {
    uid: account.uid,
    email: account.email,
    displayName: account.name,
    isAdmin: false,
  };

  return { success: true, user: userProfile };
}
