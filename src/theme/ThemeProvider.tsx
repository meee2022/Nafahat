import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Appearance, ColorSchemeName, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from './colors';
import { spacing, radius, shadows, opacity, hitSlop } from './spacing';
import { typography, fontFamilies } from './typography';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontScale = 'sm' | 'md' | 'lg' | 'xl';

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  opacity: typeof opacity;
  typography: typeof typography;
  fontFamilies: typeof fontFamilies;
  hitSlop: typeof hitSlop;
  isRTL: boolean;
  fontScale: number;
}

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
}

const FONT_SCALE_MAP: Record<FontScale, number> = {
  sm: 0.92,
  md: 1,
  lg: 1.12,
  xl: 1.24,
};

const STORAGE_MODE_KEY = '@nafahat/theme-mode';
const STORAGE_FONT_KEY = '@nafahat/font-scale';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const [fontScale, setFontScaleState] = useState<FontScale>('md');

  // تفعيل RTL مرة واحدة
  useEffect(() => {
    if (!I18nManager.isRTL) {
      try {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
      } catch {}
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [storedMode, storedFont] = await Promise.all([
          AsyncStorage.getItem(STORAGE_MODE_KEY),
          AsyncStorage.getItem(STORAGE_FONT_KEY),
        ]);
        if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
          setModeState(storedMode);
        }
        if (storedFont === 'sm' || storedFont === 'md' || storedFont === 'lg' || storedFont === 'xl') {
          setFontScaleState(storedFont);
        }
      } catch {}
    })();

    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_MODE_KEY, next).catch(() => {});
  }, []);

  const setFontScale = useCallback((next: FontScale) => {
    setFontScaleState(next);
    AsyncStorage.setItem(STORAGE_FONT_KEY, next).catch(() => {});
  }, []);

  const resolvedMode: 'light' | 'dark' = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
    return mode;
  }, [mode, systemScheme]);

  const theme = useMemo<Theme>(() => ({
    mode: resolvedMode,
    colors: resolvedMode === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    shadows,
    opacity,
    typography,
    fontFamilies,
    hitSlop,
    isRTL: true,
    fontScale: FONT_SCALE_MAP[fontScale],
  }), [resolvedMode, fontScale]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, fontScale, setFontScale }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx.theme;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return { mode: ctx.mode, setMode: ctx.setMode, fontScale: ctx.fontScale, setFontScale: ctx.setFontScale };
}
