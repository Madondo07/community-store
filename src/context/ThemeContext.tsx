import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

import { ColorPalette, getColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ThemePreference = 'system' | 'light' | 'dark';
type ActiveScheme = 'light' | 'dark';

const STORAGE_KEY = '@swych/theme-preference';

interface ThemeState {
  themePreference: ThemePreference;
  initializing: boolean;
}

type ThemeAction =
  | { type: 'SET_PREFERENCE'; payload: ThemePreference }
  | { type: 'HYDRATE'; payload: ThemePreference | null };

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'HYDRATE':
      return { themePreference: action.payload ?? state.themePreference, initializing: false };
    case 'SET_PREFERENCE':
      return { ...state, themePreference: action.payload };
    default:
      return state;
  }
}

interface ThemeContextValue {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  activeScheme: ActiveScheme;
  colors: ColorPalette;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [state, dispatch] = useReducer(themeReducer, {
    themePreference: 'system',
    initializing: true,
  });

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!isMounted) return;
        const valid: ThemePreference[] = ['system', 'light', 'dark'];
        const parsed = stored && valid.includes(stored as ThemePreference) ? (stored as ThemePreference) : null;
        dispatch({ type: 'HYDRATE', payload: parsed });
      })
      .catch(() => {
        if (isMounted) dispatch({ type: 'HYDRATE', payload: null });
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    dispatch({ type: 'SET_PREFERENCE', payload: pref });
    AsyncStorage.setItem(STORAGE_KEY, pref).catch((err) => {
      console.warn('Failed to persist theme preference:', err);
    });
  }, []);

 const activeScheme: ActiveScheme =
  state.themePreference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : state.themePreference;

  const colors = useMemo(() => getColors(activeScheme), [activeScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ themePreference: state.themePreference, setThemePreference, activeScheme, colors }),
    [state.themePreference, setThemePreference, activeScheme, colors]
  );

  if (state.initializing) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return ctx;
}