import { useEffect, useMemo, useState } from 'react';

import { isNonProductionEnvironment } from 'loot-core/shared/environment';
import type { CustomTheme, DarkTheme, Theme } from 'loot-core/types/prefs';

import * as darkTheme from './themes/dark';
import * as developmentTheme from './themes/development';
import * as lightTheme from './themes/light';
import * as midnightTheme from './themes/midnight';

import { useGlobalPref } from '@desktop-client/hooks/useGlobalPref';

const themes = {
  light: { name: 'Light', colors: lightTheme },
  dark: { name: 'Dark', colors: darkTheme },
  midnight: { name: 'Midnight', colors: midnightTheme },
  auto: { name: 'System default', colors: darkTheme },
  ...(isNonProductionEnvironment() && {
    development: { name: 'Development', colors: developmentTheme },
  }),
} as const;

type ThemeKey = keyof typeof themes;

export const themeOptions = Object.entries(themes).map(
  ([key, { name }]) => [key, name] as [Theme, string],
);

export const darkThemeOptions = Object.entries({
  dark: themes.dark,
  midnight: themes.midnight,
}).map(([key, { name }]) => [key, name] as [DarkTheme, string]);

// Check if a theme ID is a custom theme
export function isCustomTheme(
  themeId: string,
  customThemes: Record<string, CustomTheme> | undefined,
): boolean {
  return !(themeId in themes) && !!customThemes && themeId in customThemes;
}

// Get display name for a custom theme based on its sorted position
export function getCustomThemeName(
  themeId: string,
  customThemes: Record<string, CustomTheme> | undefined,
): string {
  if (!customThemes) return 'Custom Theme';
  const sortedKeys = Object.keys(customThemes).sort();
  const index = sortedKeys.indexOf(themeId);
  return index >= 0 ? `Custom Theme ${index + 1}` : 'Custom Theme';
}

// Get theme colors by name (checks custom themes first, then built-in)
export function getThemeColors(
  themeName: string,
  customThemes?: Record<string, CustomTheme>,
): Record<string, string> {
  if (customThemes && themeName in customThemes) {
    return { ...customThemes[themeName].colors };
  }
  const theme = themes[themeName as keyof typeof themes];
  return theme ? { ...theme.colors } : { ...darkTheme };
}

export function useTheme() {
  const [theme = 'auto', setThemePref] = useGlobalPref('theme');
  return [theme, setThemePref] as const;
}

export function usePreferredDarkTheme() {
  const [darkTheme = 'dark', setDarkTheme] =
    useGlobalPref('preferredDarkTheme');
  return [darkTheme, setDarkTheme] as const;
}

export function useCustomThemes() {
  const [customThemes, setCustomThemes] = useGlobalPref('customThemes');
  return [customThemes, setCustomThemes] as const;
}

// Dynamic theme options: built-in themes + custom themes
export function useThemeOptions(): Array<[Theme, string]> {
  const [customThemes] = useCustomThemes();

  return useMemo(() => {
    const options: Array<[Theme, string]> = [...themeOptions];

    if (customThemes) {
      const sortedKeys = Object.keys(customThemes).sort();
      sortedKeys.forEach((key, index) => {
        options.push([key, `Custom Theme ${index + 1}`]);
      });
    }

    return options;
  }, [customThemes]);
}

export function ThemeStyle() {
  const [activeTheme] = useTheme();
  const [darkThemePreference] = usePreferredDarkTheme();
  const [customThemes] = useCustomThemes();
  const [themeColors, setThemeColors] = useState<
    | typeof lightTheme
    | typeof darkTheme
    | typeof midnightTheme
    | typeof developmentTheme
    | Record<string, string>
    | undefined
  >(undefined);

  useEffect(() => {
    // Check if it's a custom theme first
    if (customThemes && activeTheme in customThemes) {
      setThemeColors(customThemes[activeTheme].colors);
      return;
    }

    if (activeTheme === 'auto') {
      const darkTheme = themes[darkThemePreference];

      function darkThemeMediaQueryListener(event: MediaQueryListEvent) {
        if (event.matches) {
          setThemeColors(darkTheme.colors);
        } else {
          setThemeColors(themes['light'].colors);
        }
      }
      const darkThemeMediaQuery = window.matchMedia(
        '(prefers-color-scheme: dark)',
      );

      darkThemeMediaQuery.addEventListener(
        'change',
        darkThemeMediaQueryListener,
      );

      if (darkThemeMediaQuery.matches) {
        setThemeColors(darkTheme.colors);
      } else {
        setThemeColors(themes['light'].colors);
      }

      return () => {
        darkThemeMediaQuery.removeEventListener(
          'change',
          darkThemeMediaQueryListener,
        );
      };
    } else {
      setThemeColors(themes[activeTheme as ThemeKey]?.colors);
    }
  }, [activeTheme, darkThemePreference, customThemes]);

  if (!themeColors) return null;

  const css = Object.entries(themeColors)
    .map(([key, value]) => `  --color-${key}: ${value};`)
    .join('\n');

  return <style>{`:root {\n${css}}`}</style>;
}
