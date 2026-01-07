import { useState, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { Setting } from './UI';

import { LabeledCheckbox } from '@desktop-client/components/forms/LabeledCheckbox';
import {
  useTheme,
  useCustomThemes,
  isCustomTheme,
} from '@desktop-client/style';

// Parse "key: value;" format into Record<string, string>
function parseThemeText(text: string): Record<string, string> {
  const colors: Record<string, string> = {};
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();

    // Remove trailing semicolon if present
    if (value.endsWith(';')) {
      value = value.slice(0, -1).trim();
    }

    if (key && value) {
      colors[key] = value;
    }
  }

  return colors;
}

// Serialize Record<string, string> to "key: value;" format
function serializeThemeColors(colors: Record<string, string>): string {
  return Object.entries(colors)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
}

export function CustomThemeEditor() {
  const { t } = useTranslation();
  const [activeTheme, switchTheme] = useTheme();
  const [customThemes, setCustomThemes] = useCustomThemes();
  const [showRawValues, setShowRawValues] = useState(false);
  const [filter, setFilter] = useState('');

  const isActive = isCustomTheme(activeTheme, customThemes);

  const currentColors = useMemo(() => {
    if (!isActive || !customThemes) return {};
    return customThemes[activeTheme]?.colors || {};
  }, [isActive, customThemes, activeTheme]);

  const [textValue, setTextValue] = useState(() =>
    serializeThemeColors(currentColors),
  );

  // Parsed colors from text value for grid view
  const editedColors = useMemo(() => parseThemeText(textValue), [textValue]);

  // Reset text value when switching to a different custom theme
  useMemo(() => {
    setTextValue(serializeThemeColors(currentColors));
  }, [currentColors]);

  // Update a single color in grid mode
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

    // Find the previous custom theme (the one before the deleted one)
    const sortedKeys = Object.keys(customThemes).sort();
    const currentIndex = sortedKeys.indexOf(activeTheme);
    const previousKey =
      currentIndex > 0 ? sortedKeys[currentIndex - 1] : remainingKeys[0];

    setCustomThemes(remainingKeys.length > 0 ? remainingThemes : undefined);
    switchTheme(previousKey || 'light');
  };

  // Only render when a custom theme is active
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

        {/* Grid editor (default) */}
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

        {/* Raw text editor */}
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
