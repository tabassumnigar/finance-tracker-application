import { create } from 'zustand';
import type { AuthTokens } from '../types/auth';

const AUTH_STORAGE_KEY = 'finance-tracker-auth';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const REFRESH_EXPIRES_AT_KEY = 'refreshExpiresAt';

type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  refreshExpiresAt?: number;
  setTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
};

type PersistedAuthState = {
  state: {
    accessToken?: string;
    refreshToken?: string;
    refreshExpiresAt?: number;
  };
  version: number;
};

const readPersistedSnapshot = (): PersistedAuthState['state'] => {
  if (typeof window === 'undefined') {
    return {};
  }

  const rawSnapshot = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (rawSnapshot) {
    try {
      const parsed = JSON.parse(rawSnapshot) as PersistedAuthState;
      if (parsed?.state && typeof parsed.state === 'object') {
        return parsed.state;
      }
    } catch {
      // Fall through to flat keys.
    }
  }

  const rawRefreshExpiresAt = window.localStorage.getItem(REFRESH_EXPIRES_AT_KEY);

  return {
    accessToken: window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined,
    refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined,
    refreshExpiresAt: rawRefreshExpiresAt ? Number(rawRefreshExpiresAt) : undefined,
  };
};

const normalizePersistedTokens = (state: PersistedAuthState['state']) => ({
  accessToken: state.accessToken ?? undefined,
  refreshToken: state.refreshToken ?? undefined,
  refreshExpiresAt:
    typeof state.refreshExpiresAt === 'number' && Number.isFinite(state.refreshExpiresAt)
      ? state.refreshExpiresAt
      : undefined,
});

const writePersistedTokens = (tokens: Partial<AuthTokens>) => {
  if (typeof window === 'undefined') {
    return;
  }

  const snapshot: PersistedAuthState = {
    state: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
    },
    version: 0,
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(snapshot));

  if (tokens.accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (tokens.refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  if (typeof tokens.refreshExpiresAt === 'number') {
    window.localStorage.setItem(REFRESH_EXPIRES_AT_KEY, String(tokens.refreshExpiresAt));
  } else {
    window.localStorage.removeItem(REFRESH_EXPIRES_AT_KEY);
  }
};

const initialTokens = normalizePersistedTokens(readPersistedSnapshot());

export const getStoredAccessToken = () => normalizePersistedTokens(readPersistedSnapshot()).accessToken;
export const getResolvedAccessToken = () => useAuthStore.getState().accessToken ?? getStoredAccessToken();

export const useAuthStore = create<AuthState>((set) => ({
  ...initialTokens,
  setTokens: (tokens) => {
    writePersistedTokens(tokens);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
    });
  },
  clearAuth: () => {
    writePersistedTokens({});
    set({
      accessToken: undefined,
      refreshToken: undefined,
      refreshExpiresAt: undefined,
    });
  },
}));
