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
  /** 🆕 وضع التباين العالي - يقوّي الألوان للـ accessibility */
  highContrast: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
}

const FONT_SCALE_MAP: Record<FontScale, number> = {
  sm: 0.92,
  md: 1,
  lg: 1.12,
  xl: 1.24,
};

const STORAGE_MODE_KEY = '@nafahat/theme-mode';
const STORAGE_FONT_KEY = '@nafahat/font-scale';
const STORAGE_HC_KEY = '@nafahat/high-contrast';

/**
 * 🆕 يحوّل palette عادي → palette عالي التباين.
 *   الأخضر يتعمّق، الذهبي يتشبّع، الـ text يتقوّى، الحدود تزداد opacity.
 *   يحافظ على هوية green + gold (مش invert) - بس يقوّيها للـ accessibility.
 */
function applyHighContrast(c: ThemeColors, isDark: boolean): ThemeColors {
  if (isDark) {
    return {
      ...c,
      textPrimary: '#FFFFFF',
      textSecondary: '#F5EAC4',
      border: 'rgba(212, 181, 112, 0.45)',
      borderStrong: 'rgba(212, 181, 112, 0.75)',
      borderGold: 'rgba(212, 181, 112, 0.80)',
      divider: 'rgba(212, 181, 112, 0.30)',
      accent: '#FFD580',
      primary: '#15B68D',
    };
  }
  return {
    ...c,
    textPrimary: '#000000',
    textSecondary: '#0A1815',
    border: 'rgba(10, 24, 21, 0.40)',
    borderStrong: 'rgba(10, 24, 21, 0.70)',
    borderGold: 'rgba(158, 125, 79, 0.75)',
    divider: 'rgba(10, 24, 21, 0.25)',
    accent: '#8B6F2C',
    primary: '#031816',
  };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const [fontScale, setFontScaleState] = useState<FontScale>('md');
  const [highContrast, setHighContrastState] = useState<boolean>(false);

  // التطبيق يعتمد محاذاة RTL يدوية على أساس isRTL=false — نُبقي النظام LTR.
  useEffect(() => {
    if (I18nManager.isRTL) {
      try {
        I18nManager.allowRTL(false);
        I18nManager.forceRTL(false);
      } catch {}
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [storedMode, storedFont, storedHC] = await Promise.all([
          AsyncStorage.getItem(STORAGE_MODE_KEY),
          AsyncStorage.getItem(STORAGE_FONT_KEY),
          AsyncStorage.getItem(STORAGE_HC_KEY),
        ]);
        if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
          setModeState(storedMode);
        }
        if (storedFont === 'sm' || storedFont === 'md' || storedFont === 'lg' || storedFont === 'xl') {
          setFontScaleState(storedFont);
        }
        if (storedHC === '1') setHighContrastState(true);
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

  const setHighContrast = useCallback((next: boolean) => {
    setHighContrastState(next);
    AsyncStorage.setItem(STORAGE_HC_KEY, next ? '1' : '0').catch(() => {});
  }, []);

  const resolvedMode: 'light' | 'dark' = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
    return mode;
  }, [mode, systemScheme]);

  const theme = useMemo<Theme>(() => {
    const isDark = resolvedMode === 'dark';
    const baseColors = isDark ? darkColors : lightColors;
    const colors = highContrast ? applyHighContrast(baseColors, isDark) : baseColors;
    return {
      mode: resolvedMode,
      colors,
      spacing,
      radius,
      shadows,
      opacity,
      typography,
      fontFamilies,
      hitSlop,
      isRTL: true,
      fontScale: FONT_SCALE_MAP[fontScale],
      highContrast,
    };
  }, [resolvedMode, fontScale, highContrast]);

  const contextValue = useMemo(
    () => ({ theme, mode, setMode, fontScale, setFontScale, highContrast, setHighContrast }),
    [theme, mode, setMode, fontScale, setFontScale, highContrast, setHighContrast],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
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
  return {
    mode: ctx.mode, setMode: ctx.setMode,
    fontScale: ctx.fontScale, setFontScale: ctx.setFontScale,
    highContrast: ctx.highContrast, setHighContrast: ctx.setHighContrast,
  };
}
