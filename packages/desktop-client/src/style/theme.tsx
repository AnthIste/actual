import { useCallback, useEffect, useMemo, useState } from 'react';

import { isNonProductionEnvironment } from 'loot-core/shared/environment';
import {
  deserializeCustomThemes,
  getCustomThemeName,
  serializeCustomThemes,
} from 'loot-core/shared/themes';
import type { CustomTheme, DarkTheme, Theme } from 'loot-core/types/prefs';

import * as darkTheme from './themes/dark';
import * as developmentTheme from './themes/development';
import * as lightTheme from './themes/light';
import * as midnightTheme from './themes/midnight';

import { useGlobalPref } from '@desktop-client/hooks/useGlobalPref';
import { useSyncedPref } from '@desktop-client/hooks/useSyncedPref';

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

export { getCustomThemeName };

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

export function useCustomThemes(): [
  Record<string, CustomTheme> | undefined,
  (themes: Record<string, CustomTheme> | undefined) => void,
] {
  const [json, setJson] = useSyncedPref('customThemes');

  const customThemes = useMemo(() => deserializeCustomThemes(json), [json]);

  const setCustomThemes = useCallback(
    (t: Record<string, CustomTheme> | undefined) =>
      setJson(serializeCustomThemes(t)),
    [setJson],
  );

  return [customThemes, setCustomThemes];
}

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
