import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCopy } from '@actual-app/components/icons/v1';
import { Select } from '@actual-app/components/select';
import { Text } from '@actual-app/components/text';
import { Tooltip } from '@actual-app/components/tooltip';
import { theme as themeStyle } from '@actual-app/components/theme';
import { tokens } from '@actual-app/components/tokens';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { createCustomThemeId } from 'loot-core/shared/themes';
import { type DarkTheme, type Theme } from 'loot-core/types/prefs';

import { Column, Setting } from './UI';

import { useSidebar } from '@desktop-client/components/sidebar/SidebarProvider';
import {
  useTheme,
  usePreferredDarkTheme,
  useCustomThemes,
  useThemeOptions,
  darkThemeOptions,
  getThemeColors,
} from '@desktop-client/style';

export function ThemeSettings() {
  const { t } = useTranslation();
  const sidebar = useSidebar();
  const [theme, switchTheme] = useTheme();
  const [darkTheme, switchDarkTheme] = usePreferredDarkTheme();
  const [customThemes, setCustomThemes] = useCustomThemes();
  const themeOptions = useThemeOptions();

  const handleCustomize = () => {
    const colors = getThemeColors(theme, customThemes);
    const newKey = createCustomThemeId();
    const updatedThemes = {
      ...(customThemes || {}),
      [newKey]: { colors },
    };

    setCustomThemes(updatedThemes);
    switchTheme(newKey);
  };

  return (
    <Setting
      primaryAction={
        <View
          style={{
            flexDirection: 'column',
            gap: '1em',
            width: '100%',
            [`@media (min-width: ${
              sidebar.floating
                ? tokens.breakpoint_small
                : tokens.breakpoint_medium
            })`]: {
              flexDirection: 'row',
              alignItems: 'flex-end',
            },
          }}
        >
          <Column title={t('Theme')} style={{ flexGrow: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Select<Theme>
                onChange={value => {
                  switchTheme(value);
                }}
                value={theme}
                options={themeOptions}
                className={css({
                  '&[data-hovered]': {
                    backgroundColor: themeStyle.buttonNormalBackgroundHover,
                  },
                })}
              />
              {theme !== 'auto' && (
                <Tooltip content={t('Copy and customize')}>
                  <Button
                    variant="bare"
                    aria-label={t('Copy and customize')}
                    onPress={handleCustomize}
                  >
                    <SvgCopy style={{ width: 14, height: 14 }} />
                  </Button>
                </Tooltip>
              )}
            </View>
          </Column>
          {theme === 'auto' && (
            <Column title={t('Dark theme')}>
              <Select<DarkTheme>
                onChange={value => {
                  switchDarkTheme(value);
                }}
                value={darkTheme}
                options={darkThemeOptions}
                className={css({
                  '&[data-hovered]': {
                    backgroundColor: themeStyle.buttonNormalBackgroundHover,
                  },
                })}
              />
            </Column>
          )}
        </View>
      }
    >
      <Text>
        <Trans>
          <strong>Themes</strong> change the user interface colors.
        </Trans>
      </Text>
    </Setting>
  );
}
