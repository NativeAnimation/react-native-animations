import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BaseThemeProvider, useBaseTheme, type BaseTheme } from '../base-theme';
import { AnchoredPanel, useAnchoredPanel } from './AnchoredPanel';
import { PopoverTrigger } from './PopoverTrigger';

export type BasePopoverProps = {
  /** Visual trigger; this component owns its touch and keyboard handling. */
  trigger:
    | React.ReactNode
    | ((state: { open: boolean; onPress: () => void }) => React.ReactNode);
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  width?: number;
  accessibilityLabel?: string;
  theme?: BaseTheme;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
export function BasePopover({
  trigger,
  content,
  open: controlled,
  onOpenChange,
  side = 'bottom',
  align = 'center',
  sideOffset = 4,
  width = 288,
  accessibilityLabel = 'Open popover',
  theme: override,
  style,
  testID,
}: BasePopoverProps) {
  const theme = useBaseTheme(override);
  const { triggerRef, open, changeOpen } = useAnchoredPanel(
    controlled,
    onOpenChange,
  );
  const activate = () => changeOpen(!open);
  return (
    <View style={style}>
      <BaseThemeProvider theme={theme}>
        <PopoverTrigger
          anchorRef={triggerRef}
          theme={theme}
          label={accessibilityLabel}
          expanded={open}
          onActivate={activate}
          testID={testID}
        >
          {typeof trigger === 'function'
            ? trigger({ open, onPress: activate })
            : trigger}
        </PopoverTrigger>
      </BaseThemeProvider>
      <AnchoredPanel
        open={open}
        onClose={() => changeOpen(false)}
        anchorRef={triggerRef}
        side={side}
        align={align}
        sideOffset={sideOffset}
        width={width}
        theme={theme}
        accessibilityLabel={accessibilityLabel}
        testID={testID ? `${testID}-panel` : undefined}
      >
        {typeof content === 'string' || typeof content === 'number' ? (
          <Text
            style={{
              color: theme.colors.popoverForeground,
              fontFamily: theme.fonts.regular,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {content}
          </Text>
        ) : (
          content
        )}
      </AnchoredPanel>
    </View>
  );
}
