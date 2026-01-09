import type { CustomTheme } from '../types/prefs';

export const CUSTOM_THEME_PREFIX = 'custom-';

export function isCustomThemeId(themeId: string): boolean {
  return themeId.startsWith(CUSTOM_THEME_PREFIX);
}

export function createCustomThemeId(): string {
  return `${CUSTOM_THEME_PREFIX}${Date.now()}`;
}

export function serializeCustomThemes(
  themes: Record<string, CustomTheme> | undefined,
): string | undefined {
  return themes ? JSON.stringify(themes) : undefined;
}

export function deserializeCustomThemes(
  json: string | undefined,
): Record<string, CustomTheme> | undefined {
  if (!json) return undefined;
  return JSON.parse(json) as Record<string, CustomTheme>;
}

export function getCustomThemeName(
  themeId: string,
  customThemes: Record<string, CustomTheme> | undefined,
): string {
  if (!customThemes) return 'Custom Theme';
  const sortedKeys = Object.keys(customThemes).sort();
  const index = sortedKeys.indexOf(themeId);
  return index >= 0 ? `Custom Theme ${index + 1}` : 'Custom Theme';
}

export function parseThemeText(text: string): Record<string, string> {
  const colors: Record<string, string> = {};
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();

    if (value.endsWith(';')) {
      value = value.slice(0, -1).trim();
    }

    if (key && value) {
      colors[key] = value;
    }
  }

  return colors;
}

export function serializeThemeColors(colors: Record<string, string>): string {
  return Object.entries(colors)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
}
