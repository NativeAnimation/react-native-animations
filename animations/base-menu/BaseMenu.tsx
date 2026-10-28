import {
  BaseTriggerState,
  baseActivationProps,
  useBaseReducedMotion,
  useBaseTheme,
  type BaseTheme,
} from '../base-theme';
import Animated, {
  ReduceMotion,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import React from 'react';
import {
  Platform,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type ViewProps,
} from 'react-native';
import Check from 'lucide-react-native/icons/check';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

import { AnchoredPanel, useAnchoredPanel } from './AnchoredPanel';

// Web only: no browser focus outline; the item highlight shows focus instead.
const NO_WEB_OUTLINE =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

export type BaseMenuItem = {
  /** Item kind; regular action by default. */
  type?: 'item' | 'checkbox' | 'separator' | 'label';
  /** Visible label. */
  label?: string;
  /** Caller-supplied icon or icon renderer. */
  icon?: React.ReactNode;
  /** Optional shortcut hint; the caller owns shortcut handling. */
  shortcut?: string;
  /** Uses the destructive text color. */
  destructive?: boolean;
  /** Controlled checkbox state. */
  checked?: boolean;
  /** Dims the control and prevents activation. */
  disabled?: boolean;
  /** Called on the RN thread after selection. */
  onSelect?: () => void;
};
export type BaseMenuProps = {
  /** Element that accepts an injected onPress callback. */
  trigger: React.ReactElement<{ onPress?: () => void; testID?: string }>;
  /** Available actions or navigation destinations. */
  items: BaseMenuItem[];
  /** Horizontal alignment relative to the trigger. */
  align?: 'start' | 'end';
  /** Optionally controls the anchored panel. */
  open?: boolean;
  /** Called when opening or closing is requested. */
  onOpenChange?: (open: boolean) => void;
  /** Accessible name for this control or task. */
  accessibilityLabel?: string;
  /** Overrides the nearest BaseThemeProvider. */
  theme?: BaseTheme;
  /** Style applied to the container. */
  style?: StyleProp<ViewStyle>;
  /** Stable identifier for the root or trigger. */
  testID?: string;
};
export function BaseMenu({
  trigger,
  items,
  align = 'start',
  open: controlled,
  onOpenChange,
  accessibilityLabel,
  theme: override,
  style,
  testID,
}: BaseMenuProps) {
  const theme = useBaseTheme(override);
  const { triggerRef, open, changeOpen } = useAnchoredPanel(
    controlled,
    onOpenChange,
  );
  return (
    <View style={style}>
      <View
        ref={triggerRef}
        collapsable={false}
        style={{ alignSelf: 'flex-start' }}
      >
        <BaseTriggerState.Provider value={{ expanded: open }}>
          {React.cloneElement(
            trigger as React.ReactElement<ViewProps & { onPress?: () => void }>,
            {
              'aria-expanded': open,
              accessibilityState: {
                ...(trigger.props as ViewProps).accessibilityState,
                expanded: open,
              },
              testID: testID ?? trigger.props.testID,
              onPress: () => {
                trigger.props.onPress?.();
                changeOpen(!open);
              },
            },
          )}
        </BaseTriggerState.Provider>
      </View>
      <AnchoredPanel
        open={open}
        onClose={() => changeOpen(false)}
        anchorRef={triggerRef}
        align={align}
        theme={theme}
        accessibilityLabel={accessibilityLabel}
      >
        {items.map((item, index) =>
          item.type === 'separator' ? (
            <View
              key={index}
              style={{
                height: 1,
                backgroundColor: theme.colors.border,
                marginVertical: 4,
                marginHorizontal: -4,
              }}
            />
          ) : item.type === 'label' ? (
            <Text
              key={index}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 6,
                fontFamily: theme.fonts.medium,
                fontSize: 12,
                lineHeight: 20,
                color: theme.colors.mutedForeground,
              }}
            >
              {item.label}
            </Text>
          ) : (
            <MenuRow
              key={index}
              item={item}
              theme={theme}
              onSelect={() => {
                changeOpen(false);
                item.onSelect?.();
              }}
            />
          ),
        )}
      </AnchoredPanel>
    </View>
  );
}
function MenuRow({
  item,
  theme,
  onSelect,
}: {
  item: BaseMenuItem;
  theme: BaseTheme;
  onSelect: () => void;
}) {
  const reduced = useBaseReducedMotion();
  const highlight = useSharedValue(0);
  const tap = Gesture.Tap()
    .enabled(!item.disabled)
    .onBegin(() => {
      highlight.set(
        withTiming(1, {
          reduceMotion: ReduceMotion.Never,
          duration: reduced ? 0 : 100,
        }),
      );
    })
    .onFinalize(() => {
      highlight.set(
        withTiming(0, {
          reduceMotion: ReduceMotion.Never,
          duration: reduced ? 0 : 100,
        }),
      );
    })
    .onEnd((_event, success) => {
      if (success) scheduleOnRN(onSelect);
    });
  const animated = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      highlight.get(),
      [0, 1],
      [theme.colors.popover, theme.colors.accent],
    ),
  }));
  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        accessible
        accessibilityRole={item.type === 'checkbox' ? 'checkbox' : 'menuitem'}
        accessibilityLabel={item.label}
        accessibilityState={{
          disabled: item.disabled,
          ...(item.type === 'checkbox'
            ? { checked: Boolean(item.checked) }
            : {}),
        }}
        aria-checked={
          item.type === 'checkbox' ? Boolean(item.checked) : undefined
        }
        aria-disabled={item.disabled}

        {
          /* RN Web forwards DOM events rather than native event objects. */
          ...((Platform.OS === 'web'
            ? {
                tabIndex: item.disabled ? -1 : 0,
                onFocus: () =>
                  highlight.set(
                    withTiming(1, {
                      reduceMotion: ReduceMotion.Never,
                      duration: reduced ? 0 : 100,
                    }),
                  ),
                onBlur: () =>
                  highlight.set(
                    withTiming(0, {
                      reduceMotion: ReduceMotion.Never,
                      duration: reduced ? 0 : 100,
                    }),
                  ),
                onKeyDown: (event: React.KeyboardEvent) => {
                  if (
                    !item.disabled &&
                    (event.key === 'Enter' || event.key === ' ')
                  ) {
                    event.preventDefault();
                    onSelect();
                  }
                },
              }
            : {}) as object)
        }
        {
          /* RN Web forwards DOM events rather than native event objects. */
          ...(baseActivationProps(onSelect, item.disabled) as object)
        }
        style={[
          NO_WEB_OUTLINE,
          [
            {
              minHeight: Platform.OS === 'android' ? 48 : 44,
              paddingHorizontal: 8,
              paddingVertical: 12,
              borderRadius: theme.radius.sm,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              opacity: item.disabled ? 0.5 : 1,
            },
          ],
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              top: 6,
              bottom: 6,
              borderRadius: theme.radius.sm,
            },
            animated,
          ]}
        />
        {item.type === 'checkbox' ? (
          <View style={{ width: 24, alignItems: 'center' }}>
            {item.checked ? (
              <Check size={14} color={theme.colors.popoverForeground} />
            ) : null}
          </View>
        ) : item.icon ? (
          <View style={{ width: 16 }}>{item.icon}</View>
        ) : null}
        <Text
          style={{
            flex: 1,
            fontFamily: theme.fonts.regular,
            fontSize: 14,
            lineHeight: 20,
            color: item.destructive
              ? theme.colors.destructive
              : theme.colors.popoverForeground,
          }}
        >
          {item.label}
        </Text>
        {item.shortcut ? (
          <Text
            style={{
              fontFamily: theme.fonts.regular,
              fontSize: 12,
              color: theme.colors.mutedForeground,
            }}
          >
            {item.shortcut}
          </Text>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}
export default BaseMenu;
