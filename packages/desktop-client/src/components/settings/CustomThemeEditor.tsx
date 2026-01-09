import { useState, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import {
  parseThemeText,
  serializeThemeColors,
} from 'loot-core/shared/themes';

import { Setting } from './UI';

import { LabeledCheckbox } from '@desktop-client/components/forms/LabeledCheckbox';
import { useTheme, useCustomThemes } from '@desktop-client/style';

export function CustomThemeEditor() {
  const { t } = useTranslation();
  const [activeTheme, switchTheme] = useTheme();
  const [customThemes, setCustomThemes] = useCustomThemes();
  const [showRawValues, setShowRawValues] = useState(false);
  const [filter, setFilter] = useState('');

  const isActive = customThemes !== undefined && activeTheme in customThemes;

  const currentColors = useMemo(() => {
    if (!isActive || !customThemes) return {};
    return customThemes[activeTheme]?.colors || {};
  }, [isActive, customThemes, activeTheme]);

  const [textValue, setTextValue] = useState(() =>
    serializeThemeColors(currentColors),
  );

  const editedColors = useMemo(() => parseThemeText(textValue), [textValue]);

  useMemo(() => {
    setTextValue(serializeThemeColors(currentColors));
  }, [currentColors]);

  const updateColor = (key: string, value: string) => {
    const newColors = { ...editedColors, [key]: value };
    setTextValue(serializeThemeColors(newColors));
  };

  const hasChanges = useMemo(() => {
    const editedColors = parseThemeText(textValue);
    const currentKeys = Object.keys(currentColors);
    const editedKeys = Object.keys(editedColors);

    if (currentKeys.length !== editedKeys.length) return true;

    for (const key of currentKeys) {
      if (currentColors[key] !== editedColors[key]) return true;
    }

    return false;
  }, [textValue, currentColors]);

  const handleSave = () => {
    if (!customThemes || !isActive) return;

    const newColors = parseThemeText(textValue);
    const updatedThemes = {
      ...customThemes,
      [activeTheme]: { colors: newColors },
    };

    setCustomThemes(updatedThemes);
  };

  const handleDelete = () => {
    if (!customThemes) return;

    const { [activeTheme]: _, ...remainingThemes } = customThemes;
    const remainingKeys = Object.keys(remainingThemes).sort();
    const sortedKeys = Object.keys(customThemes).sort();
    const currentIndex = sortedKeys.indexOf(activeTheme);
    const previousKey =
      currentIndex > 0 ? sortedKeys[currentIndex - 1] : remainingKeys[0];

    setCustomThemes(remainingKeys.length > 0 ? remainingThemes : undefined);
    switchTheme(previousKey || 'light');
  };

  if (!isActive) {
    return null;
  }

  return (
    <Setting>
      <Text>
        <Trans>
          <strong>Custom themes</strong> can be created by modifying the color
          values below.
        </Trans>
      </Text>

      <View style={{ width: '100%', gap: 10 }}>
        <LabeledCheckbox
          id="show-raw-values"
          checked={showRawValues}
          onChange={() => setShowRawValues(!showRawValues)}
        >
          <Trans>Show raw values</Trans>
        </LabeledCheckbox>

        {!showRawValues && (
          <View style={{ gap: 8 }}>
            <Input
              value={filter}
              onChangeValue={setFilter}
              placeholder={t('Filter properties...')}
              style={{ width: '100%' }}
            />
            <View
              style={{
                width: '100%',
                maxHeight: 300,
                overflow: 'auto',
                border: `1px solid ${theme.formInputBorder}`,
                borderRadius: 4,
                backgroundColor: theme.formInputBackground,
              }}
            >
              {Object.keys(editedColors).length === 0 ? (
                <Text
                  style={{
                    padding: 20,
                    color: theme.formInputTextPlaceholder,
                    fontStyle: 'italic',
                  }}
                >
                  <Trans>
                    No colors defined. Switch to Text mode to add colors.
                  </Trans>
                </Text>
              ) : (
                Object.entries(editedColors)
                  .filter(([key]) =>
                    key.toLowerCase().includes(filter.toLowerCase()),
                  )
                  .map(([key, value]) => (
                    <View
                      key={key}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flexShrink: 0,
                        gap: 8,
                        padding: '0 5px',
                        borderBottom: `1px solid ${theme.tableBorder}`,
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: 'monospace',
                          fontSize: 12,
                          color: theme.formInputText,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={key}
                      >
                        {key}
                      </Text>
                      <input
                        type="color"
                        value={value.startsWith('#') ? value : '#000000'}
                        onChange={e => updateColor(key, e.target.value)}
                        style={{
                          width: 28,
                          height: 28,
                          padding: 0,
                          border: `1px solid ${theme.formInputBorder}`,
                          borderRadius: 4,
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                        }}
                        title={t('Pick color')}
                      />
                      <Input
                        value={value}
                        onChangeValue={newValue => updateColor(key, newValue)}
                        style={{
                          width: 90,
                          fontFamily: 'monospace',
                          fontSize: 12,
                        }}
                      />
                    </View>
                  ))
              )}
            </View>
          </View>
        )}

        {showRawValues && (
          <textarea
            value={textValue}
            onChange={e => {
              setTextValue(e.target.value);
            }}
            placeholder="pageBackground: #1a1a2e;
buttonPrimaryBackground: #e94560;
sidebarBackground: #16213e;"
            style={{
              width: '100%',
              minHeight: 200,
              padding: 10,
              fontFamily: 'monospace',
              fontSize: 13,
              backgroundColor: theme.formInputBackground,
              color: theme.formInputText,
              border: `1px solid ${theme.formInputBorder}`,
              borderRadius: 4,
              resize: 'vertical',
            }}
          />
        )}

        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Button
            onPress={handleSave}
            variant="primary"
            isDisabled={!hasChanges}
          >
            <Trans>Save</Trans>
          </Button>
          <Button
            onPress={() => setTextValue(serializeThemeColors(currentColors))}
            variant="bare"
            isDisabled={!hasChanges}
          >
            <Trans>Revert</Trans>
          </Button>
          <Button onPress={handleDelete} variant="bare">
            <Trans>Delete</Trans>
          </Button>
        </View>
      </View>
    </Setting>
  );
}
